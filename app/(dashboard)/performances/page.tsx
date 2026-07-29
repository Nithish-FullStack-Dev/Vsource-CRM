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
import { formatReportDate, humanizeReportStatus } from "@/lib/performance-report-utils";
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

function SummaryCard({ title, value, description, icon: Icon }: SummaryCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">
            {typeof value === "number" ? value.toLocaleString("en-IN") : value}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
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
    <Accordion type="single" collapsible defaultValue={defaultOpen ? value : undefined} className="mb-4">
      <AccordionItem value={value} className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <AccordionTrigger className="px-4 py-4 text-left hover:no-underline sm:px-6">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
              <Icon className="size-5" />
            </div>
            <div>
              <p className="font-semibold">{title}</p>
              <p className="mt-1 text-xs font-normal leading-5 text-muted-foreground">{description}</p>
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4 sm:px-6 sm:pb-6">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function MetricHeaders() {
  return (
    <>
      <th className="px-3 py-3 text-right">Walk-ins</th>
      <th className="px-3 py-3 text-right">Reference</th>
      <th className="px-3 py-3 text-right">Active Walk-ins</th>
      <th className="px-3 py-3 text-right">Walk-in Drop / Lost</th>
      <th className="px-3 py-3 text-right">Applications</th>
      <th className="px-3 py-3 text-right">Application Drop / Inactive</th>
      <th className="px-3 py-3 text-right">Same Day Apps</th>
      <th className="px-3 py-3 text-right">Old Walk-in Apps</th>
      <th className="px-3 py-3 text-right">Walk-in → Visa App %</th>
      <th className="px-3 py-3 text-right">University Applied</th>
      <th className="px-3 py-3 text-right">Visa App → Uni Applied %</th>
      <th className="px-3 py-3 text-right">Offers</th>
      <th className="px-3 py-3 text-right">Loan Applications</th>
      <th className="px-3 py-3 text-right">OS-LOAN / O-FUND</th>
      <th className="px-3 py-3 text-right">Loan Approved</th>
      <th className="px-3 py-3 text-right">Loan Approval %</th>
      <th className="px-3 py-3 text-right">Loan Disbursed</th>
      <th className="px-3 py-3 text-right">CAS Applied</th>
      <th className="px-3 py-3 text-right">CAS Received</th>
      <th className="px-3 py-3 text-right">Visa Applied</th>
      <th className="px-3 py-3 text-right">Visa Approved</th>
      <th className="px-3 py-3 text-right">Visa App → Visa Approved %</th>
      <th className="px-3 py-3 text-right">Target</th>
      <th className="px-3 py-3 text-right">Achieved</th>
      <th className="px-3 py-3 text-right">Target %</th>
    </>
  );
}

function MetricCells({ row }: { row: PerformanceReportMetricRow; }) {
  return (
    <>
      <td className="px-3 py-3 text-right font-semibold">{row.walkIns}</td>
      <td className="px-3 py-3 text-right">{row.references}</td>
      <td className="px-3 py-3 text-right">{row.activeWalkIns}</td>
      <td className="px-3 py-3 text-right text-destructive">
        {row.walkInDropLost}
      </td>
      <td className="px-3 py-3 text-right font-semibold">{row.applications}</td>
      <td className="px-3 py-3 text-right text-destructive">
        {row.studentDropInactive}
      </td>
      <td className="px-3 py-3 text-right">{row.sameDayApplications}</td>
      <td className="px-3 py-3 text-right">{row.oldWalkInApplications}</td>
      <td className="px-3 py-3 text-right font-semibold text-primary">
        {row.leadToStudentConversionPercentage}%
      </td>
      <td className="px-3 py-3 text-right">{row.universityApplications}</td>
      <td className="px-3 py-3 text-right font-semibold text-primary">
        {row.universityApplicationConversionPercentage}%
      </td>
      <td className="px-3 py-3 text-right">{row.offers}</td>
      <td className="px-3 py-3 text-right">{row.loanApplications}</td>
      <td className="px-3 py-3 text-right">{row.outsideLoan}</td>
      <td className="px-3 py-3 text-right font-semibold">{row.loanApproved}</td>
      <td className="px-3 py-3 text-right font-semibold text-primary">
        {row.loanConversionPercentage}%
      </td>
      <td className="px-3 py-3 text-right">{row.loanDisbursed}</td>
      <td className="px-3 py-3 text-right">{row.casApplied}</td>
      <td className="px-3 py-3 text-right">{row.casReceived}</td>
      <td className="px-3 py-3 text-right">{row.visaApplied}</td>
      <td className="px-3 py-3 text-right font-semibold">{row.visaApproved}</td>
      <td className="px-3 py-3 text-right font-semibold text-primary">
        {row.visaConversionPercentage}%
      </td>
      <td className="px-3 py-3 text-right">{row.target}</td>
      <td className="px-3 py-3 text-right font-semibold">{row.achieved}</td>
      <td className="px-3 py-3 text-right font-semibold text-primary">
        {row.targetCompletionPercentage}%
      </td>
    </>
  );
}

function PipelineBadge({ row }: { row: PerformanceReportRow; }) {
  if (row.recordType === "lead") {
    return <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">Walk-in</Badge>;
  }
  return (
    <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-700">
      {row.applicationTiming === "same_day" ? "Same Day App" : "Old Walk-in App"}
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
      downloadBlob(blob, `vsource-performance-report-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success("Performance report exported");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to export report");
    } finally {
      setExporting(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-5">
        <PageHeader
          title="Performance Report"
          description="Walk-ins, references, converted applications, university applications, loans, CAS, visa and targets using the updated schema."
          actions={
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => reportQuery.refetch()} disabled={reportQuery.isFetching}>
                <RefreshCw className={`mr-2 size-4 ${reportQuery.isFetching ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button onClick={exportReport} disabled={!report || exporting}>
                {exporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 12 }, (_, index) => (
              <Card key={index}><CardContent className="space-y-3 p-5"><Skeleton className="h-3 w-24" /><Skeleton className="h-8 w-20" /><Skeleton className="h-3 w-36" /></CardContent></Card>
            ))}
          </div>
        ) : reportQuery.isError ? (
          <Card><CardContent className="p-8 text-center text-destructive">{reportQuery.error.message}</CardContent></Card>
        ) : report ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard title="Walk-ins" value={report.summary.walkIns} description="Walk-in records created in the selected period" icon={Users} />
              <SummaryCard title="Reference" value={report.summary.references} description="Every walk-in source except Walk-in" icon={UserCheck} />
              <SummaryCard title="Applications" value={report.summary.applications} description={`${report.summary.leadToStudentConversionPercentage}% walkin-to-Visa App conversion`} icon={GraduationCap} />
              <SummaryCard title="Same Day Apps" value={report.summary.sameDayApplications} description="Converted on the same IST calendar day" icon={CalendarClock} />
              <SummaryCard title="Old Walk-in Apps" value={report.summary.oldWalkInApplications} description="Converted on a later IST calendar day" icon={CalendarClock} />
              <SummaryCard title="University Applied" value={report.summary.universityApplications} description={`${report.summary.universityApplicationConversionPercentage}% of applications`} icon={FileCheck2} />
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
              <SummaryCard title="Loan Applications" value={report.summary.loanApplications} description="Loan form submitted or loan requirement marked Yes" icon={Landmark} />
              <SummaryCard title="OS-LOAN / O-FUND" value={report.summary.outsideLoan} description="Loan requirement marked No in Walk-in form" icon={Landmark} />
              <SummaryCard title="Loan Approved" value={report.summary.loanApproved} description={`${report.summary.loanConversionPercentage}% of loan applications`} icon={Landmark} />
              <SummaryCard title="Visa Approved" value={report.summary.visaApproved} description={`${report.summary.visaConversionPercentage}% of converted applications`} icon={GraduationCap} />
              <SummaryCard title="Target Completion" value={`${report.summary.targetCompletionPercentage}%`} description={`${report.summary.achieved.toLocaleString("en-IN")} achieved of ${report.summary.target.toLocaleString("en-IN")}`} icon={BarChart3} />
            </div>

            <Section value="branch" title="Branch Performance" description="Branch-wise business metrics without double counting converted Walk-in events." icon={TableProperties} defaultOpen>
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-[3300px] w-full text-sm">
                  <thead className="bg-muted text-xs"><tr><th className="px-4 py-3 text-left">Branch</th><MetricHeaders /></tr></thead>
                  <tbody>
                    {report.branchPerformance.map((row) => <tr key={row.branchId} className="border-t"><td className="px-4 py-3 font-medium">{row.branch}</td><MetricCells row={row} /></tr>)}
                    <tr className="border-t bg-muted/60 font-semibold"><td className="px-4 py-3">Grand Total</td><MetricCells row={branchTotal} /></tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section value="users" title="User Performance" description="Walk-in owner, converted-by user and fintech owner attribution are retained." icon={Users}>
              <div className="space-y-4">
                {counselorGroups.map((group) => (
                  <div key={group.branchId} className="overflow-x-auto rounded-lg border">
                    <div className="border-b bg-muted/50 px-4 py-3 font-semibold">{group.branch}</div>
                    <table className="min-w-[3400px] w-full text-sm">
                      <thead className="bg-muted/60 text-xs"><tr><th className="px-4 py-3 text-left">User</th><MetricHeaders /></tr></thead>
                      <tbody>
                        {group.rows.map((row) => <tr key={row.counselorId} className="border-t"><td className="px-4 py-3 font-medium">{row.counselor}</td><MetricCells row={row} /></tr>)}
                        <tr className="border-t bg-muted/50 font-semibold"><td className="px-4 py-3">Branch Total</td><MetricCells row={group.totals} /></tr>
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            </Section>

            <Section value="charts" title="Volume Trends" description="Monthly walk-ins, conversions, university applications, loan applications and visa approvals." icon={BarChart3}>
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="h-80 rounded-lg border p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={report.monthlyVolume}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="label" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                      <Line dataKey="walkIns" name="Walk-ins" type="monotone" stroke="currentColor" />
                      <Line dataKey="applications" name="Applications" type="monotone" stroke="currentColor" />
                      <Line dataKey="universityApplications" name="University Applied" type="monotone" stroke="currentColor" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-80 rounded-lg border p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.countryDemand.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="country" /><YAxis allowDecimals={false} /><Tooltip /><Legend />
                      <Bar dataKey="applications" name="Applications" fill="currentColor" />
                      <Bar dataKey="universityApplications" name="University Applied" fill="currentColor" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Section>

            <Section value="records" title="Pipeline Records" description="Event-level records showing source classification, conversion timing and loan decision." icon={TableProperties}>
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-[1700px] w-full text-sm">
                  <thead className="bg-muted text-xs"><tr>
                    <th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">Walk-in No.</th><th className="px-4 py-3 text-left">Visa App</th><th className="px-4 py-3 text-left">Branch / Owner</th><th className="px-4 py-3 text-left">Source</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">University</th><th className="px-4 py-3 text-left">Loan</th><th className="px-4 py-3 text-left">Created / Converted</th>
                  </tr></thead>
                  <tbody>
                    {report.rows.map((row) => (
                      <tr key={`${row.recordType}:${row.recordId}`} className="border-t align-top">
                        <td className="px-4 py-3"><PipelineBadge row={row} /></td>
                        <td className="px-4 py-3 font-medium">{row.leadNumber}</td>
                        <td className="px-4 py-3"><div className="font-medium">{row.studentName || "Not Set"}</div><div className="text-xs text-muted-foreground">{row.mobileNumber}</div></td>
                        <td className="px-4 py-3"><div>{row.branchName}</div><div className="text-xs text-muted-foreground">{row.counselorName}</div></td>
                        <td className="px-4 py-3"><div>{row.source || "Not Set"}</div>{row.isReference && <Badge variant="secondary" className="mt-1">Reference</Badge>}</td>
                        <td className="px-4 py-3"><div>{humanizeReportStatus(row.lifecycleStatus)}</div><div className="text-xs text-muted-foreground">{row.currentStage}</div></td>
                        <td className="px-4 py-3"><div>{row.latestUniversityName || "—"}</div><div className="text-xs text-muted-foreground">{row.applicationsCount} applied</div></td>
                        <td className="px-4 py-3"><div>{row.loanApplication ? "Loan Application" : "OS-LOAN / O-FUND"}</div><div className="text-xs text-muted-foreground">{row.loanStatus || "Not Set"}</div></td>
                        <td className="px-4 py-3">{formatReportDate(row.createdAt)}</td>
                      </tr>
                    ))}
                    {!report.rows.length && <tr><td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">No matching records</td></tr>}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Page {report.pagination.page} of {report.pagination.totalPages} · {report.pagination.total.toLocaleString("en-IN")} records</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</Button>
                  <Button variant="outline" size="sm" disabled={page >= report.pagination.totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button>
                </div>
              </div>
            </Section>
          </>
        ) : null}
      </div>
    </PageTransition>
  );
}
