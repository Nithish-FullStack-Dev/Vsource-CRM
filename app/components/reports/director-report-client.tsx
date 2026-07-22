"use client";

import { Fragment, type ReactNode, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUp,
  BarChart3,
  ChevronDown,
  Download,
  FileSpreadsheet,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { DirectorReportFilterSheet } from "./DirectorReportFilterSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_DIRECTOR_REPORT_FILTERS,
  type DirectorReportComparisonRow,
  type DirectorReportData,
  type DirectorReportFilters,
  type DirectorReportIntakeComparisonRow,
  type DirectorReportRow,
  type DirectorReportTableTotals,
} from "@/types/director-report";

type ApiResponse<T> = {
  data?: T;
  message?: string;
  success?: boolean;
};

type ValueType = "number" | "percentage" | "currency" | "leads";

type MetricColumn = {
  key: keyof DirectorReportRow;
  label: string;
  type: ValueType;
  group:
    | "Pipeline"
    | "Targets"
    | "Applications / Visa / Loan"
    | "Conversions"
    | "Financials"
    | "References";
};

type TableGroup = {
  key: string;
  rows: DirectorReportRow[];
  total: DirectorReportRow;
};

const numberFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1,
});
const integerFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});
const currencyFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
  style: "currency",
  currency: "INR",
});

const METRIC_COLUMNS: MetricColumn[] = [
  { key: "totalWalkins", label: "Total Walk-ins", type: "number", group: "Pipeline" },
  { key: "leadsAdded", label: "Walk-ins Added", type: "number", group: "Pipeline" },
  // { key: "allLeads", label: "All Walk-ins", type: "number", group: "Pipeline" },
  { key: "activeLeads", label: "Active Walk-ins", type: "number", group: "Pipeline" },
  // { key: "qualifiedLeads", label: "Qualified", type: "number", group: "Pipeline" },
  { key: "lostLeads", label: "Walk-in Lost", type: "number", group: "Pipeline" },
  { key: "students", label: "Applications", type: "number", group: "Pipeline" },
  { key: "droppedStudents", label: "Application Drop", type: "number", group: "Pipeline" },
  { key: "target", label: "Target", type: "number", group: "Targets" },
  { key: "achieved", label: "Achieved", type: "number", group: "Targets" },
  { key: "targetCompletionPercentage", label: "Target %", type: "percentage", group: "Targets" },
  { key: "applications", label: "Uni Applications", type: "number", group: "Applications / Visa / Loan" },
  { key: "offers", label: "Uni Offers", type: "number", group: "Applications / Visa / Loan" },
  { key: "casReceived", label: "CAS", type: "number", group: "Applications / Visa / Loan" },
  { key: "visaApproved", label: "Visa Approved", type: "number", group: "Applications / Visa / Loan" },
  { key: "loanLogins", label: "Loan Logins", type: "number", group: "Applications / Visa / Loan" },
  { key: "loanApproved", label: "Loan Approved", type: "number", group: "Applications / Visa / Loan" },
  { key: "loanDisbursed", label: "Loan Disbursed", type: "number", group: "Applications / Visa / Loan" },
  { key: "leadToStudentConversionPercentage", label: "Walk-in Conv %", type: "percentage", group: "Conversions" },
  { key: "applicationConversionPercentage", label: "App Conv %", type: "percentage", group: "Conversions" },
  { key: "visaConversionPercentage", label: "Visa Conv %", type: "percentage", group: "Conversions" },
  { key: "loanConversionPercentage", label: "Loan Approval %", type: "percentage", group: "Conversions" },
  { key: "appliedAmount", label: "Applied Amount", type: "currency", group: "Financials" },
  { key: "sanctionedAmount", label: "Sanctioned", type: "currency", group: "Financials" },
  { key: "disbursedAmount", label: "Disbursed", type: "currency", group: "Financials" },
  // { key: "leadNumbers", label: "Walk-in Numbers", type: "leads", group: "References" },
];

const AVERAGE_COLUMNS: MetricColumn[] = [
  { key: "avgWeeklyWalkins", label: "Avg Walk-ins", type: "number", group: "Pipeline" },
  { key: "avgWeeklyApplications", label: "Avg Applications", type: "number", group: "Pipeline" },
  { key: "avgWeeklyLoanLogins", label: "Avg Loan Logins", type: "number", group: "Pipeline" },
  { key: "avgWeeklyLoanApproved", label: "Avg Loan Approved", type: "number", group: "Pipeline" },
  { key: "avgWeeklyVisaApproved", label: "Avg Visa", type: "number", group: "Pipeline" },
];

const GROUP_ORDER: MetricColumn["group"][] = [
  "Pipeline",
  "Targets",
  "Applications / Visa / Loan",
  "Conversions",
  "Financials",
  "References",
];

function queryString(filters: DirectorReportFilters): string {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  return params.toString();
}

function formatValue(value: unknown, type: ValueType): string {
  if (type === "leads") {
    const leadNumbers = Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];

    if (leadNumbers.length === 0) return "—";
    const visible = leadNumbers.slice(0, 3).join(", ");
    return leadNumbers.length > 3
      ? `${visible} +${leadNumbers.length - 3}`
      : visible;
  }

  if (type === "currency") return currencyFormat.format(Number(value ?? 0));
  if (type === "percentage") return `${numberFormat.format(Number(value ?? 0))}%`;
  return integerFormat.format(Number(value ?? 0));
}

async function fetchDirectorReport(
  filters: DirectorReportFilters,
): Promise<DirectorReportData> {
  const response = await fetch(
    `/api/reports/directors?${queryString(filters)}`,
    { cache: "no-store" },
  );
  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<DirectorReportData>
    | DirectorReportData
    | null;

  if (!response.ok) {
    throw new Error(
      payload && "message" in payload && payload.message
        ? payload.message
        : "Unable to fetch Directors Report",
    );
  }

  if (!payload) throw new Error("Directors Report returned an empty response");

  return "data" in payload && payload.data
    ? payload.data
    : (payload as DirectorReportData);
}

function SummaryCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-200/70 bg-emerald-50/70 dark:border-emerald-500/20 dark:bg-emerald-500/10"
      : tone === "warning"
        ? "border-amber-200/70 bg-amber-50/70 dark:border-amber-500/20 dark:bg-amber-500/10"
        : "border-border bg-card";

  return (
    <div
      className={`flex min-h-[132px] h-full flex-col rounded-xl border p-4 shadow-sm ${toneClass}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-auto pt-4 text-2xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function TableSectionHeader({
  title,
  description,
  rowCount,
  branchCount,
  grandTotal,
  isOpen,
  onToggle,
}: {
  title: string;
  description: string;
  rowCount: number;
  branchCount: number;
  grandTotal: DirectorReportRow;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="flex w-full flex-col gap-3 border-b border-border bg-muted/25 px-4 py-4 text-left transition-colors hover:bg-muted/40 sm:px-5 lg:flex-row lg:items-center lg:justify-between"
    >
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 max-w-4xl text-xs leading-5 text-muted-foreground sm:text-sm">
          {description}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Badge variant="outline">{branchCount} branches</Badge>
        <Badge variant="outline">{rowCount} users</Badge>
        <Badge variant="secondary">
          {integerFormat.format(grandTotal.totalWalkins)} total walk-ins
        </Badge>
        <span className="ml-1 inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </div>
    </button>
  );
}

function AccordionHeader({
  title,
  description,
  isOpen,
  onToggle,
  icon,
  meta,
}: {
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  icon?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="flex w-full flex-col gap-3 border-b border-border bg-muted/25 px-5 py-4 text-left transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {meta}
        <span className="inline-flex size-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground">
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </span>
      </div>
    </button>
  );
}

function useHashAwareAccordion(id: string, defaultOpen = false) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    const openFromHash = () => {
      if (window.location.hash !== `#${id}`) return;

      setIsOpen(true);
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);

    return () => window.removeEventListener("hashchange", openFromHash);
  }, [id]);

  return { isOpen, setIsOpen };
}

function groupKey(
  row: DirectorReportRow,
  showPeriod: boolean,
  showIntake: boolean,
): string {
  return [
    showPeriod ? row.periodKey : "all-periods",
    showIntake ? row.intakeId ?? "not-set" : "all-intakes",
    row.branchId,
  ].join(":");
}

const IDENTITY_WIDTHS = {
  period: 148,
  intake: 190,
  branch: 220,
  user: 270,
} as const;

function metricWidthPx(type: ValueType): number {
  if (type === "currency") return 150;
  if (type === "leads") return 250;
  if (type === "percentage") return 118;
  return 108;
}

function stickyStyle(left: number, width: number) {
  return {
    left,
    width,
    minWidth: width,
    maxWidth: width,
  };
}

function getTableLayout(showPeriod: boolean, showIntake: boolean) {
  const periodLeft = 0;
  const intakeLeft = showPeriod ? IDENTITY_WIDTHS.period : 0;
  const branchLeft =
    (showPeriod ? IDENTITY_WIDTHS.period : 0) +
    (showIntake ? IDENTITY_WIDTHS.intake : 0);
  const userLeft = branchLeft + IDENTITY_WIDTHS.branch;

  return {
    periodLeft,
    intakeLeft,
    branchLeft,
    userLeft,
    identityWidth: userLeft + IDENTITY_WIDTHS.user,
  };
}

function MetricCells({
  row,
  columns,
  className = "",
}: {
  row: DirectorReportRow;
  columns: MetricColumn[];
  className?: string;
}) {
  return columns.map((column) => {
    const width = metricWidthPx(column.type);

    return (
      <td
        key={`${row.rowId}:${String(column.key)}`}
        style={{ width, minWidth: width, maxWidth: width }}
        className={`overflow-hidden whitespace-nowrap border-b border-r border-border px-3 py-3 text-right tabular-nums last:border-r-0 ${className}`}
        title={
          column.type === "leads" ? row.leadNumbers.join(", ") : undefined
        }
      >
        <span className={column.type === "leads" ? "block truncate text-left" : ""}>
          {formatValue(row[column.key], column.type)}
        </span>
      </td>
    );
  });
}

function ReportTable({
  id,
  title,
  description,
  rows,
  totals,
  showPeriod = false,
  showIntake = false,
  showAverages = false,
  defaultOpen = false,
}: {
  id: string;
  title: string;
  description: string;
  rows: DirectorReportRow[];
  totals: DirectorReportTableTotals;
  showPeriod?: boolean;
  showIntake?: boolean;
  showAverages?: boolean;
  defaultOpen?: boolean;
}) {
  const { isOpen, setIsOpen } = useHashAwareAccordion(id, defaultOpen);
  const columns = useMemo(
    () => [...METRIC_COLUMNS, ...(showAverages ? AVERAGE_COLUMNS : [])],
    [showAverages],
  );
  const groups = useMemo(
    () =>
      GROUP_ORDER.map((group) => ({
        group,
        columns: columns.filter((column) => column.group === group),
      })).filter((item) => item.columns.length > 0),
    [columns],
  );
  const tableGroups = useMemo<TableGroup[]>(() => {
    const map = new Map<string, TableGroup>();

    for (const total of totals.branchRows) {
      const key = groupKey(total, showPeriod, showIntake);
      map.set(key, { key, rows: [], total });
    }

    for (const row of rows) {
      const key = groupKey(row, showPeriod, showIntake);
      const current = map.get(key) ?? { key, rows: [], total: row };
      current.rows.push(row);
      map.set(key, current);
    }

    return Array.from(map.values()).sort(
      (a, b) =>
        a.total.periodKey.localeCompare(b.total.periodKey) ||
        (a.total.intakeName ?? "").localeCompare(b.total.intakeName ?? "") ||
        a.total.branchName.localeCompare(b.total.branchName),
    );
  }, [rows, showIntake, showPeriod, totals.branchRows]);

  const layout = getTableLayout(showPeriod, showIntake);
  const identityColumnCount = 2 + Number(showPeriod) + Number(showIntake);
  const emptyColSpan = identityColumnCount + columns.length;
  const branchCount = new Set(totals.branchRows.map((row) => row.branchId)).size;
  const tableWidth =
    layout.identityWidth +
    columns.reduce((total, column) => total + metricWidthPx(column.type), 0);

  return (
    <section
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <TableSectionHeader
        title={title}
        description={description}
        rowCount={rows.length}
        branchCount={branchCount}
        grandTotal={totals.grandTotal}
        isOpen={isOpen}
        onToggle={() => setIsOpen((current) => !current)}
      />

      {isOpen && (
        <div className="relative max-h-[700px] overflow-auto bg-background [scrollbar-gutter:stable]">
        <table
          className="border-separate border-spacing-0 text-xs text-foreground"
          style={{ width: tableWidth, minWidth: tableWidth, tableLayout: "fixed" }}
        >
          <colgroup>
            {showPeriod && <col style={{ width: IDENTITY_WIDTHS.period }} />}
            {showIntake && <col style={{ width: IDENTITY_WIDTHS.intake }} />}
            <col style={{ width: IDENTITY_WIDTHS.branch }} />
            <col style={{ width: IDENTITY_WIDTHS.user }} />
            {columns.map((column) => (
              <col
                key={`col:${String(column.key)}`}
                style={{ width: metricWidthPx(column.type) }}
              />
            ))}
          </colgroup>

          <thead>
            <tr className="h-11 bg-primary text-primary-foreground">
              {showPeriod && (
                <th
                  rowSpan={2}
                  style={stickyStyle(layout.periodLeft, IDENTITY_WIDTHS.period)}
                  className="sticky left-0 top-0 z-[80] overflow-hidden border-b border-r border-primary-foreground/25 bg-primary px-3 py-3 text-left font-semibold"
                >
                  Date / Period
                </th>
              )}
              {showIntake && (
                <th
                  rowSpan={2}
                  style={stickyStyle(layout.intakeLeft, IDENTITY_WIDTHS.intake)}
                  className="sticky top-0 z-[80] overflow-hidden border-b border-r border-primary-foreground/25 bg-primary px-3 py-3 text-left font-semibold"
                >
                  Intake
                </th>
              )}
              <th
                rowSpan={2}
                style={stickyStyle(layout.branchLeft, IDENTITY_WIDTHS.branch)}
                className="sticky top-0 z-[80] overflow-hidden border-b border-r border-primary-foreground/25 bg-primary px-4 py-3 text-left font-semibold"
              >
                Branch
              </th>
              <th
                rowSpan={2}
                style={stickyStyle(layout.userLeft, IDENTITY_WIDTHS.user)}
                className="sticky top-0 z-[80] overflow-hidden border-b-2 border-r-2 border-primary-foreground/25 bg-primary px-4 py-3 text-left font-semibold shadow-[8px_0_14px_-12px_rgba(0,0,0,0.9)]"
              >
                User
              </th>
              {groups.map((group) => (
                <th
                  key={group.group}
                  colSpan={group.columns.length}
                  className="sticky top-0 z-50 h-11 border-b border-r border-primary-foreground/25 bg-primary px-3 py-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] last:border-r-0"
                >
                  {group.group}
                </th>
              ))}
            </tr>
            <tr className="h-11 bg-muted text-muted-foreground">
              {columns.map((column) => {
                const width = metricWidthPx(column.type);

                return (
                  <th
                    key={`header:${String(column.key)}`}
                    style={{ width, minWidth: width, maxWidth: width }}
                    className="sticky top-11 z-50 overflow-hidden whitespace-normal border-b border-r border-border bg-muted px-3 py-2 text-right font-semibold leading-4 last:border-r-0"
                  >
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {tableGroups.length === 0 ? (
              <tr>
                <td
                  colSpan={emptyColSpan}
                  className="bg-background px-4 py-12 text-center text-muted-foreground"
                >
                  No records found for the selected filters.
                </td>
              </tr>
            ) : (
              tableGroups.map((group) => {
                const span = group.rows.length + 1;

                return (
                  <Fragment key={group.key}>
                    {group.rows.map((row, index) => {
                      const rowSurface = index % 2 === 0 ? "bg-background" : "bg-muted";

                      return (
                        <tr
                          key={row.rowId}
                          className={`group ${rowSurface} transition-colors hover:bg-accent`}
                        >
                          {index === 0 && showPeriod && (
                            <td
                              rowSpan={span}
                              style={stickyStyle(layout.periodLeft, IDENTITY_WIDTHS.period)}
                              className="sticky z-30 overflow-hidden border-b border-r border-border bg-background px-3 py-3 align-top font-semibold text-foreground group-hover:bg-accent"
                            >
                              <span className="block break-words leading-5">
                                {group.total.periodLabel}
                              </span>
                            </td>
                          )}
                          {index === 0 && showIntake && (
                            <td
                              rowSpan={span}
                              style={stickyStyle(layout.intakeLeft, IDENTITY_WIDTHS.intake)}
                              className="sticky z-30 overflow-hidden border-b border-r border-border bg-background px-3 py-3 align-top font-semibold text-foreground group-hover:bg-accent"
                            >
                              <span className="block break-words leading-5">
                                {group.total.intakeName ?? group.total.periodLabel}
                              </span>
                            </td>
                          )}
                          {index === 0 && (
                            <td
                              rowSpan={span}
                              style={stickyStyle(layout.branchLeft, IDENTITY_WIDTHS.branch)}
                              className="sticky z-30 overflow-hidden border-b border-r border-border bg-background px-4 py-3 align-top font-semibold text-foreground group-hover:bg-accent"
                            >
                              <span className="block break-words leading-5">
                                {group.total.branchName}
                              </span>
                            </td>
                          )}
                          <td
                            style={stickyStyle(layout.userLeft, IDENTITY_WIDTHS.user)}
                            className={`sticky z-20 overflow-hidden border-b border-r-2 border-border ${rowSurface} px-4 py-3 font-medium text-foreground shadow-[8px_0_14px_-12px_rgba(0,0,0,0.9)] group-hover:bg-accent`}
                            title={row.counselorName}
                          >
                            <span className="block truncate">
                              {row.counselorName}
                            </span>
                          </td>
                          <MetricCells
                            row={row}
                            columns={columns}
                            className="text-foreground"
                          />
                        </tr>
                      );
                    })}

                    <tr className="bg-accent font-semibold text-accent-foreground">
                      {group.rows.length === 0 && showPeriod && (
                        <td
                          style={stickyStyle(layout.periodLeft, IDENTITY_WIDTHS.period)}
                          className="sticky z-30 overflow-hidden border-b border-r border-border bg-accent px-3 py-3"
                        >
                          {group.total.periodLabel}
                        </td>
                      )}
                      {group.rows.length === 0 && showIntake && (
                        <td
                          style={stickyStyle(layout.intakeLeft, IDENTITY_WIDTHS.intake)}
                          className="sticky z-30 overflow-hidden border-b border-r border-border bg-accent px-3 py-3"
                        >
                          {group.total.intakeName ?? group.total.periodLabel}
                        </td>
                      )}
                      {group.rows.length === 0 && (
                        <td
                          style={stickyStyle(layout.branchLeft, IDENTITY_WIDTHS.branch)}
                          className="sticky z-30 overflow-hidden border-b border-r border-border bg-accent px-4 py-3"
                        >
                          {group.total.branchName}
                        </td>
                      )}
                      <td
                        style={stickyStyle(layout.userLeft, IDENTITY_WIDTHS.user)}
                        className="sticky z-20 overflow-hidden border-b border-r-2 border-border bg-accent px-4 py-3 font-bold text-primary shadow-[8px_0_14px_-12px_rgba(0,0,0,0.9)]"
                      >
                        Branch Total
                      </td>
                      <MetricCells
                        row={group.total}
                        columns={columns}
                        className="bg-accent font-bold text-accent-foreground"
                      />
                    </tr>
                  </Fragment>
                );
              })
            )}
          </tbody>

          {tableGroups.length > 0 && (
            <tfoot>
              <tr className="bg-primary font-bold text-primary-foreground">
                {showPeriod && (
                  <td
                    style={stickyStyle(layout.periodLeft, IDENTITY_WIDTHS.period)}
                    className="sticky bottom-0 z-[60] border-r border-primary-foreground/25 bg-primary px-3 py-3"
                  >
                    All Periods
                  </td>
                )}
                {showIntake && (
                  <td
                    style={stickyStyle(layout.intakeLeft, IDENTITY_WIDTHS.intake)}
                    className="sticky bottom-0 z-[60] border-r border-primary-foreground/25 bg-primary px-3 py-3"
                  >
                    All Intakes
                  </td>
                )}
                <td
                  style={stickyStyle(layout.branchLeft, IDENTITY_WIDTHS.branch)}
                  className="sticky bottom-0 z-[60] border-r border-primary-foreground/25 bg-primary px-4 py-3 text-left text-sm"
                >
                  Grand Total
                </td>
                <td
                  style={stickyStyle(layout.userLeft, IDENTITY_WIDTHS.user)}
                  className="sticky bottom-0 z-[60] border-r-2 border-primary-foreground/25 bg-primary px-4 py-3 text-left shadow-[8px_0_14px_-12px_rgba(0,0,0,0.9)]"
                >
                  All Users
                </td>
                <MetricCells
                  row={totals.grandTotal}
                  columns={columns}
                  className="border-primary-foreground/25 bg-primary text-primary-foreground"
                />
              </tr>
            </tfoot>
          )}
        </table>
        </div>
      )}
    </section>
  );
}

function comparisonTone(value: number): string {
  if (value > 0) return "text-emerald-600 dark:text-emerald-400";
  if (value < 0) return "text-destructive";
  return "text-muted-foreground";
}

function formatComparisonValue(
  value: number,
  type: DirectorReportComparisonRow["valueType"],
): string {
  if (type === "currency") return currencyFormat.format(value);
  if (type === "percentage") return `${numberFormat.format(value)}%`;
  return integerFormat.format(value);
}

function ComparisonTable({
  id,
  title,
  description,
  rows,
  defaultOpen = false,
}: {
  id: string;
  title: string;
  description: string;
  rows: DirectorReportComparisonRow[];
  defaultOpen?: boolean;
}) {
  const { isOpen, setIsOpen } = useHashAwareAccordion(id, defaultOpen);

  return (
    <section
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <AccordionHeader
        title={title}
        description={description}
        isOpen={isOpen}
        onToggle={() => setIsOpen((current) => !current)}
        meta={<Badge variant="secondary">{rows.length} metrics</Badge>}
      />

      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="border-b border-border px-4 py-3 text-left font-semibold">
                  Metric
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Current
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Previous
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Difference
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No comparison data found.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.rowId}
                    className={`${
                      index % 2 === 0 ? "bg-card" : "bg-muted/20"
                    } border-b border-border/60 last:border-b-0 hover:bg-accent/50`}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {row.metric}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatComparisonValue(row.current, row.valueType)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatComparisonValue(row.previous, row.valueType)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${comparisonTone(
                        row.difference,
                      )}`}
                    >
                      {formatComparisonValue(row.difference, row.valueType)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${comparisonTone(
                        row.changePercentage,
                      )}`}
                    >
                      <span className="inline-flex items-center justify-end gap-1">
                        {row.changePercentage > 0 ? (
                          <TrendingUp className="size-3.5" />
                        ) : row.changePercentage < 0 ? (
                          <TrendingDown className="size-3.5" />
                        ) : null}
                        {numberFormat.format(row.changePercentage)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function intakeGrandTotal(rows: DirectorReportIntakeComparisonRow[]) {
  const total = rows.reduce(
    (result, row) => ({
      totalWalkins: result.totalWalkins + row.totalWalkins,
      students: result.students + row.students,
      applications: result.applications + row.applications,
      visaApproved: result.visaApproved + row.visaApproved,
      loanLogins: result.loanLogins + row.loanLogins,
      loanApproved: result.loanApproved + row.loanApproved,
    }),
    {
      totalWalkins: 0,
      students: 0,
      applications: 0,
      visaApproved: 0,
      loanLogins: 0,
      loanApproved: 0,
    },
  );
  const percent = (part: number, whole: number) =>
    whole > 0 ? (part / whole) * 100 : 0;

  return {
    ...total,
    leadConversionPercentage: percent(total.students, total.totalWalkins),
    applicationConversionPercentage: percent(total.applications, total.students),
    visaConversionPercentage: percent(total.visaApproved, total.students),
    loanConversionPercentage: percent(total.loanApproved, total.loanLogins),
  };
}

function IntakeComparisonTable({
  rows,
  defaultOpen = false,
}: {
  rows: DirectorReportIntakeComparisonRow[];
  defaultOpen?: boolean;
}) {
  const total = useMemo(() => intakeGrandTotal(rows), [rows]);
  const { isOpen, setIsOpen } = useHashAwareAccordion(
    "intake-comparison",
    defaultOpen,
  );

  return (
    <section
      id="intake-comparison"
      className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
    >
      <AccordionHeader
        title="Intake Comparison"
        description="Unique branch totals and conversion percentages across every intake in the selected period."
        isOpen={isOpen}
        onToggle={() => setIsOpen((current) => !current)}
        meta={<Badge variant="secondary">{rows.length} intakes</Badge>}
      />

      {isOpen && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="border-b border-border px-4 py-3 text-left font-semibold">
                  Intake
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Walk-ins
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Applications
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Uni Applications
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Visa Approved
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Loan Logins
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Loan Approved
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Walk-in Conv %
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  App Conv %
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Visa Conv %
                </th>
                <th className="border-b border-border px-4 py-3 text-right font-semibold">
                  Loan Approval %
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    No intake comparison data found.
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr
                    key={row.rowId}
                    className={`${
                      index % 2 === 0 ? "bg-card" : "bg-muted/20"
                    } border-b border-border/60 hover:bg-accent/50`}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {row.intakeName}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {integerFormat.format(row.totalWalkins)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {integerFormat.format(row.students)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {integerFormat.format(row.applications)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {integerFormat.format(row.visaApproved)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {integerFormat.format(row.loanLogins)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {integerFormat.format(row.loanApproved)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {numberFormat.format(row.leadConversionPercentage)}%
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {numberFormat.format(row.applicationConversionPercentage)}%
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {numberFormat.format(row.visaConversionPercentage)}%
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {numberFormat.format(row.loanConversionPercentage)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {rows.length > 0 && (
              <tfoot>
                <tr className="bg-primary font-bold text-primary-foreground">
                  <td className="px-4 py-3">Grand Total</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {integerFormat.format(total.totalWalkins)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {integerFormat.format(total.students)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {integerFormat.format(total.applications)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {integerFormat.format(total.visaApproved)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {integerFormat.format(total.loanLogins)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {integerFormat.format(total.loanApproved)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {numberFormat.format(total.leadConversionPercentage)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {numberFormat.format(total.applicationConversionPercentage)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {numberFormat.format(total.visaConversionPercentage)}%
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {numberFormat.format(total.loanConversionPercentage)}%
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </section>
  );
}

export default function DirectorReportClient() {
  const [appliedFilters, setAppliedFilters] = useState<DirectorReportFilters>(
    DEFAULT_DIRECTOR_REPORT_FILTERS,
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const walkInDetailsAccordion = useHashAwareAccordion(
    "walk-in-details",
    false,
  );

  useEffect(() => {
    const handleScroll = () => setShowScrollToTop(window.scrollY > 500);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const reportQuery = useQuery({
    queryKey: ["director-report", appliedFilters],
    queryFn: () => fetchDirectorReport(appliedFilters),
    placeholderData: (previous) => previous,
  });

  const data = reportQuery.data;

  const exportExcel = async () => {
    try {
      setExporting(true);
      setExportError("");

      const response = await fetch(
        `/api/reports/directors/export?${queryString(appliedFilters)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(payload?.message ?? "Unable to export Directors Report");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
      const filename =
        filenameMatch?.[1] ??
        `vsource-directors-report-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Unable to export report",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="space-y-5 p-3 sm:p-4 md:p-6">
      <header className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary p-2.5 text-primary-foreground shadow-sm">
              <BarChart3 className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Directors Report
                </h1>
                {reportQuery.isFetching && <Badge variant="secondary">Updating</Badge>}
              </div>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
                Branch and user performance with unique branch totals, grand totals,
                comparisons and Excel export.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => reportQuery.refetch()}
              disabled={reportQuery.isFetching}
            >
              <RefreshCw
                className={`mr-2 size-4 ${reportQuery.isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button type="button" onClick={exportExcel} disabled={!data || exporting}>
              {exporting ? (
                <RefreshCw className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Export Excel
            </Button>
          </div>
        </div>

        {exportError && (
          <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {exportError}
          </p>
        )}
      </header>

      <DirectorReportFilterSheet
        value={appliedFilters}
        options={data?.filterOptions}
        isLoading={reportQuery.isFetching}
        onApply={setAppliedFilters}
      />

      {reportQuery.isLoading && (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
          Loading Directors Report…
        </div>
      )}

      {reportQuery.isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-destructive">
          {reportQuery.error instanceof Error
            ? reportQuery.error.message
            : "Failed to load Directors Report."}
        </div>
      )}

      {data && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 2xl:grid-cols-10">
            <SummaryCard label="Walk-ins" value={integerFormat.format(data.summary.totalWalkins)} />
            <SummaryCard label="Walk-ins Added" value={integerFormat.format(data.summary.leadsAdded)} />
            <SummaryCard label="Applications" value={integerFormat.format(data.summary.students)} />
            <SummaryCard label="Uni Applications" value={integerFormat.format(data.summary.applications)} />
            <SummaryCard label="Visa Approved" value={integerFormat.format(data.summary.visaApproved)} tone="success" />
            <SummaryCard label="Loan Logins" value={integerFormat.format(data.summary.loanLogins)} />
            <SummaryCard label="Loan Approved" value={integerFormat.format(data.summary.loanApproved)} tone="success" />
            <SummaryCard label="Loan Approval" value={`${numberFormat.format(data.summary.loanConversionPercentage)}%`} tone="success" />
            <SummaryCard label="Walk-in Conversion" value={`${numberFormat.format(data.summary.leadToStudentConversionPercentage)}%`} />
            <SummaryCard label="Target Completion" value={`${numberFormat.format(data.summary.targetCompletionPercentage)}%`} tone="warning" />
          </section>

          <nav className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3 text-xs shadow-sm">
            {[
              ["#all-time-report", "Overall"],
              ["#today-report", "Today"],
              ["#weekly-report", "Weekly"],
              ["#month-report", "Current Month"],
              ["#intake-report", "Intake-wise"],
              ["#week-comparison", "Week Comparison"],
              ["#month-comparison", "Month Comparison"],
              ["#intake-comparison", "Intake Comparison"],
              ["#walk-in-details", "Walk-in Details"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={(event) => {
                  event.preventDefault();
                  window.history.pushState(null, "", href);
                  window.dispatchEvent(new Event("hashchange"));
                }}
                className="rounded-lg bg-muted px-3 py-2 font-medium text-foreground transition-colors hover:bg-accent"
              >
                {label}
              </a>
            ))}
          </nav>

          <ReportTable
            id="all-time-report"
            title="Overall — Branch and User Performance"
            description="Complete historical performance using one shared ownership rule: latest assignee for open walk-ins, converted-by user for students, and fintech assignee for loan activity."
            rows={data.allTimeRows}
            totals={data.allTimeTotals}
            showAverages
          />

          <ReportTable
            id="today-report"
            title="Today — Branch and User Performance"
            description="Each record is credited once to its final responsible user, followed by a unique branch total and one grand total."
            rows={data.todayRows}
            totals={data.todayTotals}
            defaultOpen
          />

          <ReportTable
            id="weekly-report"
            title="Current Week — Date-wise Performance"
            description="Daily final-owner performance for the current Monday-to-Sunday week, with a unique branch total after every branch."
            rows={data.weeklyRows}
            totals={data.weeklyTotals}
            showPeriod
          />

          <ReportTable
            id="month-report"
            title="Current Month — Branch and User Performance"
            description="Monthly final-owner totals, conversion percentages, targets and weekly averages with unique branch totals."
            rows={data.currentMonthRows}
            totals={data.currentMonthTotals}
            showAverages
          />

          <ReportTable
            id="intake-report"
            title="Intake-wise Performance"
            description="Intake, branch and final-owner performance with intake-specific branch totals and a final grand total."
            rows={data.intakeWiseRows}
            totals={data.intakeWiseTotals}
            showIntake
          />

          <div className="space-y-5">
            <ComparisonTable
              id="week-comparison"
              title="Current Week vs Previous Week"
              description="Both report modules use the same final-owner resolver, so creator and assignment history never duplicate or move the same record between reports."
              rows={data.weekComparison}
            />
            <ComparisonTable
              id="month-comparison"
              title="Current Month vs Previous Month"
              description="Month-over-month movement based on actual branch totals."
              rows={data.monthComparison}
            />
            <IntakeComparisonTable rows={data.intakeComparison} />
          </div>

          <section
            id="walk-in-details"
            className="scroll-mt-24 overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          >
            <AccordionHeader
              title="Walk-in Details"
              description="Shows the single owner used at each stage: latest walk-in assignee, converted-by user, or loan/fintech owner."
              isOpen={walkInDetailsAccordion.isOpen}
              onToggle={() =>
                walkInDetailsAccordion.setIsOpen((current) => !current)
              }
              icon={<Users className="size-4 text-primary" />}
              meta={
                <Badge variant="secondary">
                  {data.leadDetails.length} records
                </Badge>
              }
            />

            {walkInDetailsAccordion.isOpen && (
              <div className="max-h-[560px] overflow-auto">
              <table className="min-w-[1350px] text-xs">
                <thead className="sticky top-0 z-10 bg-primary text-left text-primary-foreground">
                  <tr>
                    {[
                      "Walk-in No.",
                      "Branch",
                      "User",
                      "Application Name",
                      "Mobile",
                      "Source",
                      "Country",
                      "Intake",
                      "Status",
                      "Attribution",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="border-b border-r border-primary-foreground/20 px-4 py-3 font-semibold last:border-r-0"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.leadDetails.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="px-4 py-8 text-center text-muted-foreground">
                        No walk-in details found.
                      </td>
                    </tr>
                  ) : (
                    data.leadDetails.map((detail, index) => (
                      <tr
                        key={detail.rowId}
                        className={`${index % 2 === 0 ? "bg-card" : "bg-muted/20"} border-b border-border/60 hover:bg-accent/50`}
                      >
                        <td className="px-4 py-3 font-semibold text-foreground">{detail.leadNumber}</td>
                        <td className="px-4 py-3 text-foreground">{detail.branchName}</td>
                        <td className="px-4 py-3 font-medium text-foreground">{detail.counselorName}</td>
                        <td className="px-4 py-3 text-foreground">{detail.studentName}</td>
                        <td className="px-4 py-3 text-foreground">{detail.mobileNumber}</td>
                        <td className="px-4 py-3 text-foreground">{detail.source}</td>
                        <td className="px-4 py-3 text-foreground">{detail.preferredCountry}</td>
                        <td className="px-4 py-3 text-foreground">{detail.preferredIntake}</td>
                        <td className="px-4 py-3 text-foreground">{detail.status}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{detail.attribution}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            )}
          </section>
        </>
      )}

      {showScrollToTop && (
        <Button
          type="button"
          size="icon"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-0 z-[100] rounded-full shadow-lg"
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          <ArrowUp className="size-5" />
        </Button>
      )}
    </main>
  );
}
