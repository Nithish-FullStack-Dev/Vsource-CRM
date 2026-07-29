/**
 * lib/notification.service.ts
 *
 * Central notification service for the CRM.
 *
 * Recipient rules:
 * - Super Admin: receives every notification.
 * - Director: receives every notification.
 * - Branch Manager: receives notifications from assigned branches.
 * - Other roles: receive notifications for actions they performed.
 * - Explicit recipients are added only for assignment/reminder use cases.
 *
 * Architecture:
 * - This service writes only PENDING NotificationOutbox rows.
 * - The notification processor creates the final Notification record.
 * - The processor then emits notification:new through Socket.IO.
 */

import { randomUUID } from "node:crypto";

import db from "@/lib/prisma";
import { ROLES } from "@/lib/rbac";
import { NotificationPriority, Prisma } from "@/generated/prisma/client";

// -----------------------------------------------------------------------------
// Event types
// -----------------------------------------------------------------------------

export type NotificationEventKey =
  | "LEAD_CREATED"
  | "LEAD_ASSIGNED"
  | "LEAD_STATUS_CHANGED"
  | "LEAD_CONVERTED"
  | "FOLLOWUP_SCHEDULED"
  | "FOLLOWUP_REMINDER"
  | "STUDENT_CREATED"
  | "STUDENT_STATUS_CHANGED"
  | "PRIORITY_UCOL"
  | "PRIORITY_COL"
  | "COL"
  | "UCOL"
  | "LOAN_CREATED"
  | "LOAN_APPROVED"
  | "LOAN_REJECTED"
  | "LOAN_DISBURSED"
  | "VISA_APPROVED"
  | "VISA_REJECTED";

export interface RecipientInfo {
  id: string;
  roleName: string;
}

export interface RoleBasedNotificationPayload {
  eventKey: NotificationEventKey;

  getTitles: (roleName: string) => {
    title: string;
    message?: string;
  };

  defaultMessage: string;

  entityType: string;
  entityId: string;

  branchId?: string;
  actorId?: string;

  actionUrl?: string;
  priority?: NotificationPriority;

  metadata?: Record<string, unknown>;

  /**
   * Date and time when the outbox event becomes eligible for processing.
   *
   * Defaults to the current time for immediate notifications.
   */
  nextAttemptAt?: Date | string;

  /**
   * Optional stable key for events that must not be repeated.
   *
   * The recipient ID is automatically appended.
   */
  dedupeKey?: string;
}

type NotificationDbClient = typeof db | Prisma.TransactionClient;

// -----------------------------------------------------------------------------
// Role helpers
// -----------------------------------------------------------------------------

export function isGlobalAdminRole(roleName: string): boolean {
  const normalized = roleName
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");

  return normalized === "SUPERADMIN" || normalized === "DIRECTOR";
}

// -----------------------------------------------------------------------------
// Database helpers
// -----------------------------------------------------------------------------

async function getActorAndBranchName(
  actorId?: string,
  branchId?: string,
  tx?: Prisma.TransactionClient,
): Promise<{
  actorName: string;
  branchName: string;
}> {
  const client: NotificationDbClient = tx ?? db;

  const [actor, branch] = await Promise.all([
    actorId
      ? client.user.findUnique({
          where: {
            id: actorId,
          },
          select: {
            name: true,
          },
        })
      : Promise.resolve(null),

    branchId
      ? client.branch.findUnique({
          where: {
            id: branchId,
          },
          select: {
            name: true,
          },
        })
      : Promise.resolve(null),
  ]);

  return {
    actorName: actor?.name || "User",
    branchName: branch?.name || "",
  };
}

/**
 * Resolves the users who should receive one notification event.
 *
 * Global:
 * - Super Admin
 * - Director
 *
 * Branch scoped:
 * - Branch Managers assigned to the event branch
 *
 * Personal:
 * - The actor who performed the action
 * - Explicit recipients used for assignment/reminder events
 */
async function resolveRecipients(
  branchId?: string,
  actorId?: string,
  explicitRecipientIds: string[] = [],
  tx?: Prisma.TransactionClient,
): Promise<RecipientInfo[]> {
  const client: NotificationDbClient = tx ?? db;

  const recipientMap = new Map<string, string>();

  // ---------------------------------------------------------------------------
  // 1. Super Admin and Director receive every notification
  // ---------------------------------------------------------------------------

  const globalUsers = await client.user.findMany({
    where: {
      role: {
        name: {
          in: [ROLES.SUPER_ADMIN, ROLES.DIRECTOR],
        },
      },
    },
    select: {
      id: true,
      role: {
        select: {
          name: true,
        },
      },
    },
  });

  for (const user of globalUsers) {
    recipientMap.set(user.id, user.role.name);
  }

  // ---------------------------------------------------------------------------
  // 2. Branch Managers receive notifications for assigned branches
  // ---------------------------------------------------------------------------

  if (branchId) {
    const branchManagers = await client.user.findMany({
      where: {
        role: {
          name: ROLES.BRANCH_MANAGER,
        },
        branches: {
          some: {
            id: branchId,
          },
        },
      },
      select: {
        id: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    for (const manager of branchManagers) {
      recipientMap.set(manager.id, manager.role.name);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Actor and explicit recipients
  // ---------------------------------------------------------------------------

  const personalRecipientIds = Array.from(
    new Set(
      [actorId, ...explicitRecipientIds].filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      ),
    ),
  );

  if (personalRecipientIds.length > 0) {
    const personalRecipients = await client.user.findMany({
      where: {
        id: {
          in: personalRecipientIds,
        },
      },
      select: {
        id: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    for (const user of personalRecipients) {
      recipientMap.set(user.id, user.role.name);
    }
  }

  return Array.from(recipientMap.entries()).map(([id, roleName]) => ({
    id,
    roleName,
  }));
}

// -----------------------------------------------------------------------------
// Transactional outbox writer
// -----------------------------------------------------------------------------

async function writeOutboxEntries(
  recipients: RecipientInfo[],
  payload: RoleBasedNotificationPayload,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  if (recipients.length === 0) {
    return;
  }

  const client: NotificationDbClient = tx ?? db;

  const now = new Date();

  const nextAttemptAt = payload.nextAttemptAt
    ? new Date(payload.nextAttemptAt)
    : now;

  if (Number.isNaN(nextAttemptAt.getTime())) {
    throw new Error(
      `Invalid nextAttemptAt value for notification event: ${payload.eventKey}`,
    );
  }

  /**
   * One event ID is shared by all recipients of this invocation.
   *
   * The processor can use this value when creating final Notification rows.
   */
  const eventId = randomUUID();

  const outboxRows = recipients.map(({ id: recipientId, roleName }) => {
    const { title, message } = payload.getTitles(roleName);

    const finalMessage = message ?? payload.defaultMessage;

    const baseDedupeKey = payload.dedupeKey ?? eventId;

    return {
      id: randomUUID(),

      eventKey: payload.eventKey,

      aggregateType: payload.entityType,

      aggregateId: payload.entityId,

      actorId: payload.actorId ?? null,

      branchId: payload.branchId ?? null,

      dedupeKey: `${baseDedupeKey}:${recipientId}`,

      payload: {
        eventId,
        recipientId,

        title,
        message: finalMessage,

        actionUrl: payload.actionUrl ?? null,

        priority: payload.priority ?? "NORMAL",

        metadata: payload.metadata ?? {},
      } as Prisma.InputJsonValue,

      status: "PENDING" as const,

      attempts: 0,

      nextAttemptAt,

      processedAt: null,

      lockedAt: null,
      lockedBy: null,

      lastError: null,

      createdAt: now,
      updatedAt: now,
    };
  });

  await client.notificationOutbox.createMany({
    data: outboxRows,
    skipDuplicates: true,
  });
}

// -----------------------------------------------------------------------------
// Error helper
// -----------------------------------------------------------------------------

function handleNotificationError(
  methodName: string,
  error: unknown,
  tx?: Prisma.TransactionClient,
): void {
  console.error(`[NotificationService] ${methodName} failed:`, error);

  /**
   * When notification creation is part of a Prisma transaction,
   * allow the transaction to roll back.
   */
  if (tx) {
    throw error;
  }
}

// -----------------------------------------------------------------------------
// Lead notifications
// -----------------------------------------------------------------------------

export async function notifyLeadCreated(
  lead: {
    id: string;
    leadNumber: string;
    studentName?: string | null;
    branchId: string;
    counselors?: Array<{
      counselorId: string;
    }>;
  },
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    /**
     * Regular users receive events they created.
     * Global users and matching branch managers are included automatically.
     */
    const recipients = await resolveRecipients(lead.branchId, actorId, [], tx);

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      lead.branchId,
      tx,
    );

    const leadLabel = getLeadLabel(lead);

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "LEAD_CREATED",

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `New Walkin Created by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : "Walkin Created Successfully",
        }),

        defaultMessage: `${leadLabel} has been created by ${actorName}.`,

        entityType: "lead",
        entityId: lead.id,

        branchId: lead.branchId,
        actorId,

        actionUrl: `/leads/all`,

        priority: "NORMAL",

        dedupeKey: `LEAD_CREATED:${lead.id}`,
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyLeadCreated", error, tx);
  }
}

export async function notifyLeadAssigned(
  lead: {
    id: string;
    leadNumber: string;
    studentName?: string | null;
    branchId: string;
  },
  newCounselorIds: string[],
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    /**
     * The assigning user receives their own action.
     * Newly assigned counsellors are explicit recipients.
     */
    const recipients = await resolveRecipients(
      lead.branchId,
      actorId,
      newCounselorIds,
      tx,
    );

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      lead.branchId,
      tx,
    );

    const leadLabel = getLeadLabel(lead);

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "LEAD_ASSIGNED",

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Walkin Assigned by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : "Walkin Assigned",
        }),

        defaultMessage: `${leadLabel} has been assigned by ${actorName}.`,

        entityType: "lead",
        entityId: lead.id,

        branchId: lead.branchId,
        actorId,

        actionUrl: `/leads/all`,

        priority: "NORMAL",

        metadata: {
          counselorIds: Array.from(new Set(newCounselorIds)),
        },
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyLeadAssigned", error, tx);
  }
}
export async function notifyLoanAssignment(
  loan: {
    leadId: string;
    leadNumber: string;
    studentName?: string | null;
    branchId: string;
    fintechAssigneeId: string;
  },
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const recipients = await resolveRecipients(
      loan.branchId,
      actorId,
      [loan.fintechAssigneeId],
      tx,
    );

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      loan.branchId,
      tx,
    );

    const applicant = loan.studentName?.trim()
      ? `${loan.studentName} (${loan.leadNumber})`
      : loan.leadNumber;

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "LOAN_CREATED",

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Loan Assigned by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : "New Loan Assigned",
        }),

        defaultMessage: `You have been assigned to the loan application for ${applicant}.`,

        entityType: "lead",

        entityId: loan.leadId,

        branchId: loan.branchId,

        actorId,

        actionUrl: `/loan-application/all`,

        priority: "HIGH",

        metadata: {
          fintechAssigneeId: loan.fintechAssigneeId,
          leadNumber: loan.leadNumber,
        },

        dedupeKey: `LOAN_ASSIGNED:${loan.leadId}:${loan.fintechAssigneeId}`,
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyLoanAssignment", error, tx);
  }
}
export async function notifyLeadStatusChanged(
  lead: {
    id: string;
    leadNumber: string;
    studentName?: string | null;
    branchId: string;
    counselors?: Array<{
      counselorId: string;
    }>;
  },
  oldStatus: string,
  newStatus: string,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const recipients = await resolveRecipients(lead.branchId, actorId, [], tx);

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      lead.branchId,
      tx,
    );

    const leadLabel = getLeadLabel(lead);

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "LEAD_STATUS_CHANGED",

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Walkin Status Changed by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : "Walkin Status Updated",
        }),

        defaultMessage: `${leadLabel} status changed from ${formatStatus(
          oldStatus,
        )} to ${formatStatus(newStatus)} by ${actorName}.`,

        entityType: "lead",
        entityId: lead.id,

        branchId: lead.branchId,
        actorId,

        actionUrl: `/leads/all`,

        priority: "NORMAL",

        metadata: {
          oldStatus,
          newStatus,
        },
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyLeadStatusChanged", error, tx);
  }
}

export async function notifyFollowupScheduled(
  student: {
    id: string;
    studentName: string;
    branchId: string;
    counselorId?: string | null;
  },
  followupDate: Date | string,
  followupNote: string | null | undefined,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const recipients = await resolveRecipients(
      student.branchId,
      actorId,
      [],
      tx,
    );

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      student.branchId,
      tx,
    );

    const dateString = toIndiaDateString(followupDate);

    const trimmedNote = followupNote?.trim();

    const noteMessage = trimmedNote ? ` Note: "${trimmedNote}"` : "";

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "FOLLOWUP_SCHEDULED",

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Follow-up Scheduled by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : "Follow-up Scheduled",
        }),

        defaultMessage: `Follow-up for ${student.studentName} is scheduled for ${dateString}.${noteMessage}`,

        entityType: "student",
        entityId: student.id,

        branchId: student.branchId,

        actorId,

        actionUrl: `/student-profiles/${student.id}`,

        priority: "HIGH",

        metadata: {
          studentId: student.id,
          followupDate: dateString,
          followupNote: trimmedNote ?? null,
        },

        dedupeKey: `FOLLOWUP_SCHEDULED:${student.id}:${dateString}`,
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyFollowupScheduled", error, tx);
  }
}

export async function notifyLeadConverted(
  lead: {
    id: string;
    leadNumber: string;
    studentName?: string | null;
    branchId: string;
    counselors?: Array<{
      counselorId: string;
    }>;
  },
  studentId: string,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const recipients = await resolveRecipients(lead.branchId, actorId, [], tx);

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      lead.branchId,
      tx,
    );

    const leadLabel = getLeadLabel(lead);

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "LEAD_CONVERTED",

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Walkin Converted by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : "Walkin Converted",
        }),

        defaultMessage: `${leadLabel} has been converted to a student profile by ${actorName}.`,

        entityType: "student",
        entityId: studentId,

        branchId: lead.branchId,
        actorId,

        actionUrl: `/student-profiles/${studentId}`,

        priority: "HIGH",

        metadata: {
          leadId: lead.id,
          leadNumber: lead.leadNumber,
          studentId,
        },

        dedupeKey: `LEAD_CONVERTED:${lead.id}:${studentId}`,
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyLeadConverted", error, tx);
  }
}

export async function notifyLeadFollowupScheduled(
  lead: {
    id: string;
    leadNumber: string;
    studentName?: string | null;
    branchId: string;
    counselors?: Array<{
      counselorId: string;
    }>;
  },
  followupDate: Date | string,
  followupNote: string | null | undefined,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const recipients = await resolveRecipients(lead.branchId, actorId, [], tx);

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      lead.branchId,
      tx,
    );

    const dateString = toIndiaDateString(followupDate);

    const leadLabel = getLeadLabel(lead);

    const trimmedNote = followupNote?.trim();

    const noteMessage = trimmedNote ? ` Note: "${trimmedNote}"` : "";

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "FOLLOWUP_SCHEDULED",

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Walkin Follow-up Scheduled by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : "Walkin Follow-up Scheduled",
        }),

        defaultMessage: `Follow-up for ${leadLabel} is scheduled for ${dateString}.${noteMessage}`,

        entityType: "lead",
        entityId: lead.id,

        branchId: lead.branchId,

        actorId,

        actionUrl: `/leads/all`,

        priority: "HIGH",

        metadata: {
          leadId: lead.id,
          leadNumber: lead.leadNumber,
          followupDate: dateString,
          followupNote: trimmedNote ?? null,
        },

        dedupeKey: `FOLLOWUP_SCHEDULED:LEAD:${lead.id}:${dateString}`,
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyLeadFollowupScheduled", error, tx);
  }
}

// -----------------------------------------------------------------------------
// Student notifications
// -----------------------------------------------------------------------------

export async function notifyStudentCreated(
  student: {
    id: string;
    studentName: string;
    branchId: string;
    counselorId?: string | null;
  },
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const recipients = await resolveRecipients(
      student.branchId,
      actorId,
      [],
      tx,
    );

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      student.branchId,
      tx,
    );

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "STUDENT_CREATED",

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Visa Application Created by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : "Visa Application Profile Created",
        }),

        defaultMessage: `${student.studentName} has been added as a student by ${actorName}.`,

        entityType: "student",
        entityId: student.id,

        branchId: student.branchId,

        actorId,

        actionUrl: `/student-profiles/${student.id}`,

        priority: "NORMAL",

        dedupeKey: `STUDENT_CREATED:${student.id}`,
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyStudentCreated", error, tx);
  }
}

// -----------------------------------------------------------------------------
// Follow-up reminder
// -----------------------------------------------------------------------------

export async function scheduleFollowupReminder(
  timeline: {
    id: string;
    studentId: string;
    followupDate: Date;
    description?: string | null;
  },
  student: {
    id: string;
    studentName: string;
    branchId: string;
    counselorId?: string | null;
  },
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const client: NotificationDbClient = tx ?? db;

    const reminderAt = new Date(timeline.followupDate);

    if (Number.isNaN(reminderAt.getTime())) {
      throw new Error("Invalid follow-up reminder date");
    }

    if (reminderAt <= new Date()) {
      return;
    }

    const recipientIds = Array.from(
      new Set(
        [actorId, student.counselorId].filter(
          (recipientId): recipientId is string => Boolean(recipientId),
        ),
      ),
    );

    if (recipientIds.length === 0) {
      return;
    }

    const users = await client.user.findMany({
      where: {
        id: {
          in: recipientIds,
        },
      },
      select: {
        id: true,
        role: {
          select: {
            name: true,
          },
        },
      },
    });

    const recipients: RecipientInfo[] = users.map((user) => ({
      id: user.id,
      roleName: user.role.name,
    }));

    if (recipients.length === 0) {
      return;
    }

    const dateString = toIndiaDateString(reminderAt);
    const trimmedNote = timeline.description?.trim();

    const noteMessage = trimmedNote ? ` Note: "${trimmedNote}"` : "";

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "FOLLOWUP_REMINDER",

        getTitles: () => ({
          title: "Follow-up Reminder",
        }),

        defaultMessage:
          `You have a follow-up with ${student.studentName} scheduled for ` +
          `${dateString}.${noteMessage}`,

        entityType: "studentTimeline",
        entityId: timeline.id,

        branchId: student.branchId,
        actorId,

        actionUrl: `/student-profiles/${student.id}`,

        priority: "HIGH",

        metadata: {
          studentId: student.id,
          timelineId: timeline.id,
          followupDate: reminderAt.toISOString(),
          followupNote: trimmedNote ?? null,
          notificationType: "followup_reminder",
        },

        dedupeKey: `FOLLOWUP_REMINDER:${timeline.id}`,

        nextAttemptAt: reminderAt,
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("scheduleFollowupReminder", error, tx);
  }
}

export async function notifyFollowupReminder(lead: {
  id: string;
  leadNumber: string;
  studentName?: string | null;
  branchId: string;
  nextFollowup?: Date | string | null;
  counselors: Array<{
    counselorId: string;
  }>;
}): Promise<void> {
  try {
    const assignedCounselorIds = lead.counselors.map(
      (counselor) => counselor.counselorId,
    );

    /**
     * No actor exists because cron generated this event.
     *
     * Assigned counsellors are explicitly included.
     */
    const recipients = await resolveRecipients(
      lead.branchId,
      undefined,
      assignedCounselorIds,
    );

    const followupDate = lead.nextFollowup
      ? toIndiaDateString(lead.nextFollowup)
      : toIndiaDateString(new Date());

    const leadLabel = getLeadLabel(lead);

    await writeOutboxEntries(recipients, {
      eventKey: "FOLLOWUP_REMINDER",

      getTitles: () => ({
        title: "Today's Follow-up Reminder",
      }),

      defaultMessage: `${leadLabel} is scheduled for follow-up today.`,

      entityType: "lead",
      entityId: lead.id,

      branchId: lead.branchId,

      actionUrl: `/leads/all`,

      priority: "HIGH",

      metadata: {
        followupDate,
      },

      /**
       * This prevents the same cron reminder from being created
       * more than once per lead, date and recipient.
       */
      dedupeKey: `FOLLOWUP_REMINDER:${lead.id}:${followupDate}`,
    });
  } catch (error) {
    handleNotificationError("notifyFollowupReminder", error);
  }
}

// -----------------------------------------------------------------------------
// Application notifications
// -----------------------------------------------------------------------------

type ApplicationEvent = "PRIORITY_UCOL" | "PRIORITY_COL" | "COL" | "UCOL";

export async function notifyApplicationEvent(
  student: {
    id: string;
    studentName: string;
    branchId: string;
    counselorId?: string | null;
  },
  applicationId: string,
  event: ApplicationEvent,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const recipients = await resolveRecipients(
      student.branchId,
      actorId,
      [],
      tx,
    );

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      student.branchId,
      tx,
    );

    const notificationConfig: Record<
      ApplicationEvent,
      {
        title: string;
        message: string;
        priority: "NORMAL" | "HIGH";
      }
    > = {
      PRIORITY_UCOL: {
        title: "Priority UCOL",
        message: `Offer letter received for ${student.studentName}.`,
        priority: "NORMAL",
      },

      PRIORITY_COL: {
        title: "Priority COL",
        message: `Offer letter received for ${student.studentName}.`,
        priority: "NORMAL",
      },

      COL: {
        title: "COL",
        message: `Offer letter received for ${student.studentName}.`,
        priority: "NORMAL",
      },

      UCOL: {
        title: "UCOL",
        message: `Offer letter received for ${student.studentName}.`,
        priority: "HIGH",
      },
    };

    const config = notificationConfig[event];

    await writeOutboxEntries(
      recipients,
      {
        eventKey: event,

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `${config.title} by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : config.title,
        }),

        defaultMessage: `${config.message} Updated by ${actorName}.`,

        entityType: "application",
        entityId: applicationId,

        branchId: student.branchId,

        actorId,

        actionUrl: `/student-profiles/${student.id}`,

        priority: config.priority,

        metadata: {
          studentId: student.id,
          applicationId,
        },

        dedupeKey: `${event}:${applicationId}`,
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyApplicationEvent", error, tx);
  }
}

// -----------------------------------------------------------------------------
// Loan notifications
// -----------------------------------------------------------------------------

type LoanEvent =
  | "LOAN_CREATED"
  | "LOAN_APPROVED"
  | "LOAN_REJECTED"
  | "LOAN_DISBURSED";

export async function notifyLoanEvent(
  loan: {
    id: string;
    fullName: string;
    branchId: string;
    counselorId?: string | null;
    fintechAssigneeId?: string | null;
  },
  event: LoanEvent,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    /**
     * The actor receives the event.
     *
     * Add assigned staff as explicit recipients for assignment-related
     * loan events when required.
     */
    const explicitRecipientIds = [
      loan.counselorId,
      loan.fintechAssigneeId,
    ].filter((id): id is string => typeof id === "string" && id.length > 0);

    const recipients = await resolveRecipients(
      loan.branchId,
      actorId,
      explicitRecipientIds,
      tx,
    );

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      loan.branchId,
      tx,
    );

    const titles: Record<LoanEvent, string> = {
      LOAN_CREATED: "Loan Created",

      LOAN_APPROVED: "Loan Approved",

      LOAN_REJECTED: "Loan Rejected",

      LOAN_DISBURSED: "Loan Disbursed",
    };

    const messages: Record<LoanEvent, string> = {
      LOAN_CREATED: `Loan application created for ${loan.fullName}.`,

      LOAN_APPROVED: `Loan application approved for ${loan.fullName}.`,

      LOAN_REJECTED: `Loan application rejected for ${loan.fullName}.`,

      LOAN_DISBURSED: `Loan disbursed for ${loan.fullName}.`,
    };

    await writeOutboxEntries(
      recipients,
      {
        eventKey: event,

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `${titles[event]} by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : titles[event],
        }),

        defaultMessage: `${messages[event]} Updated by ${actorName}.`,

        entityType: "loan",
        entityId: loan.id,

        branchId: loan.branchId,
        actorId,

        actionUrl: `/loan-application/all/${loan.id}`,

        priority:
          event === "LOAN_DISBURSED" || event === "LOAN_REJECTED"
            ? "HIGH"
            : "NORMAL",

        metadata: {
          counselorId: loan.counselorId ?? null,

          fintechAssigneeId: loan.fintechAssigneeId ?? null,
        },
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyLoanEvent", error, tx);
  }
}

// -----------------------------------------------------------------------------
// student status change
// -----------------------------------------------------------------------------

export async function notifyStudentStatusChanged(
  student: {
    id: string;
    studentName: string;
    branchId: string;
    counselorId?: string | null;
  },
  oldStatus: string,
  newStatus: string,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const explicitRecipientIds = student.counselorId
      ? [student.counselorId]
      : [];

    const recipients = await resolveRecipients(
      student.branchId,
      actorId,
      explicitRecipientIds,
      tx,
    );

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      student.branchId,
      tx,
    );

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "STUDENT_STATUS_CHANGED",

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Student Status Changed by ${actorName}${
                branchName ? ` (${branchName})` : ""
              }`
            : "Student Status Updated",
        }),

        defaultMessage: `${student.studentName} status changed from ${formatStatus(
          oldStatus,
        )} to ${formatStatus(newStatus)} by ${actorName}.`,

        entityType: "student",
        entityId: student.id,

        branchId: student.branchId,
        actorId,

        actionUrl: `/student-profiles/${student.id}`,

        priority: "NORMAL",

        metadata: {
          oldStatus,
          newStatus,
          counselorId: student.counselorId ?? null,
        },

        dedupeKey: `STUDENT_STATUS_CHANGED:${student.id}:${oldStatus}:${newStatus}`,
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyStudentStatusChanged", error, tx);
  }
}

// -----------------------------------------------------------------------------
// Visa notifications
// -----------------------------------------------------------------------------

export async function notifyVisaStatusChanged(
  student: {
    id: string;
    studentName: string;
    branchId: string;
  },
  oldStatus: string,
  newStatus: string,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    if (newStatus !== "APPROVED" && newStatus !== "REJECTED") {
      return;
    }

    const recipients = await resolveRecipients(
      student.branchId,
      actorId,
      [],
      tx,
    );

    const { actorName, branchName } = await getActorAndBranchName(
      actorId,
      student.branchId,
      tx,
    );

    const eventKey =
      newStatus === "APPROVED" ? "VISA_APPROVED" : "VISA_REJECTED";

    await writeOutboxEntries(
      recipients,
      {
        eventKey,

        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Visa ${
                newStatus === "APPROVED" ? "Approved" : "Rejected"
              } by ${actorName}${branchName ? ` (${branchName})` : ""}`
            : `Visa ${newStatus === "APPROVED" ? "Approved" : "Rejected"}`,
        }),

        defaultMessage: `Visa for ${student.studentName} has been ${newStatus.toLowerCase()} by ${actorName}.`,

        entityType: "student",
        entityId: student.id,

        branchId: student.branchId,
        actorId,

        actionUrl: `/student-profiles/${student.id}`,

        priority: newStatus === "APPROVED" ? "NORMAL" : "HIGH",

        metadata: {
          oldStatus,
          newStatus,
        },
      },
      tx,
    );
  } catch (error) {
    handleNotificationError("notifyVisaStatusChanged", error, tx);
  }
}

// -----------------------------------------------------------------------------
// Utility functions
// -----------------------------------------------------------------------------

function getLeadLabel(lead: {
  leadNumber: string;
  studentName?: string | null;
}): string {
  const studentName = lead.studentName?.trim();

  if (studentName) {
    return `${studentName} (${lead.leadNumber})`;
  }

  return lead.leadNumber;
}

function formatStatus(value: string): string {
  if (!value) {
    return "";
  }

  return value
    .trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * Converts a Date or date string to YYYY-MM-DD using Asia/Kolkata.
 */
function toIndiaDateString(value: Date | string): string {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid follow-up date");
  }

  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = dateParts.find((part) => part.type === "year")?.value;

  const month = dateParts.find((part) => part.type === "month")?.value;

  const day = dateParts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to format follow-up date");
  }

  return `${year}-${month}-${day}`;
}
