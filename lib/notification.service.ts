/**
 * lib/notification.service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized notification service. Every module calls these helpers instead
 * of writing notification logic inline. All functions write to NotificationOutbox
 * (transactional outbox pattern) and Notification table, fire-and-forget so that
 * notification failures can never break core business operations.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { randomUUID } from "crypto";
import db from "@/lib/prisma";
import { ROLES } from "@/lib/rbac";
import { NotificationPriority, Prisma } from "@/generated/prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NotificationEventKey =
  | "LEAD_CREATED"
  | "LEAD_ASSIGNED"
  | "LEAD_STATUS_CHANGED"
  | "LEAD_CONVERTED"
  | "FOLLOWUP_REMINDER"
  | "STUDENT_CREATED"
  | "APPLICATION_SUBMITTED"
  | "APPLICATION_OFFER_RECEIVED"
  | "APPLICATION_CAS_RECEIVED"
  | "APPLICATION_REJECTED"
  | "LOAN_CREATED"
  | "LOAN_APPROVED"
  | "LOAN_REJECTED"
  | "LOAN_DISBURSED"
  | "VISA_APPLIED"
  | "VISA_APPROVED"
  | "VISA_REJECTED";

export interface RecipientInfo {
  id: string;
  roleName: string;
}

export interface RoleBasedNotificationPayload {
  eventKey: NotificationEventKey;
  getTitles: (roleName: string) => { title: string; message?: string };
  defaultMessage: string;
  entityType: string;
  entityId: string;
  branchId?: string;
  actorId?: string;
  actionUrl?: string;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isGlobalAdminRole(roleName: string): boolean {
  const norm = (roleName || "").toUpperCase().replace(/\s+|_/g, "");
  return norm === "SUPERADMIN" || norm === "DIRECTOR";
}

async function getActorAndBranchName(actorId?: string, branchId?: string) {
  const [actor, branch] = await Promise.all([
    actorId
      ? db.user.findUnique({ where: { id: actorId }, select: { name: true } })
      : null,
    branchId
      ? db.branch.findUnique({ where: { id: branchId }, select: { name: true } })
      : null,
  ]);

  return {
    actorName: actor?.name || "User",
    branchName: branch?.name || "",
  };
}

/**
 * Resolves all recipients for a notification:
 * - Super Admins and Directors get ALL notifications.
 * - Branch Managers get notifications from their assigned branches only.
 * - Counsellors/others passed via assignedUserIds.
 * - The creator (actorId) is ALSO included as a recipient if provided.
 */
async function resolveRecipients(
  branchId?: string,
  assignedUserIds: string[] = [],
  actorId?: string,
): Promise<RecipientInfo[]> {
  const recipientMap = new Map<string, string>();

  // 1. Super Admins & Directors
  const globalUsers = await db.user.findMany({
    where: {
      role: {
        name: {
          in: [ROLES.SUPER_ADMIN, ROLES.DIRECTOR, "Super Admin", "Director", "SuperAdmin"],
        },
      },
    },
    select: { id: true, role: { select: { name: true } } },
  });
  globalUsers.forEach((u) => recipientMap.set(u.id, u.role.name));

  // 2. Branch Managers for this branch
  if (branchId) {
    const branchManagers = await db.user.findMany({
      where: {
        role: {
          name: {
            in: [ROLES.BRANCH_MANAGER, "Branch Manager", "Manager"],
          },
        },
        branches: {
          some: { id: branchId },
        },
      },
      select: { id: true, role: { select: { name: true } } },
    });
    branchManagers.forEach((u) => recipientMap.set(u.id, u.role.name));
  }

  // 3. Additional assigned users and actor
  const extraIds = [...assignedUserIds, ...(actorId ? [actorId] : [])].filter(Boolean);
  if (extraIds.length > 0) {
    const extraUsers = await db.user.findMany({
      where: { id: { in: extraIds } },
      select: { id: true, role: { select: { name: true } } },
    });
    extraUsers.forEach((u) => recipientMap.set(u.id, u.role.name));
  }

  return Array.from(recipientMap.entries()).map(([id, roleName]) => ({
    id,
    roleName,
  }));
}

// ---------------------------------------------------------------------------
// Internal: write outbox entries and create live Notification records
// ---------------------------------------------------------------------------

async function writeOutboxEntries(
  recipients: RecipientInfo[],
  payload: RoleBasedNotificationPayload,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  if (!recipients || recipients.length === 0) return;

  const client = tx ?? db;
  const now = new Date();

  const outboxRows = recipients.map(({ id: recipientId, roleName }) => {
    const { title, message } = payload.getTitles(roleName);
    const finalMessage = message ?? payload.defaultMessage;
    const id = randomUUID();
    const dedupeKey = `${payload.eventKey}:${payload.entityId}:${recipientId}:${now.getTime()}`;

    return {
      id,
      eventKey: payload.eventKey,
      aggregateType: payload.entityType,
      aggregateId: payload.entityId,
      actorId: payload.actorId ?? null,
      branchId: payload.branchId ?? null,
      dedupeKey,
      payload: {
        recipientId,
        title,
        message: finalMessage,
        actionUrl: payload.actionUrl ?? null,
        priority: payload.priority ?? "NORMAL",
        metadata: payload.metadata ?? {},
      } as Prisma.InputJsonValue,
      status: "PROCESSED" as const,
      processedAt: now,
      updatedAt: now,
    };
  });

  const notificationRows = recipients.map(({ id: recipientId, roleName }) => {
    const { title, message } = payload.getTitles(roleName);
    const finalMessage = message ?? payload.defaultMessage;
    const eventId = randomUUID();
    return {
      id: randomUUID(),
      eventId,
      eventKey: payload.eventKey,
      recipientId,
      actorId: payload.actorId ?? null,
      branchId: payload.branchId ?? null,
      entityType: payload.entityType,
      entityId: payload.entityId,
      title,
      message: finalMessage,
      actionUrl: payload.actionUrl ?? null,
      icon: null,
      priority: payload.priority ?? "NORMAL",
      metadata: (payload.metadata as Prisma.InputJsonValue) ?? null,
      readAt: null,
      archivedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  });

  await Promise.all([
    (client as typeof db).notificationOutbox.createMany({
      data: outboxRows,
      skipDuplicates: true,
    }),
    (client as typeof db).notification.createMany({
      data: notificationRows,
      skipDuplicates: true,
    }),
  ]);
}

// ---------------------------------------------------------------------------
// PUBLIC API — exported helpers called by route handlers
// ---------------------------------------------------------------------------

/**
 * Notify: New Lead Created
 */
export async function notifyLeadCreated(
  lead: {
    id: string;
    leadNumber: string;
    studentName?: string | null;
    branchId: string;
    counselors?: Array<{ counselorId: string }>;
  },
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const assignedCounselorIds = (lead.counselors || []).map((c) => c.counselorId);
    const recipients = await resolveRecipients(lead.branchId, assignedCounselorIds, actorId);
    const { actorName, branchName } = await getActorAndBranchName(actorId, lead.branchId);

    const studentLabel = lead.studentName || "A lead";

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "LEAD_CREATED",
        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `New Lead Created by ${actorName}${branchName ? ` (${branchName})` : ""}`
            : `New Lead Created by ${actorName}`,
        }),
        defaultMessage: `${studentLabel} (${lead.leadNumber}) has been created.`,
        entityType: "lead",
        entityId: lead.id,
        branchId: lead.branchId,
        actorId,
        actionUrl: `/leads/${lead.id}`,
        priority: "NORMAL",
      },
      tx,
    );
  } catch (err) {
    console.error("[NotificationService] notifyLeadCreated failed:", err);
  }
}

/**
 * Notify: Lead Assigned / Reassigned
 */
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
    const recipients = await resolveRecipients(lead.branchId, newCounselorIds, actorId);
    const { actorName, branchName } = await getActorAndBranchName(actorId, lead.branchId);

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "LEAD_ASSIGNED",
        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Lead Assigned by ${actorName}${branchName ? ` (${branchName})` : ""}`
            : `Lead Assigned by ${actorName}`,
        }),
        defaultMessage: `Lead ${lead.leadNumber}${lead.studentName ? ` — ${lead.studentName}` : ""} has been assigned.`,
        entityType: "lead",
        entityId: lead.id,
        branchId: lead.branchId,
        actorId,
        actionUrl: `/leads/${lead.id}`,
        priority: "NORMAL",
      },
      tx,
    );
  } catch (err) {
    console.error("[NotificationService] notifyLeadAssigned failed:", err);
  }
}

/**
 * Notify: Lead Status Changed
 */
export async function notifyLeadStatusChanged(
  lead: {
    id: string;
    leadNumber: string;
    studentName?: string | null;
    branchId: string;
    counselors?: Array<{ counselorId: string }>;
  },
  oldStatus: string,
  newStatus: string,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const assignedCounselorIds = (lead.counselors || []).map((c) => c.counselorId);
    const recipients = await resolveRecipients(lead.branchId, assignedCounselorIds, actorId);
    const { actorName, branchName } = await getActorAndBranchName(actorId, lead.branchId);

    const studentLabel = lead.studentName || lead.leadNumber;

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "LEAD_STATUS_CHANGED",
        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Lead Status Changed by ${actorName}${branchName ? ` (${branchName})` : ""}`
            : `Lead Status Changed by ${actorName}`,
        }),
        defaultMessage: `${studentLabel} (${lead.leadNumber}) status updated from ${capitalize(oldStatus)} to ${capitalize(newStatus)}.`,
        entityType: "lead",
        entityId: lead.id,
        branchId: lead.branchId,
        actorId,
        actionUrl: `/leads/${lead.id}`,
        priority: "NORMAL",
        metadata: { oldStatus, newStatus },
      },
      tx,
    );
  } catch (err) {
    console.error("[NotificationService] notifyLeadStatusChanged failed:", err);
  }
}

/**
 * Notify: Follow-up Scheduled with Note & Date
 */
export async function notifyFollowupScheduled(
  lead: {
    id: string;
    leadNumber: string;
    studentName?: string | null;
    branchId: string;
    counselors?: Array<{ counselorId: string }>;
  },
  followupDate: Date | string,
  followupNote: string | undefined | null,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const assignedCounselorIds = (lead.counselors || []).map((c) => c.counselorId);
    const recipients = await resolveRecipients(lead.branchId, assignedCounselorIds, actorId);
    const { actorName, branchName } = await getActorAndBranchName(actorId, lead.branchId);

    const dateStr =
      typeof followupDate === "string"
        ? followupDate.split("T")[0]
        : followupDate.toISOString().split("T")[0];

    const studentLabel = lead.studentName || lead.leadNumber;
    const noteText = followupNote?.trim() ? ` Note: "${followupNote.trim()}"` : "";

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "FOLLOWUP_REMINDER",
        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Follow-up Scheduled by ${actorName}${branchName ? ` (${branchName})` : ""}`
            : `Follow-up Scheduled by ${actorName}`,
        }),
        defaultMessage: `Follow-up for ${studentLabel} (${lead.leadNumber}) set for ${dateStr}.${noteText}`,
        entityType: "lead",
        entityId: lead.id,
        branchId: lead.branchId,
        actorId,
        actionUrl: `/leads/${lead.id}`,
        priority: "HIGH",
        metadata: { followupDate: dateStr, followupNote },
      },
      tx,
    );
  } catch (err) {
    console.error("[NotificationService] notifyFollowupScheduled failed:", err);
  }
}

/**
 * Notify: Lead Converted to Student
 */
export async function notifyLeadConverted(
  lead: {
    id: string;
    leadNumber: string;
    studentName?: string | null;
    branchId: string;
    counselors?: Array<{ counselorId: string }>;
  },
  studentId: string,
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const assignedCounselorIds = (lead.counselors || []).map((c) => c.counselorId);
    const recipients = await resolveRecipients(lead.branchId, assignedCounselorIds, actorId);
    const { actorName, branchName } = await getActorAndBranchName(actorId, lead.branchId);
    const label = lead.studentName ?? lead.leadNumber;

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "LEAD_CONVERTED",
        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Lead Converted by ${actorName}${branchName ? ` (${branchName})` : ""}`
            : `Lead Converted by ${actorName}`,
        }),
        defaultMessage: `${label} (${lead.leadNumber}) has been converted to a student profile.`,
        entityType: "student",
        entityId: studentId,
        branchId: lead.branchId,
        actorId,
        actionUrl: `/student-profiles/${studentId}`,
        priority: "HIGH",
      },
      tx,
    );
  } catch (err) {
    console.error("[NotificationService] notifyLeadConverted failed:", err);
  }
}

/**
 * Notify: Student Created (called after lead conversion)
 */
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
    const assignedCounselorIds = student.counselorId ? [student.counselorId] : [];
    const recipients = await resolveRecipients(student.branchId, assignedCounselorIds, actorId);
    const { actorName, branchName } = await getActorAndBranchName(actorId, student.branchId);

    await writeOutboxEntries(
      recipients,
      {
        eventKey: "STUDENT_CREATED",
        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `Student Created by ${actorName}${branchName ? ` (${branchName})` : ""}`
            : `Student Created by ${actorName}`,
        }),
        defaultMessage: `${student.studentName} has been added as a student profile.`,
        entityType: "student",
        entityId: student.id,
        branchId: student.branchId,
        actorId,
        actionUrl: `/student-profiles/${student.id}`,
        priority: "NORMAL",
      },
      tx,
    );
  } catch (err) {
    console.error("[NotificationService] notifyStudentCreated failed:", err);
  }
}

/**
 * Notify: Follow-up Reminder (called by cron)
 */
export async function notifyFollowupReminder(lead: {
  id: string;
  leadNumber: string;
  studentName?: string | null;
  branchId: string;
  counselors: Array<{ counselorId: string }>;
}): Promise<void> {
  try {
    const assignedCounselorIds = lead.counselors.map((c) => c.counselorId);
    const recipients = await resolveRecipients(lead.branchId, assignedCounselorIds);
    const today = toDateString(new Date());
    const label = lead.studentName ?? lead.leadNumber;

    await writeOutboxEntries(recipients, {
      eventKey: "FOLLOWUP_REMINDER",
      getTitles: () => ({ title: "Today's Follow-up Reminder" }),
      defaultMessage: `${label} (${lead.leadNumber}) is scheduled for follow-up today.`,
      entityType: "lead",
      entityId: lead.id,
      branchId: lead.branchId,
      actionUrl: `/leads/${lead.id}`,
      priority: "HIGH",
      metadata: { followupDate: today },
    });
  } catch (err) {
    console.error("[NotificationService] notifyFollowupReminder failed:", err);
  }
}

/**
 * Notify: Application Event
 */
export async function notifyApplicationEvent(
  student: {
    id: string;
    studentName: string;
    branchId: string;
    counselorId?: string | null;
  },
  applicationId: string,
  event: "APPLICATION_SUBMITTED" | "APPLICATION_OFFER_RECEIVED" | "APPLICATION_CAS_RECEIVED" | "APPLICATION_REJECTED",
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const assignedCounselorIds = student.counselorId ? [student.counselorId] : [];
    const recipients = await resolveRecipients(student.branchId, assignedCounselorIds, actorId);
    const { actorName, branchName } = await getActorAndBranchName(actorId, student.branchId);

    const messages: Record<typeof event, string> = {
      APPLICATION_SUBMITTED: `Application submitted for ${student.studentName}.`,
      APPLICATION_OFFER_RECEIVED: `Offer letter received for ${student.studentName}.`,
      APPLICATION_CAS_RECEIVED: `CAS received for ${student.studentName}.`,
      APPLICATION_REJECTED: `Application rejected for ${student.studentName}.`,
    };

    const titles: Record<typeof event, string> = {
      APPLICATION_SUBMITTED: "Application Submitted",
      APPLICATION_OFFER_RECEIVED: "Offer Received",
      APPLICATION_CAS_RECEIVED: "CAS Received",
      APPLICATION_REJECTED: "Application Rejected",
    };

    await writeOutboxEntries(
      recipients,
      {
        eventKey: event,
        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `${titles[event]} by ${actorName}${branchName ? ` (${branchName})` : ""}`
            : `${titles[event]} by ${actorName}`,
        }),
        defaultMessage: messages[event],
        entityType: "application",
        entityId: applicationId,
        branchId: student.branchId,
        actorId,
        actionUrl: `/student-profiles/${student.id}`,
        priority: event === "APPLICATION_REJECTED" ? "HIGH" : "NORMAL",
      },
      tx,
    );
  } catch (err) {
    console.error("[NotificationService] notifyApplicationEvent failed:", err);
  }
}

/**
 * Notify: Loan Event
 */
export async function notifyLoanEvent(
  loan: {
    id: string;
    fullName: string;
    branchId: string;
    counselorId?: string | null;
    fintechAssigneeId?: string | null;
  },
  event: "LOAN_CREATED" | "LOAN_APPROVED" | "LOAN_REJECTED" | "LOAN_DISBURSED",
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const assignedIds = [loan.counselorId, loan.fintechAssigneeId].filter(Boolean) as string[];
    const recipients = await resolveRecipients(loan.branchId, assignedIds, actorId);
    const { actorName, branchName } = await getActorAndBranchName(actorId, loan.branchId);

    const messages: Record<typeof event, string> = {
      LOAN_CREATED: `Loan application created for ${loan.fullName}.`,
      LOAN_APPROVED: `Loan application approved for ${loan.fullName}.`,
      LOAN_REJECTED: `Loan application rejected for ${loan.fullName}.`,
      LOAN_DISBURSED: `Loan disbursed for ${loan.fullName}.`,
    };

    const titles: Record<typeof event, string> = {
      LOAN_CREATED: "Loan Created",
      LOAN_APPROVED: "Loan Approved",
      LOAN_REJECTED: "Loan Rejected",
      LOAN_DISBURSED: "Loan Disbursed",
    };

    await writeOutboxEntries(
      recipients,
      {
        eventKey: event,
        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `${titles[event]} by ${actorName}${branchName ? ` (${branchName})` : ""}`
            : `${titles[event]} by ${actorName}`,
        }),
        defaultMessage: messages[event],
        entityType: "loan",
        entityId: loan.id,
        branchId: loan.branchId,
        actorId,
        actionUrl: `/loan-application/${loan.id}`,
        priority: event === "LOAN_DISBURSED" ? "HIGH" : "NORMAL",
      },
      tx,
    );
  } catch (err) {
    console.error("[NotificationService] notifyLoanEvent failed:", err);
  }
}

/**
 * Notify: Visa Event
 */
export async function notifyVisaEvent(
  student: {
    id: string;
    studentName: string;
    branchId: string;
    counselorId?: string | null;
  },
  event: "VISA_APPLIED" | "VISA_APPROVED" | "VISA_REJECTED",
  actorId: string,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  try {
    const assignedCounselorIds = student.counselorId ? [student.counselorId] : [];
    const recipients = await resolveRecipients(student.branchId, assignedCounselorIds, actorId);
    const { actorName, branchName } = await getActorAndBranchName(actorId, student.branchId);

    const messages: Record<typeof event, string> = {
      VISA_APPLIED: `Visa applied for ${student.studentName}.`,
      VISA_APPROVED: `Visa approved for ${student.studentName}. 🎉`,
      VISA_REJECTED: `Visa rejected for ${student.studentName}.`,
    };

    const titles: Record<typeof event, string> = {
      VISA_APPLIED: "Visa Applied",
      VISA_APPROVED: "Visa Approved",
      VISA_REJECTED: "Visa Rejected",
    };

    await writeOutboxEntries(
      recipients,
      {
        eventKey: event,
        getTitles: (roleName) => ({
          title: isGlobalAdminRole(roleName)
            ? `${titles[event]} by ${actorName}${branchName ? ` (${branchName})` : ""}`
            : `${titles[event]} by ${actorName}`,
        }),
        defaultMessage: messages[event],
        entityType: "student",
        entityId: student.id,
        branchId: student.branchId,
        actorId,
        actionUrl: `/student-profiles/${student.id}`,
        priority: event === "VISA_REJECTED" ? "HIGH" : (event === "VISA_APPROVED" ? "HIGH" : "NORMAL"),
      },
      tx,
    );
  } catch (err) {
    console.error("[NotificationService] notifyVisaEvent failed:", err);
  }
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function toDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}
