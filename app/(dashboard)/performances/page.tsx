"use client";

import { useMemo, useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarClock,
  Download,
  FileCheck2,
  GraduationCap,
  Landmark,
  Loader2,
  RefreshCw,
  TableProperties,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import { Card, CardContent } from "@/components/ui/card";
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

type SummaryCardProps = {
  title: string;
  value: number | string;
  description: string;
  icon: LucideIcon;
};

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
}: SummaryCardProps) {
  return (
    <Card className="h-full transition-shadow hover:shadow-md">
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:p-5">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-muted-foreground">
            {title}
          </p>
          <p className="mt-1.5 text-xl font-bold tracking-tight sm:text-2xl">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </p>
          <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground sm:leading-5">
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

function Section({
  value,
  title,
  description,
  icon: Icon,
  children,
  defaultOpen = false,
}: {
  value: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
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
          <div className="flex items-start gap-3">
            <div className="shrink-0 rounded-xl bg-primary/10 p-2.5 text-primary">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{title}</p>
              <p className="mt-0.5 text-xs font-normal leading-4 text-muted-foreground sm:leading-5">
                {description}
              </p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 pb-4 sm:px-6 sm:pb-6">
          {children}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function MetricHeaders() {
  return (
    <>
      <th className="whitespace-nowrap px-3 py-3 text-right">Walk-ins</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Reference</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        Active Walk-ins
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        Walk-in Drop / Lost
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Applications</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        Application Drop / Inactive
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Same Day Apps</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        Old Walk-in Apps
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        Walk-in → Visa App %
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        University Applied
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        Visa App → Uni Applied %
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Offers</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        Loan Applications
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        OS-LOAN / O-FUND
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Loan Approved</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        Loan Approval %
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Loan Disbursed</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">CAS Applied</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">CAS Received</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Visa Applied</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Visa Approved</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">
        Visa App → Visa Approved %
      </th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Target</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Achieved</th>
      <th className="whitespace-nowrap px-3 py-3 text-right">Target %</th>
    </>
  );
}

function MetricCells({ row }: { row: PerformanceReportMetricRow }) {
  return (
    <>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">
        {row.walkIns}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.references}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.activeWalkIns}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-destructive">
        {row.walkInDropLost}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">
        {row.applications}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right text-destructive">
        {row.studentDropInactive}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.sameDayApplications}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.oldWalkInApplications}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-primary">
        {row.leadToStudentConversionPercentage}%
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.universityApplications}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-primary">
        {row.universityApplicationConversionPercentage}%
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">{row.offers}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.loanApplications}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.outsideLoan}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">
        {row.loanApproved}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-primary">
        {row.loanConversionPercentage}%
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.loanDisbursed}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.casApplied}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.casReceived}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">
        {row.visaApplied}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">
        {row.visaApproved}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-primary">
        {row.visaConversionPercentage}%
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right">{row.target}</td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold">
        {row.achieved}
      </td>
      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-primary">
        {row.targetCompletionPercentage}%
      </td>
    </>
  );
}

function PipelineBadge({ row }: { row: PerformanceReportRow }) {
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

export default function PerformancePage() {
  const [filters, setFilters] = useState<PerformanceReportFilters>(
    DEFAULT_PERFORMANCE_REPORT_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const filterQuery = usePerformanceReportFilters();
  const reportQuery = usePerformanceReport(filters, page, PAGE_SIZE);
  const report = reportQuery.data;

  const counselorGroups = useMemo(
    () => groupCounselorPerformance(report?.counselorPerformance ?? []),
    [report?.counselorPerformance],
  );
  const branchTotal = useMemo(
    () => calculatePerformanceTotals(report?.branchPerformance ?? []),
    [report?.branchPerformance],
  );

  const applyFilters = (next: PerformanceReportFilters) => {
    setFilters(next);
    setPage(1);
  };

  const exportReport = async () => {
    try {
      setExporting(true);
      const blob = await exportPerformanceReport(filters);
      downloadBlob(
        blob,
        `vsource-performance-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast.success("Performance report exported");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to export report",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-5 pb-8">
        <PageHeader
          title="Performance Report"
          description="Walk-ins, references, converted applications, university applications, loans, CAS, visa and targets using the updated schema."
          actions={
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none"
                onClick={() => reportQuery.refetch()}
                disabled={reportQuery.isFetching}
              >
                <RefreshCw
                  className={`mr-2 size-4 ${reportQuery.isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                className="flex-1 sm:flex-none"
                onClick={exportReport}
                disabled={!report || exporting}
              >
                {exporting ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Download className="mr-2 size-4" />
                )}
                Export Excel
              </Button>
            </div>
          }
        />

        <ReportFilterSheet
          value={filters}
          options={filterQuery.data}
          isLoading={filterQuery.isLoading}
          onApply={applyFilters}
        />

        {reportQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }, (_, index) => (
              <Card key={index}>
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-36" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : reportQuery.isError ? (
          <Card>
            <CardContent className="p-8 text-center text-destructive">
              {reportQuery.error.message}
            </CardContent>
          </Card>
        ) : report ? (
          <>
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
              <SummaryCard
                title="Walk-ins"
                value={report.summary.walkIns}
                description="Walk-in records created in the selected period"
                icon={Users}
              />
              <SummaryCard
                title="Reference"
                value={report.summary.references}
                description="Every walk-in source except Walk-in"
                icon={UserCheck}
              />
              <SummaryCard
                title="Applications"
                value={report.summary.applications}
                description={`${report.summary.leadToStudentConversionPercentage}% walkin-to-Visa App conversion`}
                icon={GraduationCap}
              />
              <SummaryCard
                title="Same Day Apps"
                value={report.summary.sameDayApplications}
                description="Converted on the same IST calendar day"
                icon={CalendarClock}
              />
              <SummaryCard
                title="Old Walk-in Apps"
                value={report.summary.oldWalkInApplications}
                description="Converted on a later IST calendar day"
                icon={CalendarClock}
              />
              <SummaryCard
                title="University Applied"
                value={report.summary.universityApplications}
                description={`${report.summary.universityApplicationConversionPercentage}% of applications`}
                icon={FileCheck2}
              />
              <SummaryCard
                title="Walk-in Drop / Lost"
                value={report.summary.walkInDropLost}
                description="Walk-ins whose status is Drop or Lost"
                icon={Users}
              />
              <SummaryCard
                title="Application Drop / Inactive"
                value={report.summary.studentDropInactive}
                description="Converted Visa App whose status is Drop or Inactive"
                icon={GraduationCap}
              />
              <SummaryCard
                title="Loan Applications"
                value={report.summary.loanApplications}
                description="Loan form submitted or loan requirement marked Yes"
                icon={Landmark}
              />
              <SummaryCard
                title="OS-LOAN / O-FUND"
                value={report.summary.outsideLoan}
                description="Loan requirement marked No in Walk-in form"
                icon={Landmark}
              />
              <SummaryCard
                title="Loan Approved"
                value={report.summary.loanApproved}
                description={`${report.summary.loanConversionPercentage}% of loan applications`}
                icon={Landmark}
              />
              <SummaryCard
                title="Visa Approved"
                value={report.summary.visaApproved}
                description={`${report.summary.visaConversionPercentage}% of converted applications`}
                icon={GraduationCap}
              />
              <SummaryCard
                title="Target Completion"
                value={`${report.summary.targetCompletionPercentage}%`}
                description={`${report.summary.achieved.toLocaleString("en-IN")} achieved of ${report.summary.target.toLocaleString("en-IN")}`}
                icon={BarChart3}
              />
            </div>

            {/* Branch Performance */}
            <Section
              value="branch"
              title="Branch Performance"
              description="Branch-wise business metrics without double counting converted Walk-in events."
              icon={TableProperties}
              defaultOpen
            >
              <div className="relative overflow-x-auto rounded-lg border shadow-sm">
                <table className="w-full min-w-[3300px] border-collapse text-sm">
                  <thead className="bg-muted text-xs">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                        Branch
                      </th>
                      <MetricHeaders />
                    </tr>
                  </thead>
                  <tbody>
                    {report.branchPerformance.map((row) => (
                      <tr
                        key={row.branchId}
                        className="border-t transition-colors hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {row.branch}
                        </td>
                        <MetricCells row={row} />
                      </tr>
                    ))}
                    <tr className="border-t bg-muted/60 font-semibold">
                      <td className="whitespace-nowrap px-4 py-3">
                        Grand Total
                      </td>
                      <MetricCells row={branchTotal} />
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            {/* User Performance */}
            <Section
              value="users"
              title="User Performance"
              description="Walk-in owner, converted-by user and fintech owner attribution are retained."
              icon={Users}
            >
              <div className="space-y-6">
                {counselorGroups.map((group) => (
                  <div
                    key={group.branchId}
                    className="overflow-x-auto rounded-lg border shadow-sm"
                  >
                    <div className="border-b bg-muted/80 px-4 py-3 text-sm font-semibold">
                      {group.branch}
                    </div>
                    <table className="w-full min-w-[3400px] border-collapse text-sm">
                      <thead className="bg-muted/60 text-xs">
                        <tr>
                          <th className="whitespace-nowrap px-4 py-3 text-left font-semibold">
                            User
                          </th>
                          <MetricHeaders />
                        </tr>
                      </thead>
                      <tbody>
                        {group.rows.map((row) => (
                          <tr
                            key={row.counselorId}
                            className="border-t transition-colors hover:bg-muted/30"
                          >
                            <td className="whitespace-nowrap px-4 py-3 font-medium">
                              {row.counselor}
                            </td>
                            <MetricCells row={row} />
                          </tr>
                        ))}
                        <tr className="border-t bg-muted/50 font-semibold">
                          <td className="whitespace-nowrap px-4 py-3">
                            Branch Total
                          </td>
                          <MetricCells row={group.totals} />
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </Section>

            {/* Charts Section */}
            <Section
              value="charts"
              title="Volume Trends"
              description="Monthly walk-ins, conversions, university applications, loan applications and visa approvals."
              icon={BarChart3}
            >
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                <div className="min-w-0 rounded-lg border p-3 sm:p-4">
                  <p className="mb-4 text-xs font-semibold text-muted-foreground">
                    MONTHLY VOLUME TRENDS
                  </p>
                  <div className="h-72 w-full sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={report.monthlyVolume}
                        margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: "12px",
                            paddingTop: "10px",
                          }}
                        />
                        <Line
                          dataKey="walkIns"
                          name="Walk-ins"
                          type="monotone"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="text-primary"
                        />
                        <Line
                          dataKey="applications"
                          name="Applications"
                          type="monotone"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="text-blue-500"
                        />
                        <Line
                          dataKey="universityApplications"
                          name="University Applied"
                          type="monotone"
                          stroke="currentColor"
                          strokeWidth={2}
                          className="text-emerald-500"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="min-w-0 rounded-lg border p-3 sm:p-4">
                  <p className="mb-4 text-xs font-semibold text-muted-foreground">
                    TOP 10 COUNTRY DEMAND
                  </p>
                  <div className="h-72 w-full sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={report.countryDemand.slice(0, 10)}
                        margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="country"
                          tick={{ fontSize: 11 }}
                          interval={0}
                          angle={-20}
                          textAnchor="end"
                          height={40}
                        />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Legend
                          wrapperStyle={{
                            fontSize: "12px",
                            paddingTop: "10px",
                          }}
                        />
                        <Bar
                          dataKey="applications"
                          name="Applications"
                          fill="currentColor"
                          radius={[4, 4, 0, 0]}
                          className="text-primary"
                        />
                        <Bar
                          dataKey="universityApplications"
                          name="University Applied"
                          fill="currentColor"
                          radius={[4, 4, 0, 0]}
                          className="text-emerald-500"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </Section>

            {/* Pipeline Records */}
            <Section
              value="records"
              title="Pipeline Records"
              description="Event-level records showing source classification, conversion timing and loan decision."
              icon={TableProperties}
            >
              <div className="overflow-x-auto rounded-lg border shadow-sm">
                <table className="w-full min-w-[1700px] border-collapse text-sm">
                  <thead className="bg-muted text-xs">
                    <tr>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        Type
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        Walk-in No.
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        Visa App
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        Branch / Owner
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        Source
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        Status
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        University
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        Loan
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left">
                        Created / Converted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {report.rows.map((row) => (
                      <tr
                        key={`${row.recordType}:${row.recordId}`}
                        className="align-top transition-colors hover:bg-muted/30"
                      >
                        <td className="whitespace-nowrap px-4 py-3">
                          <PipelineBadge row={row} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-medium">
                          {row.leadNumber}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {row.studentName || "Not Set"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.mobileNumber}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{row.branchName}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.counselorName}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{row.source || "Not Set"}</div>
                          {row.isReference && (
                            <Badge
                              variant="secondary"
                              className="mt-1 text-[10px]"
                            >
                              Reference
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {humanizeReportStatus(row.lifecycleStatus)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.currentStage}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>{row.latestUniversityName || "—"}</div>
                          <div className="text-xs text-muted-foreground">
                            {row.applicationsCount} applied
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {row.loanApplication
                              ? "Loan Application"
                              : "OS-LOAN / O-FUND"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {row.loanStatus || "Not Set"}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                          {formatReportDate(row.createdAt)}
                        </td>
                      </tr>
                    ))}
                    {!report.rows.length && (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          No matching records found for the selected filter
                          criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Responsive Pagination Bar */}
              <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  Page{" "}
                  <span className="font-semibold text-foreground">
                    {report.pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {report.pagination.totalPages}
                  </span>{" "}
                  ·{" "}
                  <span className="font-semibold text-foreground">
                    {report.pagination.total.toLocaleString("en-IN")}
                  </span>{" "}
                  records
                </p>
                <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={page <= 1}
                    onClick={() => setPage((value) => Math.max(1, value - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled={page >= report.pagination.totalPages}
                    onClick={() => setPage((value) => value + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </Section>
          </>
        ) : null}
      </div>
    </PageTransition>
  );
}
