import { api } from "@/lib/api";
import { MastersResponse } from "@/lib/crmTypes";

export type DateRangeType = "today" | "week" | "month" | "custom";

export type DashboardFilters = {
  branchId: string;
  userId: string;
  intake: string;
  dateRangeType: DateRangeType;
  startDate?: string;
  endDate?: string;
};

export type UpdateTargetPayload = {
  branchId: string;
  userId: string;
  intake: string;
  target: number;
};

export const targetService = {
  async getMasters(): Promise<MastersResponse> {
    const { data } = await api.get<MastersResponse>("/masters");
    return data;
  },

  async getDashboard(filters: DashboardFilters): Promise<any> {
    const { data } = await api.get("/assign-target", {
      params: filters,
    });

    return data;
  },

  async updateTarget(payload: UpdateTargetPayload): Promise<any> {
    const { data } = await api.post("/targets", payload);
    return data;
  },
};
