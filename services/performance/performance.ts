import { api } from "@/lib/api";
import {
  ApiEnvelope,
  Branch,
  CounsellorPerformance,
  PerformanceResponse,
  RawBranch,
  RawPerformanceResponse,
  UpdateMonthlyTargetPayload,
} from "@/types/counsellor-performance";
import axios from "axios";

export const API_URL = "/users/counsellors/performance";

function safeNumber(value: number | null | undefined, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function safeString(value: string | null | undefined, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeBranches(branches: RawBranch[] | null | undefined): Branch[] {
  if (!Array.isArray(branches)) {
    return [];
  }

  return branches.reduce<Branch[]>((result, branch) => {
    const id = safeString(branch?.id);
    const name = safeString(branch?.name, "Unnamed branch");

    if (!id) {
      return result;
    }

    result.push({
      id,
      name,
    });

    return result;
  }, []);
}

export function updateTargetInCachedReport(
  report: PerformanceResponse,
  counsellorId: string,
  target: number,
): PerformanceResponse {
  const safeCounsellors = Array.isArray(report?.counsellors)
    ? report.counsellors
    : [];

  const counsellors = safeCounsellors.map((counsellor) => {
    if (counsellor.id !== counsellorId) {
      return counsellor;
    }

    const achieved = Math.max(counsellor.achieved ?? 0, 0);

    const completionPercentage =
      target > 0 ? Math.round((achieved / target) * 100) : 0;

    return {
      ...counsellor,
      target,
      completionPercentage,
      targetAchieved: target > 0 && achieved >= target,
    };
  });

  const totalTarget = counsellors.reduce(
    (total, counsellor) => total + (counsellor.target ?? 0),
    0,
  );

  const totalAchieved = counsellors.reduce(
    (total, counsellor) => total + (counsellor.achieved ?? 0),
    0,
  );

  const totalLeadsCreated = counsellors.reduce(
    (total, counsellor) => total + (counsellor.leadsCreated ?? 0),
    0,
  );

  return {
    ...report,
    counsellors,
    summary: {
      totalTarget,
      totalAchieved,
      totalLeadsCreated,
      completionPercentage:
        totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0,
    },
  };
}

function normalizePerformanceResponse(
  payload: RawPerformanceResponse,
  requestedYear: number,
  requestedMonth: number,
): PerformanceResponse {
  const rawCounsellors = Array.isArray(payload?.counsellors)
    ? payload.counsellors
    : [];

  const counsellors = rawCounsellors.reduce<CounsellorPerformance[]>(
    (result, item) => {
      const id = safeString(item?.id);

      if (!id) {
        return result;
      }

      const target = Math.max(safeNumber(item?.target), 0);

      const achieved = Math.max(safeNumber(item?.achieved), 0);

      const leadsCreated = Math.max(safeNumber(item?.leadsCreated), 0);

      const completionPercentage = Math.max(
        safeNumber(
          item?.completionPercentage,
          target > 0 ? Math.round((achieved / target) * 100) : 0,
        ),
        0,
      );

      result.push({
        id,
        name: safeString(item?.name, "Unnamed counsellor"),
        email: safeString(item?.email, "Email not available"),
        branches: normalizeBranches(item?.branches),
        joinedAt: safeString(item?.joinedAt),
        year: safeNumber(item?.year, requestedYear),
        month: safeNumber(item?.month, requestedMonth),
        periodStart: safeString(item?.periodStart),
        target,
        achieved,
        leadsCreated,
        completionPercentage,
        targetAchieved:
          typeof item?.targetAchieved === "boolean"
            ? item.targetAchieved
            : target > 0 && achieved >= target,
      });

      return result;
    },
    [],
  );

  const calculatedTarget = counsellors.reduce(
    (total, item) => total + item.target,
    0,
  );

  const calculatedAchieved = counsellors.reduce(
    (total, item) => total + item.achieved,
    0,
  );

  const calculatedLeadsCreated = counsellors.reduce(
    (total, item) => total + item.leadsCreated,
    0,
  );

  const totalTarget = safeNumber(
    payload?.summary?.totalTarget,
    calculatedTarget,
  );

  const totalAchieved = safeNumber(
    payload?.summary?.totalAchieved,
    calculatedAchieved,
  );

  const totalLeadsCreated = safeNumber(
    payload?.summary?.totalLeadsCreated,
    calculatedLeadsCreated,
  );

  const completionPercentage = Math.max(
    safeNumber(
      payload?.summary?.completionPercentage,
      totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0,
    ),
    0,
  );

  return {
    period: {
      year: safeNumber(payload?.period?.year, requestedYear),
      month: safeNumber(payload?.period?.month, requestedMonth),
      start: safeString(payload?.period?.start),
      end: safeString(payload?.period?.end),
    },
    summary: {
      totalTarget,
      totalAchieved,
      totalLeadsCreated,
      completionPercentage,
    },
    counsellors,
  };
}

export function unwrapResponse<T>(payload: ApiEnvelope<T>): T | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === "object" && "data" in payload) {
    return payload.data ?? null;
  }

  return payload as T;
}

export async function getCounsellorPerformance(params: {
  year: number;
  month: number;
  branchId?: string;
}) {
  const response = await api.get<ApiEnvelope<RawPerformanceResponse>>(API_URL, {
    params: {
      year: params.year,
      month: params.month,
      branchId: params.branchId,
    },
  });

  const payload = unwrapResponse(response.data);

  if (!payload) {
    throw new Error("Performance data was not returned by the server");
  }

  if (!Array.isArray(payload.counsellors)) {
    throw new Error("Invalid counsellor performance response");
  }

  return normalizePerformanceResponse(payload, params.year, params.month);
}

export function getCurrentIstPeriod() {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "numeric",
    }).formatToParts(new Date());

    const year = Number(parts.find((part) => part.type === "year")?.value);

    const month = Number(parts.find((part) => part.type === "month")?.value);

    return {
      year:
        Number.isInteger(year) && year > 0 ? year : new Date().getFullYear(),
      month:
        Number.isInteger(month) && month >= 1 && month <= 12
          ? month
          : new Date().getMonth() + 1,
    };
  } catch {
    return {
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
    };
  }
}

export function formatDate(date: string | null | undefined) {
  if (!date) {
    return "Not available";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsedDate);
}

export function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as
      | {
          message?: string;
          error?:
            | string
            | {
                message?: string;
              };
        }
      | null
      | undefined;

    if (
      typeof responseData?.error === "object" &&
      responseData.error?.message
    ) {
      return responseData.error.message;
    }

    if (typeof responseData?.error === "string") {
      return responseData.error;
    }

    return responseData?.message || error.message || "Something went wrong";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

export function getPerformanceStatus(counsellor: CounsellorPerformance) {
  const target = counsellor.target ?? 0;
  const percentage = counsellor.completionPercentage ?? 0;

  if (target <= 0) {
    return {
      label: "Target not set",
      variant: "outline" as const,
    };
  }

  if (counsellor.targetAchieved) {
    return {
      label: "Achieved",
      variant: "default" as const,
    };
  }

  if (percentage >= 75) {
    return {
      label: "On track",
      variant: "secondary" as const,
    };
  }

  return {
    label: "Behind",
    variant: "destructive" as const,
  };
}

export async function updateMonthlyTarget(payload: UpdateMonthlyTargetPayload) {
  await api.put(API_URL, payload);

  return payload;
}
