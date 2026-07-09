export type PerformancePeriodType = "daily" | "weekly" | "monthly" | "custom";

export type PerformanceSortField =
  | "name"
  | "target"
  | "achieved"
  | "applicationsCreated"
  | "completionPercentage";

export type SortOrder = "asc" | "desc";

export type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

export type Branch = {
  id: string;
  name: string;
};

export type IntakeOption = {
  id: string;
  name: string;
};

export type PerformanceSummary = {
  totalCounsellors: number;
  totalTarget: number;
  totalAchieved: number;
  totalApplicationsCreated: number;
  completionPercentage: number;
};

export type PerformancePeriod = {
  type: PerformancePeriodType;
  label: string;
  date: string;
  startDate: string;
  endDate: string;
  intakeId: string;
  intakeName: string;
};

export type CounsellorPerformance = {
  id: string;
  name: string;
  email: string;
  joinedAt: string | null;
  branches: Branch[];
  target: number;
  achieved: number;
  applicationsCreated: number;
  completionPercentage: number;
  targetAchieved: boolean;
};

export type PerformanceResponse = {
  period: PerformancePeriod;
  summary: PerformanceSummary;
  counsellors: CounsellorPerformance[];
  availableBranches: Branch[];
  availableIntakes: IntakeOption[];
};

export type PerformanceQueryParams = {
  period: PerformancePeriodType;
  date: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  intakeId?: string;
  search?: string;
  sortBy?: PerformanceSortField;
  sortOrder?: SortOrder;
};

export type TargetDialogCounsellor = {
  id: string;
  name: string;
  target: number;
};

export type UpdateIntakeTargetPayload = {
  counsellorId: string;
  intakeId: string;
  target: number;
};
