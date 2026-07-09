export interface BranchOption {
  id: string;
  name: string;
}

export interface UserOption {
  id: string;
  name: string;
  branchIds: string[];
  role: string;
  avatar: string;
}

export interface IntakeOption {
  id: string;
  name: string;
}

export interface TargetRecord {
  id: string;
  counsellorId: string;
  intakeId: string;
  target: number;
}

export interface DashboardDataFilters {
  branchId: string | null;
  userId: string | null;
  intake: string | null;
  dateRangeType: "today" | "week" | "month" | "custom";
  startDate: string | null;
  endDate: string | null;
}

export interface UserPerformance {
  userId: string;
  userName: string;
  role: string;
  avatar: string;
  target: number;
  walkIns: number;
  applications: number;
  visaConversions: number;
  progress: number;
}

export interface BranchPerformanceGroup {
  branchId: string;
  branchName: string;
  users: UserPerformance[];
  totals: {
    target: number;
    walkIns: number;
    applications: number;
    visaConversions: number;
    progress: number;
  };
}

export interface DashboardResponse {
  filters: {
    branchId: string | null;
    userId: string | null;
    intake: string | null;
    dateRangeType: "today" | "week" | "month" | "custom";
    startDate: string;
    endDate: string;
  };
  summary: {
    target: number;
    walkIns: number;
    applications: number;
    visaConversions: number;
    progress: number;
  };
  branches: BranchPerformanceGroup[];
  grandTotal: {
    target: number;
    walkIns: number;
    applications: number;
    visaConversions: number;
    progress: number;
  };
}

export interface MastersResponse {
  branches: BranchOption[];
  users: UserOption[];
  intakes: IntakeOption[];
  defaultBranch: string;
  defaultUser: string;
  defaultIntake: string;
}
