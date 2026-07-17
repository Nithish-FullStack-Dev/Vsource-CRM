import { NextRequest, NextResponse } from "next/server";

import db from "@/lib/prisma";

import { getAuthorizedUser } from "@/lib/rbac";

import { MODULES, PERMISSIONS } from "@/lib/module-codes";

import {
  getLeadAccessWhere,
  getStudentAccessWhere,
  getStudentApplicationAccessWhere,
  getStudentTimelineAccessWhere,
  resolveDataAccessScope,
} from "@/lib/data-access-scope";

import { getPerformanceReport } from "@/lib/performance-reports";

import { StudentStage } from "@/generated/prisma/enums";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DashboardPeriod = "today" | "week" | "month" | "year";

type DashboardDateRange = {
  startDate: Date;
  endDate: Date;
  previousStartDate: Date;
  previousEndDate: Date;
  label: string;
};

const MASTER_TRACKER_STAGES = [
  {
    key: "Inquiry",
    label: "Inquiry",
    stages: [StudentStage.application_started],
  },
  {
    key: "Documents",
    label: "Documents",
    stages: [StudentStage.application_submitted],
  },
  {
    key: "Applied",
    label: "Applied",
    stages: [StudentStage.offer_received],
  },
  {
    key: "Loan Process",
    label: "Loan Process",
    stages: [StudentStage.enrolled],
  },
  {
    key: "Visa Process",
    label: "Visa Process",
    stages: [
      StudentStage.deposit_pending,
      StudentStage.deposit_paid,
      StudentStage.cas_pending,
      StudentStage.cas_received,
      StudentStage.visa_filing,
      StudentStage.visa_approved,
      StudentStage.visa_rejected,
    ],
  },
] as const;

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function getDashboardDateRange(period: DashboardPeriod): DashboardDateRange {
  const now = new Date();

  if (period === "today") {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      startDate: startOfDay(now),
      endDate: endOfDay(now),
      previousStartDate: startOfDay(yesterday),
      previousEndDate: endOfDay(yesterday),
      label: "Today",
    };
  }

  if (period === "week") {
    const currentDay = now.getDay();

    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;

    const startDate = startOfDay(new Date(now));

    startDate.setDate(startDate.getDate() - daysFromMonday);

    const previousStartDate = new Date(startDate);

    previousStartDate.setDate(previousStartDate.getDate() - 7);

    const previousEndDate = endOfDay(new Date(startDate));

    previousEndDate.setDate(previousEndDate.getDate() - 1);

    return {
      startDate,
      endDate: endOfDay(now),
      previousStartDate: startOfDay(previousStartDate),
      previousEndDate,
      label: "This week",
    };
  }

  if (period === "year") {
    return {
      startDate: new Date(now.getFullYear(), 0, 1),
      endDate: endOfDay(now),

      previousStartDate: new Date(now.getFullYear() - 1, 0, 1),

      previousEndDate: endOfDay(new Date(now.getFullYear() - 1, 11, 31)),

      label: "This year",
    };
  }

  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1),

    endDate: endOfDay(now),

    previousStartDate: new Date(now.getFullYear(), now.getMonth() - 1, 1),

    previousEndDate: endOfDay(new Date(now.getFullYear(), now.getMonth(), 0)),

    label: "This month",
  };
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function getStageName(currentStage: StudentStage | null): string {
  const stage = MASTER_TRACKER_STAGES.find((item) =>
    item.stages.some((value) => value === currentStage),
  );

  return stage?.key ?? "Inquiry";
}

function getPerformanceReportDateFilters(dateRange: DashboardDateRange) {
  return {
    datePreset: "custom" as const,
    startDate: dateRange.startDate.toISOString().slice(0, 10),

    endDate: dateRange.endDate.toISOString().slice(0, 10),
  };
}
function calculateVisaConversionRate(
  visaApproved: number,
  totalWalkins: number,
): number {
  if (totalWalkins <= 0) {
    return 0;
  }

  return Number(((visaApproved / totalWalkins) * 100).toFixed(1));
}
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getAuthorizedUser(
      request,
      MODULES.STUDENT_PROFILES,
      PERMISSIONS.READ,
    );

    const scope = resolveDataAccessScope(currentUser);

    const requestedPeriod = request.nextUrl.searchParams.get("period");

    const period: DashboardPeriod =
      requestedPeriod === "today" ||
      requestedPeriod === "week" ||
      requestedPeriod === "year"
        ? requestedPeriod
        : "month";

    const dateRange = getDashboardDateRange(period);

    const leadAccessWhere = getLeadAccessWhere(scope);
    const studentAccessWhere = getStudentAccessWhere(scope);
    const applicationAccessWhere = getStudentApplicationAccessWhere(scope);
    const timelineAccessWhere = getStudentTimelineAccessWhere(scope);
    const performanceDateFilters = getPerformanceReportDateFilters(dateRange);
    const performanceReport = await getPerformanceReport(
      {
        search: "",
        recordScope: "all",
        branchId: "",
        counselorId: "",
        leadStatus: "",
        leadSource: "",
        countryId: "",
        intakeId: "",
        universityId: "",
        applicationStatus: "",
        casStatus: "",
        visaStatus: "",
        loanStatus: "",
        nbfc: "",
        fintechAssigneeId: "",
        datePreset: performanceDateFilters.datePreset,
        startDate: performanceDateFilters.startDate,
        endDate: performanceDateFilters.endDate,
      },
      1,
      10,
      false,
      scope,
    );

    const [
      currentLeads,
      previousLeads,
      currentStudents,
      previousStudents,
      currentApplications,
      previousApplications,
      masterTrackerStudents,
      pendingFollowUps,
      recentActivities,
      incompleteModules,
      pendingCas,
      pendingVisas,
      pendingLoans,
    ] = await Promise.all([
      db.lead.count({
        where: {
          ...leadAccessWhere,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),

      db.lead.count({
        where: {
          ...leadAccessWhere,
          createdAt: {
            gte: dateRange.previousStartDate,
            lte: dateRange.previousEndDate,
          },
        },
      }),

      db.student.count({
        where: {
          ...studentAccessWhere,
          status: "active",
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),

      db.student.count({
        where: {
          ...studentAccessWhere,
          status: "active",
          createdAt: {
            gte: dateRange.previousStartDate,
            lte: dateRange.previousEndDate,
          },
        },
      }),

      db.studentApplication.count({
        where: {
          ...applicationAccessWhere,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),

      db.studentApplication.count({
        where: {
          ...applicationAccessWhere,
          createdAt: {
            gte: dateRange.previousStartDate,
            lte: dateRange.previousEndDate,
          },
        },
      }),

      db.student.findMany({
        where: {
          ...studentAccessWhere,
          status: "active",
          updatedAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        select: {
          id: true,
          studentName: true,
          mobileNumber: true,
          emailId: true,
          currentStage: true,
          createdAt: true,
          updatedAt: true,
          branch: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          counselor: {
            select: {
              id: true,
              name: true,
            },
          },
          applications: {
            where: {
              offerStatus: {
                not: "PENDING",
              },
            },
            orderBy: {
              updatedAt: "desc",
            },
            take: 1,
            select: {
              id: true,
              status: true,
              offerStatus: true,
              university: {
                select: {
                  name: true,
                },
              },
              course: {
                select: {
                  name: true,
                },
              },
            },
          },
          moduleProgress: {
            select: {
              module: true,
              status: true,
              progress: true,
            },
          },
          visaProfile: {
            select: {
              casStatus: true,
              visaStatus: true,
              depositStatus: true,
            },
          },
          loanProfile: {
            select: {
              loanStatus: true,
              nbfc: true,
              disbursed: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
      }),

      db.studentTimeline.count({
        where: {
          ...timelineAccessWhere,
          followupDate: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
      }),

      db.studentTimeline.findMany({
        where: {
          ...timelineAccessWhere,
          createdAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        select: {
          id: true,
          description: true,
          type: true,
          createdAt: true,
          student: {
            select: {
              studentName: true,
            },
          },
          createdBy: {
            select: {
              name: true,
            },
          },
        },
      }),

      db.studentModuleProgress.count({
        where: {
          student: {
            ...studentAccessWhere,
            updatedAt: {
              gte: dateRange.startDate,
              lte: dateRange.endDate,
            },
          },
          OR: [
            {
              status: {
                not: "completed",
              },
            },
            {
              progress: {
                lt: 100,
              },
            },
          ],
        },
      }),

      db.student.count({
        where: {
          ...studentAccessWhere,
          updatedAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          visaProfile: {
            casStatus: {
              in: ["PENDING", "APPLIED"],
            },
          },
        },
      }),

      db.student.count({
        where: {
          ...studentAccessWhere,
          updatedAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          visaProfile: {
            visaStatus: "DECISION_PENDING",
          },
        },
      }),

      db.student.count({
        where: {
          ...studentAccessWhere,
          updatedAt: {
            gte: dateRange.startDate,
            lte: dateRange.endDate,
          },
          loanProfile: {
            loanStatus: {
              notIn: ["completed", "disbursed", "rejected"],
            },
          },
        },
      }),
    ]);

    const pendingApplications = performanceReport.applicationStatusBreakdown
      .filter((item) => {
        const status = item.status.trim().toLowerCase();

        return !["completed", "rejected", "withdrawn", "cancelled"].includes(
          status,
        );
      })
      .reduce((total, item) => total + item.count, 0);

    const masterTracker = MASTER_TRACKER_STAGES.map((stage) => {
      const stageStudents = masterTrackerStudents.filter(
        (student) => getStageName(student.currentStage) === stage.key,
      );

      return {
        key: stage.key,
        label: stage.label,
        total: stageStudents.length,
        students: stageStudents.slice(0, 6).map((student) => ({
          id: student.id,
          studentName: student.studentName,
          mobileNumber: student.mobileNumber,
          emailId: student.emailId,
          currentStage: student.currentStage,
          branch: student.branch,
          counselor: student.counselor,
          latestApplication: student.applications[0] ?? null,
          visaProfile: student.visaProfile,
          loanProfile: student.loanProfile,
          moduleProgress: student.moduleProgress,
        })),
      };
    });
    const currentLoanApproved = await db.loanApplication.count({
      where: {
        loanStatus: "Approved",
        ...(scope.kind === "branches"
          ? {
              branchId: {
                in: scope.branchIds,
              },
            }
          : scope.kind === "user"
            ? {
                counselorId: currentUser.id,
              }
            : {}),

        updatedAt: {
          gte: dateRange.startDate,
          lte: dateRange.endDate,
        },
      },
    });

    const previousLoanApproved = await db.loanApplication.count({
      where: {
        loanStatus: "Approved",

        ...(scope.kind === "branches"
          ? {
              branchId: {
                in: scope.branchIds,
              },
            }
          : {}),

        updatedAt: {
          gte: dateRange.previousStartDate,
          lte: dateRange.previousEndDate,
        },
      },
    });
    const counselors = performanceReport.counselorPerformance
      .slice()
      .sort((a, b) => {
        if (b.visaApproved !== a.visaApproved) {
          return b.visaApproved - a.visaApproved;
        }

        if (b.achieved !== a.achieved) {
          return b.achieved - a.achieved;
        }

        return b.applications - a.applications;
      })
      .slice(0, 10)
      .map((counselor) => ({
        id: counselor.counselorId,
        name: counselor.counselor,
        branch: counselor.branch,
        walkins: counselor.totalWalkins,
        leadsCreated: counselor.leadsCreated,
        students: counselor.students,
        applications: counselor.applications,
        offers: counselor.offers,
        casReceived: counselor.casReceived,
        visaApproved: counselor.visaApproved,
        target: counselor.target,
        achieved: counselor.achieved,
        targetCompletionPercentage: counselor.targetCompletionPercentage,
        conversionRate: calculateVisaConversionRate(
          counselor.visaApproved,
          counselor.totalWalkins,
        ),
      }));

    return NextResponse.json({
      success: true,
      data: {
        period,
        periodLabel: dateRange.label,
        access: {
          kind: scope.kind,
          roleName: currentUser.role.name,
          userName: currentUser.name,
        },
        kpis: {
          totalWalkins: {
            value: currentLeads,
            change: calculateChange(currentLeads, previousLeads),
          },
          activeStudents: {
            value: currentStudents,
            change: calculateChange(currentStudents, previousStudents),
          },
          applications: {
            value: currentApplications,
            change: calculateChange(currentApplications, previousApplications),
          },
          loanApproved: {
            value: currentLoanApproved,
            change: calculateChange(currentLoanApproved, previousLoanApproved),
          },
          offers: {
            value: performanceReport.summary.offerApplications,
          },
          casReceived: {
            value: performanceReport.summary.casReceivedStudents,
          },
          visaApproved: {
            value: performanceReport.summary.visaApprovedStudents,
          },
          targetAchievement: {
            value: performanceReport.summary.targetCompletionPercentage,
          },
          conversionRate: {
            value: calculateVisaConversionRate(
              performanceReport.summary.visaApprovedStudents,
              currentLeads,
            ),
          },
        },
        masterTracker,
        counselors,
        operations: {
          pendingFollowUps,
          incompleteModules,
          pendingApplications,
          pendingCas,
          pendingVisas,
          pendingLoans,
        },
        recentActivities: recentActivities.map((activity) => ({
          id: activity.id,
          title: `${activity.student.studentName} · ${activity.type
            .replace(/_/g, " ")
            .replace(/\b\w/g, (character) => character.toUpperCase())}`,
          description:
            activity.description || `${activity.type} activity recorded`,
          studentName: activity.student.studentName,
          createdByName: activity.createdBy?.name ?? "System",
          type: activity.type,
          createdAt: activity.createdAt.toISOString(),
        })),
        summary: {
          students: masterTrackerStudents.length,
          counselors: performanceReport.counselorPerformance.length,
          branches: performanceReport.branchPerformance.length,
        },
      },
      message: "Dashboard fetched successfully",
    });
  } catch (error) {
    console.error("GET_DASHBOARD_ERROR", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to load dashboard",
      },
      {
        status: 500,
      },
    );
  }
}
