export type PerformancePeriodType = "daily" | "weekly" | "monthly";

export type PerformanceSortField =
  | "name"
  | "target"
  | "achieved"
  | "leadsCreated"
  | "completionPercentage";

export type SortOrder = "asc" | "desc";

export type ApiEnvelope<T> =
  | T
  | {
      success?: boolean;
      message?: string;
      data?: T | null;
    };

export type Branch = {
  id: string;
  name: string;
};

export type CounsellorPerformance = {
  id: string;
  name: string;
  email: string;
  branches: Branch[];
  joinedAt: string;
  target: number;
  achieved: number;
  leadsCreated: number;
  completionPercentage: number;
  targetAchieved: boolean;
};

export type PerformanceSummary = {
  totalCounsellors: number;
  totalTarget: number;
  totalAchieved: number;
  totalLeadsCreated: number;
  completionPercentage: number;
};

export type PerformancePeriod = {
  type: PerformancePeriodType;
  date: string;
  year: number;
  month: number;
  start: string;
  end: string;
  label: string;
  targetPeriodStart: string;
};

export type PerformanceAccess = {
  role: string;
  selfOnly: boolean;
  assignedBranchIds: string[];
  selectedBranchIds: string[];
};

export type PerformanceResponse = {
  access: PerformanceAccess;
  period: PerformancePeriod;
  summary: PerformanceSummary;
  availableBranches: Branch[];
  counsellors: CounsellorPerformance[];
};

export type PerformanceQueryParams = {
  period: PerformancePeriodType;
  date: string;
  branchId?: string;
  search?: string;
  sortBy?: PerformanceSortField;
  sortOrder?: SortOrder;
};

export type UpdateMonthlyTargetPayload = {
  counsellorId: string;
  year: number;
  month: number;
  target: number;
};

export type TargetDialogCounsellor = {
  id: string;
  name: string;
  target: number;
};
