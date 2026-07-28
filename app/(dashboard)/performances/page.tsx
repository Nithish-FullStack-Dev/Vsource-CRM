"use client";

import {
  Fragment,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRightLeft,
  ArrowUp,
  BarChart3,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  SearchX,
  SearchXIcon,
  TableProperties,
  Target,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { PageHeader, PageTransition } from "@/components/common/PageHeader";
import { ReportFilterSheet } from "@/components/reports/ReportFilterSheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePerformanceReport } from "@/hooks/reports/usePerformanceReport";
import { usePerformanceReportFilters } from "@/hooks/reports/usePerformanceReportFilters";
import {
  calculatePerformanceTotals,
  groupCounselorPerformance,
} from "@/lib/performance-report-calculations";
import {
  formatReportDate,
  humanizeReportStatus,
} from "@/lib/performance-report-utils";
import { exportPerformanceReport } from "@/services/reports/performance-report.service";
import {
  DEFAULT_PERFORMANCE_REPORT_FILTERS,
  type PerformanceReportFilters,
  type PerformanceReportMetricRow,
  type PerformanceReportRow,
} from "@/types/performance-report";

const PAGE_SIZE = 20;
const METRIC_COLUMN_COUNT = 25;

const CHART_COLORS = [
  "oklch(0.58 0.22 27)",
  "oklch(0.62 0.15 240)",
  "oklch(0.65 0.17 155)",
  "oklch(0.78 0.16 75)",
  "oklch(0.55 0.2 305)",
  "oklch(0.68 0.16 35)",
  "oklch(0.58 0.14 195)",
];

const COL_WIDTHS = {
  branch: 40,
  sno: 50,
  user: 220,
} as const;
const LEFT_BRANCH = 0;
const LEFT_SNO = COL_WIDTHS.branch;
const LEFT_USER = COL_WIDTHS.branch + COL_WIDTHS.sno;

const numberFormatter = new Intl.NumberFormat("en-IN");

const percentageFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

type SummaryCardProps = {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
};

type ReportAccordionProps = {
  value: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
};

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatPercentage(value: number): string {
  return `${percentageFormatter.format(value)}%`;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-bold tracking-tight">
            {value}
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>

        <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

function SummarySkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-3 w-36" />
      </CardContent>
    </Card>
  );
}

function ReportAccordion({
  value,
  title,
  description,
  icon: Icon,
  children,
  defaultOpen,
}: ReportAccordionProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? value : undefined}
      className="mb-4"
    >
      <AccordionItem
        value={value}
        className="overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        <AccordionTrigger className="px-4 py-4 text-left hover:no-underline sm:px-6">
          <div className="flex min-w-0 items-start gap-3">
            <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
              <Icon className="size-5" />
            </div>

            <div className="min-w-0">
              <p className="font-semibold">{title}</p>

              <p className="mt-1 text-xs font-normal leading-5 text-muted-foreground">
                {description}
              </p>
            </div>
          </div>
        </AccordionTrigger>

        <AccordionContent className="px-4 pb-4 sm:px-6 sm:pb-6">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
      No matching report data
    </div>
  );
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(url);
}

function getRecordBadge(row: PerformanceReportRow) {
  if (row.recordType === "lead") {
    return (
      <Badge
        variant="outline"
        className="border-amber-300 bg-amber-50 text-amber-700"
      >
        Walk-in
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-emerald-300 bg-emerald-50 text-emerald-700"
    >
      {row.applicationTiming === "same_day"
        ? "Same Day App"
        : "Old Walk-in App"}
    </Badge>
  );
}

function getLifecycleBadgeClass(status: string) {
  const normalized = status.toLowerCase();

  if (
    ["converted", "admitted", "enrolled", "completed"].includes(
      normalized,
    )
  ) {
    return "border-success/20 bg-success/15 text-success";
  }

  if (
    [
      "qualified",
      "visa_process",
      "loan_process",
      "active",
    ].includes(normalized)
  ) {
    return "border-primary/20 bg-primary/10 text-primary";
  }

  if (
    [
      "lost",
      "drop",
      "dropped",
      "hold",
      "dif",
      "inactive",
      "rejected",
    ].includes(normalized)
  ) {
    return "border-destructive/20 bg-destructive/10 text-destructive";
  }

  if (
    ["contacted", "draft", "follow_up", "followup"].includes(
      normalized,
    )
  ) {
    return "border-warning/20 bg-warning/15 text-warning";
  }

  return "border-border bg-muted text-muted-foreground";
}

function MetricHeaderCells() {
  return (
    <>
      <th className="px-3 py-3 text-right font-medium">Walk-ins</th>
      <th className="px-3 py-3 text-right font-medium">Reference</th>
      <th className="px-3 py-3 text-right font-medium">Active Walk-ins</th>
      <th className="px-3 py-3 text-right font-medium">Drops / Hold / DIF</th>
      <th className="px-3 py-3 text-right font-medium">Applications</th>
      <th className="px-3 py-3 text-right font-medium">Same Day Apps</th>
      <th className="px-3 py-3 text-right font-medium">Old Walk-in Apps</th>
      <th className="px-3 py-3 text-right font-medium">Lead → Student %</th>
      <th className="px-3 py-3 text-right font-medium">University Applied</th>
      <th className="px-3 py-3 text-right font-medium">Student → Uni Apply %</th>
      <th className="px-3 py-3 text-right font-medium">Offers</th>
      <th className="px-3 py-3 text-right font-medium">Loan Applications</th>
      <th className="px-3 py-3 text-right font-medium">OS-LOAN / O-FUND</th>
      <th className="px-3 py-3 text-right font-medium">Loan Approved</th>
      <th className="px-3 py-3 text-right font-medium">Loan Approval %</th>
      <th className="px-3 py-3 text-right font-medium">Loan Disbursed</th>
      <th className="px-3 py-3 text-right font-medium">CAS Applied</th>
      <th className="px-3 py-3 text-right font-medium">CAS Received</th>
      <th className="px-3 py-3 text-right font-medium">Visa Applied</th>
      <th className="px-3 py-3 text-right font-medium">Visa Approved</th>
      <th className="px-3 py-3 text-right font-medium">Student → Visa Approved %</th>
      <th className="px-3 py-3 text-right font-medium">Target</th>
      <th className="px-3 py-3 text-right font-medium">Target Achieved</th>
      <th className="px-3 py-3 text-right font-medium">Target Achieved %</th>
      <th className="px-3 py-3 text-right font-medium">Pending Target</th>
    </>
  );
}

function MetricCells({
  row,
}: {
  row: PerformanceReportMetricRow;
}) {
  const pendingTarget = Math.max(row.target - row.achieved, 0);

  return (
    <>
      <td className="px-3 py-3 text-right font-semibold">{formatNumber(row.walkIns)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.references)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.activeWalkIns)}</td>
      <td className="px-3 py-3 text-right text-destructive">{formatNumber(row.dropHoldDif)}</td>
      <td className="px-3 py-3 text-right font-semibold">{formatNumber(row.applications)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.sameDayApplications)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.oldWalkInApplications)}</td>
      <td className="px-3 py-3 text-right font-semibold text-primary">{formatPercentage(row.leadToStudentConversionPercentage)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.universityApplications)}</td>
      <td className="px-3 py-3 text-right font-semibold text-primary">{formatPercentage(row.universityApplicationConversionPercentage)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.offers)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.loanApplications)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.outsideLoan)}</td>
      <td className="px-3 py-3 text-right font-semibold">{formatNumber(row.loanApproved)}</td>
      <td className="px-3 py-3 text-right font-semibold text-primary">{formatPercentage(row.loanConversionPercentage)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.loanDisbursed)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.casApplied)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.casReceived)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.visaApplied)}</td>
      <td className="px-3 py-3 text-right font-semibold">{formatNumber(row.visaApproved)}</td>
      <td className="px-3 py-3 text-right font-semibold text-primary">{formatPercentage(row.visaConversionPercentage)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(row.target)}</td>
      <td className="px-3 py-3 text-right font-semibold">{formatNumber(row.achieved)}</td>
      <td className="px-3 py-3 text-right font-semibold text-primary">{formatPercentage(row.targetCompletionPercentage)}</td>
      <td className="px-3 py-3 text-right">{formatNumber(pendingTarget)}</td>
    </>
  );
}

// New dedicated components for the Counsellor Excel UI 
function CounsellorMetricHeaderCells() {
  const headers = [
    "Walk-ins", "Reference", "Active Walk-ins", "Drops / Hold / DIF",
    "Applications", "Same Day Apps", "Old Walk-in Apps", "Lead → Student %",
    "University Applied", "Student → Uni Apply %", "Offers", "Loan Applications",
    "OS-LOAN / O-FUND", "Loan Approved", "Loan Approval %", "Loan Disbursed",
    "CAS Applied", "CAS Received", "Visa Applied", "Visa Approved",
    "Student → Visa Approved %", "Target", "Target Achieved", "Target Achieved %", "Pending Target"
  ];
  return (
    <>
      {headers.map((label) => (
        <th key={label} className="bg-muted border-b border-border/60 px-3 py-2 font-semibold text-center min-w-[90px]">
          {label}
        </th>
      ))}
    </>
  );
}

function CounsellorMetricCells({ row, isTotal = false, isGrandTotal = false }: { row: PerformanceReportMetricRow, isTotal?: boolean, isGrandTotal?: boolean }) {
  const pendingTarget = Math.max(row.target - row.achieved, 0);
  const cellClass = isGrandTotal
    ? "bg-card border-b border-border/60 px-3 py-2 text-center font-bold text-red-600 dark:text-red-400 tabular-nums"
    : isTotal
    ? "border-b border-border/50 px-2 py-2 text-center text-foreground tabular-nums"
    : "border-b border-border/40 px-2 py-2 text-center text-muted-foreground group-hover:text-foreground tabular-nums";

  return (
    <>
      <td className={cellClass}>{formatNumber(row.walkIns)}</td>
      <td className={cellClass}>{formatNumber(row.references)}</td>
      <td className={cellClass}>{formatNumber(row.activeWalkIns)}</td>
      <td className={cellClass}>{formatNumber(row.dropHoldDif)}</td>
      <td className={cellClass}>{formatNumber(row.applications)}</td>
      <td className={cellClass}>{formatNumber(row.sameDayApplications)}</td>
      <td className={cellClass}>{formatNumber(row.oldWalkInApplications)}</td>
      <td className={cellClass}>{formatPercentage(row.leadToStudentConversionPercentage)}</td>
      <td className={cellClass}>{formatNumber(row.universityApplications)}</td>
      <td className={cellClass}>{formatPercentage(row.universityApplicationConversionPercentage)}</td>
      <td className={cellClass}>{formatNumber(row.offers)}</td>
      <td className={cellClass}>{formatNumber(row.loanApplications)}</td>
      <td className={cellClass}>{formatNumber(row.outsideLoan)}</td>
      <td className={cellClass}>{formatNumber(row.loanApproved)}</td>
      <td className={cellClass}>{formatPercentage(row.loanConversionPercentage)}</td>
      <td className={cellClass}>{formatNumber(row.loanDisbursed)}</td>
      <td className={cellClass}>{formatNumber(row.casApplied)}</td>
      <td className={cellClass}>{formatNumber(row.casReceived)}</td>
      <td className={cellClass}>{formatNumber(row.visaApplied)}</td>
      <td className={cellClass}>{formatNumber(row.visaApproved)}</td>
      <td className={cellClass}>{formatPercentage(row.visaConversionPercentage)}</td>
      <td className={cellClass}>{formatNumber(row.target)}</td>
      <td className={cellClass}>{formatNumber(row.achieved)}</td>
      <td className={cellClass}>{formatPercentage(row.targetCompletionPercentage)}</td>
      <td className={cellClass}>{formatNumber(pendingTarget)}</td>
    </>
  );
}

function SimpleBreakdownTable({
  title,
  label,
  rows,
}: {
  title: string;
  label: string;
  rows: Array<{
    label: string;
    count: number;
  }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-y bg-secondary/30 text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium">
                  {label}
                </th>

                <th className="px-4 py-3 text-right font-medium">
                  Count
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length ? (
                rows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-b last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {row.label}
                    </td>

                    <td className="px-4 py-3 text-right font-semibold">
                      {formatNumber(row.count)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    No data found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PerformanceReportsPage() {
  const [filters, setFilters] =
    useState<PerformanceReportFilters>({
      ...DEFAULT_PERFORMANCE_REPORT_FILTERS,
    });

  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [showScrollToTop, setShowScrollToTop] =
    useState(false);

  const reportQuery = usePerformanceReport(
    filters,
    page,
    PAGE_SIZE,
  );

  const filterOptionsQuery = usePerformanceReportFilters();

  const report = reportQuery.data;

  const branchRows = useMemo(
    () => report?.branchPerformance ?? [],
    [report?.branchPerformance],
  );

  const branchTotals = useMemo(
    () => calculatePerformanceTotals(branchRows),
    [branchRows],
  );

  const counselorGroups = useMemo(
    () =>
      groupCounselorPerformance(
        report?.counselorPerformance ?? [],
      ),
    [report?.counselorPerformance],
  );

  const counselorTotals = useMemo(
    () =>
      calculatePerformanceTotals(
        report?.counselorPerformance ?? [],
      ),
    [report?.counselorPerformance],
  );

  const topCountryData = useMemo(
    () => report?.countryDemand.slice(0, 8) ?? [],
    [report?.countryDemand],
  );

  const leadSourceData = useMemo(
    () => report?.leadSourceBreakdown.slice(0, 7) ?? [],
    [report?.leadSourceBreakdown],
  );

  const leadStatusData = useMemo(
    () => report?.leadStatusBreakdown.slice(0, 7) ?? [],
    [report?.leadStatusBreakdown],
  );

  const applicationStatusData = useMemo(
    () =>
      report?.applicationStatusBreakdown.slice(0, 7) ?? [],
    [report?.applicationStatusBreakdown],
  );

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 500);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleApplyFilters = (
    nextFilters: PerformanceReportFilters,
  ) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);

      const blob = await exportPerformanceReport(filters);
      const date = new Date().toISOString().slice(0, 10);

      downloadBlob(
        blob,
        `vsource-performance-report-${date}.xlsx`,
      );

      toast.success(
        "Excel report downloaded successfully",
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to download Excel report",
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PageTransition>
      <PageHeader
        title="Performance Reports"
        description="Role-secured walk-in, application, university, loan, CAS, visa and target performance analytics."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => reportQuery.refetch()}
              disabled={reportQuery.isFetching}
            >
              <RefreshCw
                className={`mr-1.5 size-4 ${
                  reportQuery.isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />

              Refresh
            </Button>

            <Button
              size="sm"
              onClick={handleExport}
              disabled={
                isExporting ||
                reportQuery.isLoading ||
                !report ||
                report.pagination.total === 0
              }
            >
              {isExporting ? (
                <Loader2 className="mr-1.5 size-4 animate-spin" />
              ) : (
                <Download className="mr-1.5 size-4" />
              )}

              Export Excel
            </Button>
          </div>
        }
      />

      <ReportFilterSheet
        value={filters}
        options={filterOptionsQuery.data}
        isLoading={filterOptionsQuery.isLoading}
        onApply={handleApplyFilters}
      />

      {reportQuery.isError && (
        <Card className="mb-4 border-destructive/40">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-destructive">
                Unable to load performance report
              </p>

              <p className="text-sm text-muted-foreground">
                {reportQuery.error instanceof Error
                  ? reportQuery.error.message
                  : "Please retry the request."}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => reportQuery.refetch()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <ReportAccordion
        value="report-summary"
        title="Performance Summary"
        description="Operational totals and conversion percentages for the selected filters."
        icon={LayoutDashboard}
        defaultOpen
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
          {reportQuery.isLoading || !report ? (
            Array.from({
              length: 18,
            }).map((_, index) => (
              <SummarySkeleton key={index} />
            ))
          ) : (
            <>
              <SummaryCard
                title="Walk-ins"
                value={formatNumber(report.summary.walkIns)}
                description="Lead records created in the selected period"
                icon={BriefcaseBusiness}
              />

              <SummaryCard
                title="Reference"
                value={formatNumber(
                  report.summary.references,
                )}
                description="All lead sources except Walk-in"
                icon={UserCheck}
              />

              <SummaryCard
                title="Active Walk-ins"
                value={formatNumber(
                  report.summary.activeWalkIns,
                )}
                description="Open and active walk-in records"
                icon={Users}
              />

              <SummaryCard
                title="Drops / Hold / DIF"
                value={formatNumber(
                  report.summary.dropHoldDif,
                )}
                description="Lost, inactive, dropped, hold and DIF records"
                icon={ArrowRightLeft}
              />

              <SummaryCard
                title="Applications"
                value={formatNumber(
                  report.summary.applications,
                )}
                description="Walk-ins converted to students"
                icon={GraduationCap}
              />

              <SummaryCard
                title="Same Day Apps"
                value={formatNumber(
                  report.summary.sameDayApplications,
                )}
                description="Converted on the same IST calendar date"
                icon={CalendarClock}
              />

              <SummaryCard
                title="Old Walk-in Apps"
                value={formatNumber(
                  report.summary.oldWalkInApplications,
                )}
                description="Converted after the walk-in creation date"
                icon={CalendarClock}
              />

              <SummaryCard
                title="Lead → Student Conversion"
                value={formatPercentage(
                  report.summary
                    .leadToStudentConversionPercentage,
                )}
                description={`${formatNumber(
                  report.summary.applications,
                )} applications from ${formatNumber(
                  report.summary.walkIns,
                )} walk-ins`}
                icon={ArrowRightLeft}
              />

              <SummaryCard
                title="University Applied"
                value={formatNumber(
                  report.summary.universityApplications,
                )}
                description="University application records submitted"
                icon={FileCheck2}
              />

              <SummaryCard
                title="Student → University Apply"
                value={formatPercentage(
                  report.summary
                    .universityApplicationConversionPercentage,
                )}
                description="University applications as a percentage of students"
                icon={FileText}
              />

              <SummaryCard
                title="Loan Applications"
                value={formatNumber(
                  report.summary.loanApplications,
                )}
                description="Loan form submitted or loan requirement marked Yes"
                icon={Landmark}
              />

              <SummaryCard
                title="OS-LOAN / O-FUND"
                value={formatNumber(
                  report.summary.outsideLoan,
                )}
                description="Loan requirement marked No in the lead form"
                icon={Landmark}
              />

              <SummaryCard
                title="Loan Approved"
                value={formatNumber(
                  report.summary.loanApproved,
                )}
                description={`${formatPercentage(
                  report.summary.loanConversionPercentage,
                )} of loan applications`}
                icon={CheckCircle2}
              />

              <SummaryCard
                title="Loan Disbursed"
                value={formatNumber(
                  report.summary.loanDisbursed,
                )}
                description="Fully or partially disbursed loan records"
                icon={Landmark}
              />

              <SummaryCard
                title="CAS Received"
                value={formatNumber(
                  report.summary.casReceived,
                )}
                description={`${formatNumber(
                  report.summary.casApplied,
                )} CAS applications`}
                icon={FileCheck2}
              />

              <SummaryCard
                title="Visa Approved"
                value={formatNumber(
                  report.summary.visaApproved,
                )}
                description={`${formatNumber(
                  report.summary.visaApplied,
                )} visa applications`}
                icon={CheckCircle2}
              />

              <SummaryCard
                title="Student → Visa Approved"
                value={formatPercentage(
                  report.summary.visaConversionPercentage,
                )}
                description={`${formatNumber(
                  report.summary.visaApproved,
                )} approvals from ${formatNumber(
                  report.summary.applications,
                )} students`}
                icon={GraduationCap}
              />

              <SummaryCard
                title="Target Achieved"
                value={formatNumber(
                  report.summary.achieved,
                )}
                description={`${formatPercentage(
                  report.summary
                    .targetCompletionPercentage,
                )} of ${formatNumber(
                  report.summary.target,
                )} target`}
                icon={Target}
              />
            </>
          )}
        </div>
      </ReportAccordion>

      <ReportAccordion
        value="branch-performance"
        title="Branch-wise Performance"
        description="All operational columns, conversion percentages and target achievement by branch."
        icon={TableProperties}
      >
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[3900px] text-sm">
                <thead>
                  <tr className="border-b bg-secondary/30 text-xs text-muted-foreground">
                    <th className="sticky left-0 z-20 min-w-[220px] bg-secondary/95 px-4 py-3 text-left font-medium backdrop-blur">
                      Branch
                    </th>

                    <MetricHeaderCells />
                  </tr>
                </thead>

                <tbody>
                  {reportQuery.isLoading ? (
                    Array.from({
                      length: 5,
                    }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td
                          colSpan={
                            METRIC_COLUMN_COUNT + 1
                          }
                          className="px-4 py-3"
                        >
                          <Skeleton className="h-8 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : branchRows.length ? (
                    <>
                      {branchRows.map((branch) => (
                        <tr
                          key={branch.branchId}
                          className="border-b hover:bg-secondary/20"
                        >
                          <td className="sticky left-0 z-10 min-w-[220px] bg-card px-4 py-3 font-medium">
                            {branch.branch}
                          </td>

                          <MetricCells row={branch} />
                        </tr>
                      ))}

                      <tr className="border-t-2 bg-muted/60 font-semibold">
                        <td className="sticky left-0 z-10 min-w-[220px] bg-muted px-4 py-3">
                          Grand Total
                        </td>

                        <MetricCells row={branchTotals} />
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          METRIC_COLUMN_COUNT + 1
                        }
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        No branch performance data
                        found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </ReportAccordion>

      <ReportAccordion
        value="counselor-performance"
        title="Counsellor-wise Performance"
        description="All users grouped by branch, with branch subtotals and a final grand total."
        icon={Users}
      >
        <div className="w-full overflow-x-auto bg-card [scrollbar-gutter:stable] rounded-lg border border-border/60 shadow-sm transition-all mb-4">
          <table className="w-full border-collapse text-[11px] whitespace-nowrap table-auto">
            <thead className="sticky top-0 z-30 shadow-sm">
              {/* Row 1: Red Super Header */}
              <tr className="bg-red-600 text-white">
                <th
                  colSpan={3}
                  style={{ left: LEFT_BRANCH, position: "sticky", zIndex: 40 }}
                  className="bg-red-600 border-b border-r border-red-700 px-3 py-2 text-left font-bold uppercase tracking-wider shadow-[4px_0_12px_-8px_rgba(0,0,0,0.15)]"
                >
                  REPORT
                </th>
                <th
                  colSpan={METRIC_COLUMN_COUNT}
                  className="bg-red-600 border-b border-red-700 px-3 py-2 text-center font-bold uppercase tracking-widest"
                >
                  COUNSELLOR PERFORMANCE
                </th>
              </tr>

              {/* Row 2: Grand Total */}
              <tr className="bg-card text-foreground">
                <th
                  colSpan={3}
                  style={{ left: LEFT_BRANCH, position: "sticky", zIndex: 40 }}
                  className="bg-card border-b border-r border-border/60 px-3 py-2 text-center font-bold uppercase shadow-[4px_0_12px_-8px_rgba(0,0,0,0.1)]"
                >
                  GRAND TOTAL
                </th>
                <CounsellorMetricCells row={counselorTotals} isGrandTotal={true} />
              </tr>

              {/* Row 3: Column Headers */}
              <tr className="bg-muted text-foreground">
                <th
                  style={{ left: LEFT_BRANCH, width: COL_WIDTHS.branch, minWidth: COL_WIDTHS.branch, position: "sticky", zIndex: 40 }}
                  className="bg-muted border-b border-border/60 px-1 py-2 font-semibold"
                ></th>
                <th
                  style={{ left: LEFT_SNO, width: COL_WIDTHS.sno, minWidth: COL_WIDTHS.sno, position: "sticky", zIndex: 40 }}
                  className="bg-muted border-b border-border/60 px-2 py-2 font-semibold text-center"
                >
                  S.NO
                </th>
                <th
                  style={{ left: LEFT_USER, width: COL_WIDTHS.user, minWidth: COL_WIDTHS.user, position: "sticky", zIndex: 40 }}
                  className="bg-muted border-b border-r border-border/60 px-3 py-2 font-semibold text-left shadow-[4px_0_12px_-8px_rgba(0,0,0,0.1)]"
                >
                  EMPLOYEE NAME
                </th>
                <CounsellorMetricHeaderCells />
              </tr>
            </thead>

            <tbody>
              {reportQuery.isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index} className="border-b">
                    <td colSpan={METRIC_COLUMN_COUNT + 3} className="px-4 py-3">
                      <Skeleton className="h-9 w-full" />
                    </td>
                  </tr>
                ))
              ) : counselorGroups.length ? (
                counselorGroups.map((group) => {
                  const rowSpanCount = group.rows.length + 1; // +1 for the total row

                  return (
                    <Fragment key={group.branchId}>
                      {group.rows.map((row, index) => (
                        <tr
                          key={`${row.branchId}-${row.counselorId}`}
                          className="bg-card hover:bg-muted/50 transition-colors group"
                        >
                          {/* Rotated Branch Name Column */}
                          {index === 0 && (
                            <td
                              rowSpan={rowSpanCount}
                              style={{ left: LEFT_BRANCH, width: COL_WIDTHS.branch, minWidth: COL_WIDTHS.branch, position: "sticky", zIndex: 20 }}
                              className="bg-muted/30 border-b border-r border-border/50 p-1 align-middle text-center"
                            >
                              <div
                                style={{
                                  writingMode: "vertical-rl",
                                  transform: "rotate(180deg)",
                                }}
                                className="mx-auto font-bold text-muted-foreground tracking-widest uppercase text-[10px]"
                              >
                                {group.branch}
                              </div>
                            </td>
                          )}

                          <td
                            style={{ left: LEFT_SNO, width: COL_WIDTHS.sno, minWidth: COL_WIDTHS.sno, position: "sticky", zIndex: 20 }}
                            className="bg-card border-b border-border/40 px-2 py-2 text-center text-muted-foreground font-medium group-hover:bg-muted/50"
                          >
                            {index + 1}
                          </td>

                          <td
                            style={{ left: LEFT_USER, width: COL_WIDTHS.user, minWidth: COL_WIDTHS.user, position: "sticky", zIndex: 20 }}
                            className="bg-card border-b border-r border-border/40 px-3 py-2 text-left text-foreground font-semibold shadow-[4px_0_12px_-8px_rgba(0,0,0,0.1)] group-hover:bg-muted/50"
                          >
                            {row.counselor}
                          </td>

                          <CounsellorMetricCells row={row} />
                        </tr>
                      ))}

                      {/* Branch Total Row */}
                      <tr className="bg-muted/60 font-semibold">
                        {group.rows.length === 0 && (
                          <td
                            style={{ left: LEFT_BRANCH, width: COL_WIDTHS.branch, minWidth: COL_WIDTHS.branch, position: "sticky", zIndex: 20 }}
                            className="bg-muted border-b border-r border-border/50 p-1 align-middle text-center"
                          >
                            <div
                              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                              className="mx-auto font-bold text-muted-foreground tracking-widest uppercase text-[10px]"
                            >
                              {group.branch}
                            </div>
                          </td>
                        )}
                        <td
                          style={{ left: LEFT_SNO, width: COL_WIDTHS.sno, minWidth: COL_WIDTHS.sno, position: "sticky", zIndex: 20 }}
                          className="bg-muted border-b border-border/50 px-2 py-2"
                        ></td>
                        <td
                          style={{ left: LEFT_USER, width: COL_WIDTHS.user, minWidth: COL_WIDTHS.user, position: "sticky", zIndex: 20 }}
                          className="bg-muted border-b border-r border-border/50 px-3 py-2 text-center text-foreground uppercase tracking-wide shadow-[4px_0_12px_-8px_rgba(0,0,0,0.1)]"
                        >
                          TOTAL
                        </td>
                        <CounsellorMetricCells row={group.totals} isTotal={true} />
                      </tr>
                    </Fragment>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={METRIC_COLUMN_COUNT + 3}
                    className="px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                      <SearchXIcon className="size-8 opacity-40" />
                      <p className="text-sm">No counsellor performance data found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ReportAccordion>

      <ReportAccordion
        value="operational-breakdown"
        title="Operational Number Breakdown"
        description="Lifecycle, university application, visa and loan status distributions."
        icon={BarChart3}
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SimpleBreakdownTable
            title="Walk-in Lifecycle"
            label="Status"
            rows={(
              report?.leadStatusBreakdown ?? []
            ).map((row) => ({
              label: row.status,
              count: row.count,
            }))}
          />

          <SimpleBreakdownTable
            title="University Application Status"
            label="Status"
            rows={(
              report?.applicationStatusBreakdown ?? []
            ).map((row) => ({
              label: row.status,
              count: row.count,
            }))}
          />

          <SimpleBreakdownTable
            title="Visa Status"
            label="Status"
            rows={(
              report?.visaStatusBreakdown ?? []
            ).map((row) => ({
              label: row.status,
              count: row.count,
            }))}
          />

          <SimpleBreakdownTable
            title="Loan Status"
            label="Status"
            rows={(
              report?.loanStatusBreakdown ?? []
            ).map((row) => ({
              label: row.status,
              count: row.count,
            }))}
          />
        </div>
      </ReportAccordion>

      <ReportAccordion
        value="pipeline-records"
        title="Walk-in and Application Records"
        description="Converted walk-ins appear as applications, preventing duplicate pipeline records."
        icon={FileText}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="text-base">
              Detailed Records
            </CardTitle>

            <Badge variant="secondary">
              {formatNumber(
                report?.pagination.total ?? 0,
              )}{" "}
              records
            </Badge>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1900px] text-sm">
                <thead>
                  <tr className="border-b bg-secondary/30 text-xs text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">
                      Type
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Walk-in No.
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Person
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Contact
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Branch / Owner
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Source / Reference
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Destination
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      University Application
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      CAS / Visa
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Loan Decision
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Dates
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {reportQuery.isLoading ? (
                    Array.from({
                      length: 8,
                    }).map((_, index) => (
                      <tr key={index} className="border-b">
                        <td
                          colSpan={12}
                          className="px-4 py-3"
                        >
                          <Skeleton className="h-10 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : report?.rows.length ? (
                    report.rows.map((row) => (
                      <tr
                        key={`${row.recordType}-${row.recordId}`}
                        className="border-b align-top last:border-0 hover:bg-secondary/20"
                      >
                        <td className="px-4 py-3">
                          {getRecordBadge(row)}
                        </td>

                        <td className="px-4 py-3 font-mono text-xs font-semibold">
                          {row.leadNumber || "—"}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {row.studentName ||
                              "Not Set"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {row.courseName ||
                              "Course not set"}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p>
                            {row.mobileNumber || "—"}
                          </p>

                          <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground">
                            {row.emailId || "—"}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p>
                            {row.branchName ||
                              "Not Set"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {row.counselorName ||
                              "Unassigned"}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <p>
                            {row.source || "Not Set"}
                          </p>

                          {row.isReference && (
                            <Badge
                              variant="secondary"
                              className="mt-1"
                            >
                              Reference
                            </Badge>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <p>
                            {row.countryName ||
                              "Not Set"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {row.intakeName ||
                              "Intake not set"}
                          </p>
                        </td>

                        <td className="px-4 py-3">
                          <Badge
                            variant="outline"
                            className={getLifecycleBadgeClass(
                              row.lifecycleStatus,
                            )}
                          >
                            {humanizeReportStatus(
                              row.lifecycleStatus,
                            )}
                          </Badge>

                          {row.currentStage &&
                            row.currentStage !==
                              "lead" && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                {humanizeReportStatus(
                                  row.currentStage,
                                )}
                              </p>
                            )}
                        </td>

                        <td className="px-4 py-3">
                          {row.recordType ===
                          "student" ? (
                            <>
                              <p className="max-w-[230px] truncate font-medium">
                                {row.latestUniversityName ||
                                  "Not applied"}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                {formatNumber(
                                  row.applicationsCount,
                                )}{" "}
                                application
                                {row.applicationsCount ===
                                1
                                  ? ""
                                  : "s"}

                                {row.latestApplicationStatus
                                  ? ` · ${humanizeReportStatus(
                                      row.latestApplicationStatus,
                                    )}`
                                  : ""}
                              </p>
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              Not converted
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {row.recordType ===
                          "student" ? (
                            <>
                              <p>
                                CAS:{" "}
                                {humanizeReportStatus(
                                  row.casStatus,
                                )}
                              </p>

                              <p className="mt-1 text-xs text-muted-foreground">
                                Visa:{" "}
                                {humanizeReportStatus(
                                  row.visaStatus,
                                )}
                              </p>
                            </>
                          ) : (
                            <span className="text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <p className="font-medium">
                            {row.loanApplication
                              ? "Loan Application"
                              : row.outsideLoan
                                ? "OS-LOAN / O-FUND"
                                : "Not Set"}
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            {humanizeReportStatus(
                              row.loanStatus,
                            )}

                            {row.loanApproved
                              ? " · Approved"
                              : ""}

                            {row.loanDisbursed
                              ? " · Disbursed"
                              : ""}
                          </p>

                          {row.nbfc && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {row.nbfc}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <p>
                            Created:{" "}
                            {formatReportDate(
                              row.createdAt,
                            )}
                          </p>

                          {row.convertedAt && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Converted:{" "}
                              {formatReportDate(
                                row.convertedAt,
                              )}
                            </p>
                          )}

                          {row.nextFollowup && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              Follow-up:{" "}
                              {formatReportDate(
                                row.nextFollowup,
                              )}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        No walk-in or application records
                        match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing{" "}
            {formatNumber(
              report?.rows.length ?? 0,
            )}{" "}
            of{" "}
            {formatNumber(
              report?.pagination.total ?? 0,
            )}{" "}
            records
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={
                !report ||
                report.pagination.page <= 1
              }
              onClick={() =>
                setPage((current) =>
                  Math.max(1, current - 1),
                )
              }
            >
              Previous
            </Button>

            <span className="rounded-md bg-secondary/40 px-3 py-1.5 text-xs font-medium text-foreground">
              Page {report?.pagination.page ?? 1}{" "}
              of{" "}
              {report?.pagination.totalPages ?? 1}
            </span>

            <Button
              variant="outline"
              size="sm"
              disabled={
                !report ||
                report.pagination.page >=
                  report.pagination.totalPages
              }
              onClick={() =>
                setPage((current) =>
                  Math.min(
                    report?.pagination
                      .totalPages ?? current,
                    current + 1,
                  ),
                )
              }
            >
              Next
            </Button>
          </div>
        </div>
      </ReportAccordion>

      <ReportAccordion
        value="analytics-charts"
        title="Analytics Charts"
        description="Monthly funnel, destination demand, source mix and lifecycle status analytics."
        icon={BarChart3}
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Monthly Funnel
              </CardTitle>
            </CardHeader>

            <CardContent>
              {reportQuery.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : report?.monthlyVolume.length ? (
                <div className="h-72">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={report.monthlyVolume}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -15,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--color-muted-foreground)"
                      />

                      <YAxis
                        allowDecimals={false}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--color-muted-foreground)"
                      />

                      <Tooltip
                        contentStyle={{
                          background:
                            "var(--color-card)",
                          border:
                            "1px solid var(--color-border)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          fontSize: 11,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="walkIns"
                        name="Walk-ins"
                        stroke={CHART_COLORS[0]}
                        strokeWidth={2.5}
                        dot={{
                          r: 3,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="applications"
                        name="Applications"
                        stroke={CHART_COLORS[2]}
                        strokeWidth={2.5}
                        dot={{
                          r: 3,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="universityApplications"
                        name="University Applied"
                        stroke={CHART_COLORS[1]}
                        strokeWidth={2.5}
                        dot={{
                          r: 3,
                        }}
                      />

                      <Line
                        type="monotone"
                        dataKey="visaApproved"
                        name="Visa Approved"
                        stroke={CHART_COLORS[4]}
                        strokeWidth={2.5}
                        dot={{
                          r: 3,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Country Demand
              </CardTitle>
            </CardHeader>

            <CardContent>
              {reportQuery.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : topCountryData.length ? (
                <div className="h-72">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={topCountryData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -15,
                        bottom: 20,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="country"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--color-muted-foreground)"
                        angle={-20}
                        textAnchor="end"
                        height={55}
                      />

                      <YAxis
                        allowDecimals={false}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        stroke="var(--color-muted-foreground)"
                      />

                      <Tooltip
                        contentStyle={{
                          background:
                            "var(--color-card)",
                          border:
                            "1px solid var(--color-border)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          fontSize: 11,
                        }}
                      />

                      <Bar
                        dataKey="walkIns"
                        name="Walk-ins"
                        fill={CHART_COLORS[0]}
                        radius={[5, 5, 0, 0]}
                      />

                      <Bar
                        dataKey="applications"
                        name="Applications"
                        fill={CHART_COLORS[2]}
                        radius={[5, 5, 0, 0]}
                      />

                      <Bar
                        dataKey="universityApplications"
                        name="University Applied"
                        fill={CHART_COLORS[1]}
                        radius={[5, 5, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Walk-in Source Mix
              </CardTitle>
            </CardHeader>

            <CardContent>
              {reportQuery.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : leadSourceData.length ? (
                <div className="h-72">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={leadSourceData}
                        dataKey="total"
                        nameKey="source"
                        innerRadius={52}
                        outerRadius={88}
                        paddingAngle={2}
                      >
                        {leadSourceData.map(
                          (item, index) => (
                            <Cell
                              key={`${item.source}-${index}`}
                              fill={
                                CHART_COLORS[
                                  index %
                                    CHART_COLORS.length
                                ]
                              }
                            />
                          ),
                        )}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background:
                            "var(--color-card)",
                          border:
                            "1px solid var(--color-border)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          fontSize: 11,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Walk-in Lifecycle Status
              </CardTitle>
            </CardHeader>

            <CardContent>
              {reportQuery.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : leadStatusData.length ? (
                <div className="h-72">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={leadStatusData}
                      layout="vertical"
                      margin={{
                        top: 5,
                        right: 20,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                        horizontal={false}
                      />

                      <XAxis
                        type="number"
                        allowDecimals={false}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        type="category"
                        dataKey="status"
                        width={105}
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        contentStyle={{
                          background:
                            "var(--color-card)",
                          border:
                            "1px solid var(--color-border)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />

                      <Bar
                        dataKey="count"
                        name="Records"
                        fill={CHART_COLORS[0]}
                        radius={[0, 6, 6, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </CardContent>
          </Card>

          <Card className="xl:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                University Application Status
              </CardTitle>
            </CardHeader>

            <CardContent>
              {reportQuery.isLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : applicationStatusData.length ? (
                <div className="h-72">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <PieChart>
                      <Pie
                        data={applicationStatusData}
                        dataKey="count"
                        nameKey="status"
                        outerRadius={90}
                        paddingAngle={2}
                      >
                        {applicationStatusData.map(
                          (item, index) => (
                            <Cell
                              key={`${item.status}-${index}`}
                              fill={
                                CHART_COLORS[
                                  index %
                                    CHART_COLORS.length
                                ]
                              }
                            />
                          ),
                        )}
                      </Pie>

                      <Tooltip
                        contentStyle={{
                          background:
                            "var(--color-card)",
                          border:
                            "1px solid var(--color-border)",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />

                      <Legend
                        wrapperStyle={{
                          fontSize: 11,
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <ChartEmptyState />
              )}
            </CardContent>
          </Card>
        </div>
      </ReportAccordion>

      {showScrollToTop && (
        <Button
          type="button"
          size="icon"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
          className="fixed bottom-6 right-6 z-[40] rounded-full shadow-lg"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp className="size-5" />
        </Button>
      )}
    </PageTransition>
  );
}