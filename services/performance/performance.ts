import axios from "axios";
import { api } from "@/lib/api";
import type {
  ApiEnvelope,
  CounsellorPerformance,
  PerformanceQueryParams,
  PerformanceResponse,
  UpdateMonthlyTargetPayload,
} from "@/types/counsellor-performance";

export const API_URL = "/users/counsellors/performance";

export function unwrapResponse<T>(payload: ApiEnvelope<T>): T | null {
  if (!payload) {
    return null;
  }

  if (typeof payload === "object" && "data" in payload) {
    return payload.data ?? null;
  }

  return payload as T;
}

function buildRequestParams(params: PerformanceQueryParams) {
  return {
    period: params.period,
    date: params.date,
    startDate:
      params.period === "custom" ? params.startDate || undefined : undefined,
    endDate:
      params.period === "custom" ? params.endDate || undefined : undefined,
    branchId:
      params.branchId && params.branchId !== "all"
        ? params.branchId
        : undefined,
    search: params.search?.trim() || undefined,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };
}

export async function getCounsellorPerformance(params: PerformanceQueryParams) {
  const response = await api.get<ApiEnvelope<PerformanceResponse>>(API_URL, {
    params: buildRequestParams(params),
  });

  const payload = unwrapResponse(response.data);

  if (!payload || !Array.isArray(payload.counsellors)) {
    throw new Error("Invalid counsellor performance response");
  }

  return payload;
}

export async function exportCounsellorPerformance(
  params: PerformanceQueryParams,
) {
  try {
    const response = await api.get<Blob>(API_URL, {
      params: {
        ...buildRequestParams(params),
        format: "xlsx",
      },
      responseType: "blob",
    });

    const disposition = response.headers["content-disposition"] as
      | string
      | undefined;
    const filenameMatch = disposition?.match(/filename="?([^";]+)"?/i);

    return {
      blob: response.data,
      filename:
        filenameMatch?.[1] ??
        `counsellor-performance-${params.period}-${params.date}.xlsx`,
    };
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.data instanceof Blob &&
      error.response.data.type.includes("application/json")
    ) {
      const text = await error.response.data.text();
      let payload: {
        message?: string;
        error?: string | { message?: string };
      } | null = null;

      try {
        payload = JSON.parse(text) as {
          message?: string;
          error?: string | { message?: string };
        };
      } catch {
        throw new Error("Unable to export performance data");
      }

      if (typeof payload.error === "object" && payload.error?.message) {
        throw new Error(payload.error.message);
      }

      if (typeof payload.error === "string") {
        throw new Error(payload.error);
      }

      throw new Error(payload.message || "Unable to export performance data");
    }

    throw error;
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function updateMonthlyTarget(payload: UpdateMonthlyTargetPayload) {
  await api.put(API_URL, payload);

  return payload;
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
    timeZone: "Asia/Kolkata",
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
          error?: string | { message?: string };
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
  if (counsellor.target <= 0) {
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

  if (counsellor.completionPercentage >= 75) {
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
