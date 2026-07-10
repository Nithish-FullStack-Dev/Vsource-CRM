import axios from "axios";
import { api } from "@/lib/api";
import type {
  ApiResponse,
  PerformanceReportData,
  PerformanceReportFilters,
  PerformanceReportFilterOptions,
} from "@/types/performance-report";

type ErrorPayload = {
  message?: string;
  error?: string;
};

const endpoints = {
  report: "/reports/performance",
  filters: "/reports/filters",
  export: "/reports/performance/export",
} as const;

function buildParams(
  filters: PerformanceReportFilters,
  pagination?: { page: number; limit: number },
): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries({ ...filters, ...pagination }).filter(
      ([, value]) => value !== "" && value !== null && value !== undefined,
    ),
  ) as Record<string, string | number>;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const data = error.response?.data as ErrorPayload | string | undefined;

  if (typeof data === "string") {
    const message = data
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return message.slice(0, 180) || error.message || fallback;
  }

  return data?.message || data?.error || error.message || fallback;
}

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const { data } = await request;

    if (!data.success) {
      throw new Error(data.message || "Request failed");
    }

    return data.data;
  } catch (error) {
    throw new Error(getErrorMessage(error, "Request failed"));
  }
}

export function getPerformanceReport(
  filters: PerformanceReportFilters,
  page: number,
  limit: number,
): Promise<PerformanceReportData> {
  return unwrap(
    api.get<ApiResponse<PerformanceReportData>>(endpoints.report, {
      params: buildParams(filters, { page, limit }),
    }),
  );
}

export function getPerformanceReportFilterOptions(): Promise<PerformanceReportFilterOptions> {
  return unwrap(
    api.get<ApiResponse<PerformanceReportFilterOptions>>(endpoints.filters),
  );
}

export async function exportPerformanceReport(
  filters: PerformanceReportFilters,
): Promise<Blob> {
  try {
    const { data } = await api.get<Blob>(endpoints.export, {
      params: buildParams(filters),
      responseType: "blob",
    });

    return data;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.data instanceof Blob &&
      error.response.data.type.includes("application/json")
    ) {
      const payload = JSON.parse(
        await error.response.data.text(),
      ) as ErrorPayload;

      throw new Error(
        payload.message || payload.error || "Unable to export report",
      );
    }

    throw new Error(
      getErrorMessage(error, "Unable to export performance report"),
    );
  }
}
