"use client";

import { type ComponentType, useMemo, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  CheckCircle2,
  FileCheck2,
  FileText,
  GraduationCap,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Target,
  UserRoundCheck,
  Users,
} from "lucide-react";

import { PageHeader, PageTransition } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type DashboardPeriod = "today" | "week" | "month" | "year";

type MasterTrackerStage =
  | "Inquiry"
  | "Documents"
  | "Applied"
  | "Loan Process"
  | "Visa Process";

type TrackerCardState =
  | "not_started"
  | "in_progress"
  | "completed"
  | "rejected";

interface DashboardKpi {
  value: number;
  change?: number;
}

interface DashboardStudent {
  id: string;
  studentName: string;
  mobileNumber: string;
  emailId: string;
  currentStage: string | null;
  branch: {
    id: string;
    name: string;
    code?: string | null;
  };
  counselor: {
    id: string;
    name: string;
  } | null;
  latestApplication: {
    id: string;
    status: string;
    offerStatus: string | null;
    university: {
      name: string;
    } | null;
    course: {
      name: string;
    } | null;
  } | null;
  visaProfile: {
    casStatus: string | null;
    visaStatus: string | null;
    depositStatus: string | null;
  } | null;
  loanProfile: {
    loanStatus: string | null;
    nbfc: string | null;
    disbursed: boolean;
  } | null;
  moduleProgress: Array<{
    module: string;
    status: string;
    progress: number;
  }>;
}

interface DashboardTrackerColumn {
  key: MasterTrackerStage;
  label: string;
  total: number;
  students: DashboardStudent[];
}

interface DashboardCounselor {
  id: string;
  name: string;
  branch: string;
  walkins: number;
  leadsCreated: number;
  students: number;
  applications: number;
  offers: number;
  casReceived: number;
  visaApproved: number;
  target: number;
  achieved: number;
  targetCompletionPercentage: number;
  conversionRate: number;
}

interface DashboardResponse {
  period: DashboardPeriod;
  periodLabel: string;
  access: {
    kind: "all" | "branches" | "user";
    roleName: string;
    userName: string;
  };
  kpis: {
    totalWalkins: DashboardKpi;
    activeStudents: DashboardKpi;
    applications: DashboardKpi;
    loanApproved: DashboardKpi;
    offers: DashboardKpi;
    casReceived: DashboardKpi;
    visaApproved: DashboardKpi;
    targetAchievement: DashboardKpi;
    conversionRate: DashboardKpi;
  };
  masterTracker: DashboardTrackerColumn[];
  counselors: DashboardCounselor[];
  summary: {
    students: number;
    counselors: number;
    branches: number;
  };
}

const PERIOD_OPTIONS: Array<{
  value: DashboardPeriod;
  label: string;
}> = [
  {
    value: "today",
    label: "Today",
  },
  {
    value: "week",
    label: "This week",
  },
  {
    value: "month",
    label: "This month",
  },
  {
    value: "year",
    label: "This year",
  },
];

const MODULE_MAP: Record<MasterTrackerStage, string> = {
  Inquiry: "basic_information",
  Documents: "documents",
  Applied: "university_applications",
  "Loan Process": "loan_process",
  "Visa Process": "visa_process",
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatChange(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function humanize(value?: string | null): string {
  if (!value) {
    return "Not set";
  }

  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function getCurrentModuleProgress(
  student: DashboardStudent,
  stage: MasterTrackerStage,
) {
  return student.moduleProgress.find(
    (progress) => progress.module === MODULE_MAP[stage],
  );
}

function getTrackerCardState(status?: string, progress = 0): TrackerCardState {
  if (status === "rejected") {
    return "rejected";
  }

  if (status === "completed" || progress >= 100) {
    return "completed";
  }

  if (
    progress > 0 ||
    status === "started" ||
    status === "in_progress" ||
    status === "need_corrections"
  ) {
    return "in_progress";
  }

  return "not_started";
}

function getTrackerCardClass(state: TrackerCardState): string {
  if (state === "completed") {
    return [
      "border-emerald-300",
      "bg-emerald-100",
      "dark:border-emerald-800",
      "dark:bg-emerald-950/60",
    ].join(" ");
  }

  if (state === "in_progress") {
    return [
      "border-amber-300",
      "bg-amber-100",
      "dark:border-amber-800",
      "dark:bg-amber-950/60",
    ].join(" ");
  }

  if (state === "rejected") {
    return [
      "border-red-300",
      "bg-red-100",
      "dark:border-red-800",
      "dark:bg-red-950/60",
    ].join(" ");
  }

  return ["border-border", "bg-background"].join(" ");
}

function getTrackerProgressClass(state: TrackerCardState): string {
  if (state === "completed") {
    return "bg-emerald-500";
  }

  if (state === "in_progress") {
    return "bg-amber-500";
  }

  if (state === "rejected") {
    return "bg-red-500";
  }

  return "bg-muted-foreground/40";
}

export default function Dashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("today");

  const { data, isLoading, isFetching, isError, error, refetch } =
    useQuery<DashboardResponse>({
      queryKey: ["dashboard", period],
      queryFn: async () => {
        const response = await axios.get<{
          success: boolean;
          data: DashboardResponse;
        }>("/api/dashboard", {
          params: {
            period,
          },
          withCredentials: true,
        });

        return response.data.data;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    });

  const selectedPeriodLabel = useMemo(
    () =>
      PERIOD_OPTIONS.find((option) => option.value === period)?.label ??
      "Today",
    [period],
  );

  const kpis = useMemo(() => {
    if (!data) {
      return [];
    }

    return [
      {
        label: "Total Walk-ins",
        value: formatNumber(data.kpis.totalWalkins.value),
        change: data.kpis.totalWalkins.change,
        icon: Users,
        description: selectedPeriodLabel,
      },
      {
        label: "Active Students",
        value: formatNumber(data.kpis.activeStudents.value),
        change: data.kpis.activeStudents.change,
        icon: GraduationCap,
        description: selectedPeriodLabel,
      },
      {
        label: "Loan Approved",
        value: formatNumber(data.kpis.loanApproved.value),
        change: data.kpis.loanApproved.change,
        icon: CheckCircle2,
        description: selectedPeriodLabel,
      },
      {
        label: "Offers",
        value: formatNumber(data.kpis.offers.value),
        icon: FileCheck2,
        description: selectedPeriodLabel,
      },
      {
        label: "CAS Received",
        value: formatNumber(data.kpis.casReceived.value),
        icon: BadgeCheck,
        description: selectedPeriodLabel,
      },
      {
        label: "Visa Approved",
        value: formatNumber(data.kpis.visaApproved.value),
        icon: ShieldCheck,
        description: selectedPeriodLabel,
      },
      {
        label: "Target Achievement",
        value: formatPercentage(data.kpis.targetAchievement.value),
        icon: Target,
        description: selectedPeriodLabel,
      },
      {
        label: "Conversion Rate",
        value: formatPercentage(data.kpis.conversionRate.value),
        icon: UserRoundCheck,
        description: "Walk-ins to visa approvals",
      },
    ];
  }, [data, selectedPeriodLabel]);

  if (isLoading) {
    return <DashboardLoading />;
  }

  if (isError || !data) {
    return (
      <DashboardError
        message={
          axios.isAxiosError(error)
            ? error.response?.data?.message || "Failed to load dashboard"
            : error instanceof Error
              ? error.message
              : "Failed to load dashboard"
        }
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <PageTransition>
      <PageHeader
        title="Dashboard"
        description={`Real-time operational overview · ${data.access.roleName}`}
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isFetching}>
                {isFetching ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Calendar className="mr-1.5 size-4" />
                )}

                {selectedPeriodLabel}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {PERIOD_OPTIONS.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  onClick={() => setPeriod(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="space-y-5 sm:space-y-6">
        <section>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {kpis.map((kpi, index) => (
              <KpiCard key={kpi.label} index={index} {...kpi} />
            ))}
          </div>
        </section>

        <section>
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-3 border-b px-4 py-4 sm:px-5 lg:px-6">
              <div className="min-w-0">
                <CardTitle className="text-base">
                  Master Daily Tracker
                </CardTitle>

                <p className="mt-1 text-xs text-muted-foreground">
                  {selectedPeriodLabel} student workflow
                </p>
              </div>

              <Badge variant="secondary" className="shrink-0">
                {formatNumber(data.summary.students)} Students
              </Badge>
            </CardHeader>

            <CardContent className="p-3 sm:p-4 lg:p-5">
              <div className="overflow-x-auto">
                <div className="grid min-w-[1100px] grid-cols-5 gap-3 lg:gap-4">
                  {data.masterTracker.map((column) => (
                    <TrackerColumn key={column.key} column={column} />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className="overflow-hidden">
            <CardHeader className="border-b px-4 py-4 sm:px-5 lg:px-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-base">Users Performance</CardTitle>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedPeriodLabel} performance based on role and branch
                    access
                  </p>
                </div>

                <Badge variant="secondary" className="mt-2 w-fit sm:mt-0">
                  {formatNumber(data.summary.counselors)} Counselors
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {data.counselors.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1080px] text-sm">
                    <thead>
                      <tr className="border-b bg-muted/30 text-xs text-muted-foreground">
                        <th className="px-4 py-3 text-left font-medium sm:px-5">
                          Counselor
                        </th>
                        <th className="px-4 py-3 text-left font-medium">
                          Branch
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Walk-ins
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Students
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Applications
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Offers
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          CAS
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Visa Approved
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Target
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Achieved
                        </th>
                        <th className="px-4 py-3 text-right font-medium sm:px-5">
                          Conversion
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.counselors.map((counselor) => (
                        <tr
                          key={counselor.id}
                          className="border-b transition-colors last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 sm:px-5">
                            <span className="block max-w-[180px] truncate font-medium">
                              {counselor.name}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-muted-foreground">
                            {counselor.branch}
                          </td>

                          <MetricCell value={counselor.walkins} />

                          <MetricCell value={counselor.students} />

                          <MetricCell value={counselor.applications} />

                          <MetricCell value={counselor.offers} />

                          <MetricCell value={counselor.casReceived} />

                          <td className="px-4 py-3 text-right">
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                              {formatNumber(counselor.visaApproved)}
                            </Badge>
                          </td>

                          <MetricCell value={counselor.target} />

                          <td className="px-4 py-3 text-right font-semibold">
                            {formatNumber(counselor.achieved)}
                          </td>

                          <td className="px-4 py-3 text-right sm:px-5">
                            <ConversionBadge value={counselor.conversionRate} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState message="No counselor performance data available" />
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </PageTransition>
  );
}

interface KpiCardProps {
  index: number;
  label: string;
  value: string;
  change?: number;
  description: string;
  icon: ComponentType<{
    className?: string;
  }>;
}

function KpiCard({
  index,
  label,
  value,
  change,
  description,
  icon: Icon,
}: KpiCardProps) {
  const isPositive = (change ?? 0) >= 0;

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 10,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: index * 0.04,
      }}
      className="h-full"
    >
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent">
              <Icon className="size-5 text-primary" />
            </div>

            {change !== undefined ? (
              <Badge
                variant={isPositive ? "secondary" : "destructive"}
                className="gap-0.5 text-[10px]"
              >
                {isPositive ? (
                  <ArrowUpRight className="size-3" />
                ) : (
                  <ArrowDownRight className="size-3" />
                )}

                {formatChange(change)}
              </Badge>
            ) : null}
          </div>

          <div className="mt-4 text-2xl font-bold tracking-tight">{value}</div>

          <div className="mt-1 truncate text-xs text-muted-foreground">
            {label} · {description}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TrackerColumn({ column }: { column: DashboardTrackerColumn }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-muted/20 p-3">
      <div className="mb-3 flex items-center justify-between gap-2 px-0.5">
        <div className="truncate text-sm font-semibold">{column.label}</div>

        <Badge
          variant="secondary"
          className="h-6 min-w-6 shrink-0 justify-center px-2"
        >
          {formatNumber(column.total)}
        </Badge>
      </div>

      <div className="space-y-2.5">
        {column.students.length > 0 ? (
          column.students.map((student) => {
            const moduleProgress = getCurrentModuleProgress(
              student,
              column.key,
            );

            const progressValue = Math.min(
              100,
              Math.max(0, moduleProgress?.progress ?? 0),
            );

            const cardState = getTrackerCardState(
              moduleProgress?.status,
              progressValue,
            );

            return (
              <Card
                key={student.id}
                className={`overflow-hidden shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${getTrackerCardClass(
                  cardState,
                )}`}
              >
                <CardContent className="p-3.5">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">
                      {student.studentName}
                    </div>

                    <div className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {student.branch.name}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px]">
                      <span className="text-muted-foreground">
                        {humanize(moduleProgress?.status ?? "not_started")}
                      </span>

                      <span className="font-semibold">{progressValue}%</span>
                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-background/70">
                      <div
                        className={`h-full rounded-full transition-[width] duration-300 ${getTrackerProgressClass(
                          cardState,
                        )}`}
                        style={{
                          width: `${progressValue}%`,
                        }}
                      />
                    </div>
                  </div>

                  {student.latestApplication ? (
                    <div className="mt-3 rounded-xl border bg-background/60 p-2.5">
                      <div className="truncate text-[11px] font-semibold">
                        {student.latestApplication.university?.name ??
                          "University not set"}
                      </div>

                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="min-w-0 flex-1 truncate text-[10px] text-muted-foreground">
                          {student.latestApplication.course?.name ??
                            "Course not set"}
                        </span>

                        <Badge
                          variant="outline"
                          className="h-5 max-w-[80px] shrink-0 truncate bg-background/70 px-1.5 text-[9px]"
                        >
                          {humanize(
                            student.latestApplication.offerStatus ||
                              student.latestApplication.status,
                          )}
                        </Badge>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed bg-background/60 p-4 text-center">
            <span className="text-xs text-muted-foreground">No students</span>
          </div>
        )}

        {column.total > column.students.length ? (
          <div className="pt-1 text-center text-[10px] font-medium text-muted-foreground">
            +{column.total - column.students.length} more students
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricCell({ value }: { value: number }) {
  return <td className="px-4 py-3 text-right">{formatNumber(value)}</td>;
}

function ConversionBadge({ value }: { value: number }) {
  const className =
    value >= 60
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
      : value >= 30
        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
        : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";

  return (
    <Badge variant="secondary" className={className}>
      {formatPercentage(value)}
    </Badge>
  );
}

function DashboardLoading() {
  return (
    <PageTransition>
      <PageHeader
        title="Dashboard"
        description="Loading dashboard information..."
      />

      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />

          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    </PageTransition>
  );
}

function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <PageTransition>
      <PageHeader
        title="Dashboard"
        description="Real-time operational overview."
      />

      <Card>
        <CardContent className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-6 text-center">
          <div>
            <h2 className="font-semibold">Unable to load dashboard</h2>

            <p className="mt-1 text-sm text-muted-foreground">{message}</p>
          </div>

          <Button type="button" variant="outline" onClick={onRetry}>
            <RefreshCw className="mr-2 size-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </PageTransition>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center p-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
