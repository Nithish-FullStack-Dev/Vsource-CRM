type Branch = {
  id: string;
  name: string;
};

type CounsellorPerformance = {
  id: string;
  name: string;
  email: string;
  branches: Branch[];
  joinedAt: string;
  year: number;
  month: number;
  periodStart: string;
  target: number;
  achieved: number;
  leadsCreated: number;
  completionPercentage: number;
  targetAchieved: boolean;
};

type PerformanceSummary = {
  totalTarget: number;
  totalAchieved: number;
  totalLeadsCreated: number;
  completionPercentage: number;
};

type PerformanceResponse = {
  period: {
    year: number;
    month: number;
    start: string;
    end: string;
  };
  summary: PerformanceSummary;
  counsellors: CounsellorPerformance[];
};

type RawBranch = {
  id?: string | null;
  name?: string | null;
} | null;

type RawCounsellorPerformance = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  branches?: RawBranch[] | null;
  joinedAt?: string | null;
  year?: number | null;
  month?: number | null;
  periodStart?: string | null;
  target?: number | null;
  achieved?: number | null;
  leadsCreated?: number | null;
  completionPercentage?: number | null;
  targetAchieved?: boolean | null;
} | null;

type RawPerformanceResponse = {
  period?: {
    year?: number | null;
    month?: number | null;
    start?: string | null;
    end?: string | null;
  } | null;
  summary?: {
    totalTarget?: number | null;
    totalAchieved?: number | null;
    totalLeadsCreated?: number | null;
    completionPercentage?: number | null;
  } | null;
  counsellors?: RawCounsellorPerformance[] | null;
} | null;

type UpdateMonthlyTargetPayload = {
  counsellorId: string;
  year: number;
  month: number;
  target: number;
};

type TargetDialogCounsellor = {
  id: string;
  name: string;
  target: number;
};

type ApiEnvelope<T> =
  | T
  | {
      success?: boolean;
      message?: string;
      data?: T | null;
    }
  | null
  | undefined;

export type {
  Branch,
  CounsellorPerformance,
  PerformanceSummary,
  PerformanceResponse,
  RawBranch,
  RawCounsellorPerformance,
  RawPerformanceResponse,
  UpdateMonthlyTargetPayload,
  TargetDialogCounsellor,
  ApiEnvelope,
};
