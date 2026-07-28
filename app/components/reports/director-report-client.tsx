"use client";
import { Fragment, useEffect, useMemo, useState, } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, BarChart3, ChevronDown, Download, RefreshCw, SearchX, Target, TrendingDown, TrendingUp, } from "lucide-react";
import { DirectorReportFilterSheet } from "./DirectorReportFilterSheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_DIRECTOR_REPORT_FILTERS, type DirectorReportComparisonRow, type DirectorReportData, type DirectorReportFilters, type DirectorReportRow, type DirectorReportTableTotals, } from "@/types/director-report";
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
};
type TableGroup = {
    key: string;
    rows: DirectorReportRow[];
    total: DirectorReportRow;
};
type IntakeTableGroup = {
    key: string;
    name: string;
    rows: DirectorReportRow[];
    branchTotals: DirectorReportRow[];
};
type MutableIntakeGroup = {
    key: string;
    name: string;
    rowMap: Map<string, DirectorReportRow>;
    branchTotalMap: Map<string, DirectorReportRow>;
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
/**
 * UI columns remain unchanged.
 */
const TODAY_COLUMNS: MetricColumn[] = [
    { key: "walkIns", label: "TODAY WALKIN", type: "number" },
    { key: "references", label: "REF/WALKIN", type: "number" },
    { key: "sameDayApplications", label: "SAME DAY APPS", type: "number" },
    { key: "oldWalkInApplications", label: "OLD WALKIN APPS", type: "number" },
    { key: "loanApplications", label: "LOAN LOGINS", type: "number" },
    { key: "loanApproved", label: "L/APPROVED", type: "number" },
    { key: "loanDisbursed", label: "DISBURSED", type: "number" },
    { key: "depositPaid", label: "DEPOSIT", type: "number" },
    { key: "casReceived", label: "CAS", type: "number" },
    { key: "visaApproved", label: "VISA", type: "number" },
];
const MONTHLY_WEEKLY_COLUMNS: MetricColumn[] = [
    { key: "walkIns", label: "TOTAL WALKIN", type: "number" },
    { key: "references", label: "REF/WALKIN", type: "number" },
    { key: "dropHoldDif", label: "DROP/HOLD", type: "number" },
    { key: "universityApplications", label: "UNI- APPS", type: "number" },
    { key: "loanApplications", label: "LOAN LOGINS", type: "number" },
    { key: "loanApproved", label: "L/APPROVED", type: "number" },
    { key: "loanDisbursed", label: "DISBURSED", type: "number" },
    { key: "depositPaid", label: "DEPOSIT", type: "number" },
    { key: "casReceived", label: "CAS", type: "number" },
    { key: "visaApproved", label: "VISA", type: "number" },
];
const INTAKE_COLUMNS: MetricColumn[] = [
    { key: "applications", label: "TOTAL APPS", type: "number" },
    { key: "references", label: "REF APPS", type: "number" },
    { key: "loanApplications", label: "LOAN LOGINS", type: "number" },
    { key: "outsideLoan", label: "OS-LOAN/O-FUND", type: "number" },
    { key: "dropHoldDif", label: "DROPS/hold/DIF", type: "number" },
    { key: "loanApproved", label: "L/APPROVED", type: "number" },
    { key: "loanDisbursed", label: "DISBURSED", type: "number" },
    { key: "depositPaid", label: "DEPOSIT", type: "number" },
    { key: "casApplied", label: "CAS APPLIED", type: "number" },
    { key: "casReceived", label: "CAS RECEIVED", type: "number" },
    { key: "visaApplied", label: "VISA APPLIED", type: "number" },
    { key: "visaApproved", label: "VISA RECEIVED", type: "number" },
];
const ROW_SCORE_KEYS = [
    "walkIns",
    "references",
    "applications",
    "sameDayApplications",
    "oldWalkInApplications",
    "universityApplications",
    "offers",
    "dropHoldDif",
    "loanApplications",
    "outsideLoan",
    "loanApproved",
    "loanDisbursed",
    "depositPaid",
    "casApplied",
    "casReceived",
    "visaApplied",
    "visaApproved",
    "target",
    "achieved",
    "appliedAmount",
    "sanctionedAmount",
    "disbursedAmount",
] as const satisfies readonly (keyof DirectorReportRow)[];
const MONTH_LOOKUP: Record<string, string> = {
    jan: "01",
    january: "01",
    feb: "02",
    february: "02",
    mar: "03",
    march: "03",
    apr: "04",
    april: "04",
    may: "05",
    jun: "06",
    june: "06",
    jul: "07",
    july: "07",
    aug: "08",
    august: "08",
    sep: "09",
    sept: "09",
    september: "09",
    oct: "10",
    october: "10",
    nov: "11",
    november: "11",
    dec: "12",
    december: "12",
};
function queryString(filters: DirectorReportFilters): string {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value) {
            params.set(key, String(value));
        }
    });
    return params.toString();
}
function formatValue(value: unknown, type: ValueType): string {
    if (type === "leads") {
        const leadNumbers = Array.isArray(value)
            ? value.filter((item): item is string => typeof item === "string")
            : [];
        if (leadNumbers.length === 0) {
            return "—";
        }
        const visible = leadNumbers
            .slice(0, 3)
            .join(", ");
        return leadNumbers.length > 3
            ? `${visible} +${leadNumbers.length - 3}`
            : visible;
    }
    const numericValue = Number(value ?? 0);
    if (type === "currency") {
        return currencyFormat.format(numericValue);
    }
    if (type === "percentage") {
        return `${numberFormat.format(numericValue)}%`;
    }
    return integerFormat.format(numericValue);
}
function normalizeText(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[_/\\-]+/g, " ")
        .replace(/[^\w\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
function getMonthYearKey(value: string): string | null {
    const normalized = normalizeText(value);
    const yearMonthMatch = normalized.match(/\b(20\d{2})\s+(0?[1-9]|1[0-2])\b/);
    if (yearMonthMatch) {
        return `month:${yearMonthMatch[1]}-${yearMonthMatch[2].padStart(2, "0")}`;
    }
    const monthYearMatch = normalized.match(/\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\b.*?\b(20\d{2})\b/);
    if (monthYearMatch) {
        const month = MONTH_LOOKUP[monthYearMatch[1]];
        if (month) {
            return `month:${monthYearMatch[2]}-${month}`;
        }
    }
    const yearThenMonthMatch = normalized.match(/\b(20\d{2})\b.*?\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\b/);
    if (yearThenMonthMatch) {
        const month = MONTH_LOOKUP[yearThenMonthMatch[2]];
        if (month) {
            return `month:${yearThenMonthMatch[1]}-${month}`;
        }
    }
    return null;
}
function getIntakeDisplayName(row: DirectorReportRow): string {
    return (row.intakeName?.trim() ||
        row.periodLabel?.trim() ||
        "Unknown Intake");
}
function getIntakeGroupKey(row: DirectorReportRow): string {
    const displayName = getIntakeDisplayName(row);
    const monthYearKey = getMonthYearKey(displayName);
    if (monthYearKey) {
        return monthYearKey;
    }
    const normalizedName = normalizeText(displayName);
    if (normalizedName) {
        return `name:${normalizedName}`;
    }
    if (row.intakeId) {
        return `id:${row.intakeId}`;
    }
    if (row.periodKey) {
        return `period:${row.periodKey}`;
    }
    return "unknown-intake";
}
function isAggregateIntakeName(value: string): boolean {
    const normalized = normalizeText(value);
    return (normalized === "all" ||
        normalized === "overall" ||
        normalized === "all time" ||
        normalized === "all intake" ||
        normalized === "all intakes" ||
        normalized === "all intake summary" ||
        normalized === "all intakes summary" ||
        normalized === "intake summary" ||
        normalized.includes("all intakes"));
}
function getIntakeEmployeeKey(row: DirectorReportRow): string {
    return [
        row.branchId || "no-branch",
        row.counselorId ||
            normalizeText(row.counselorName) ||
            row.rowId,
    ].join(":");
}
function getIntakeBranchKey(row: DirectorReportRow): string {
    return (row.branchId ||
        normalizeText(row.branchName) ||
        row.rowId);
}
function getRowMetricScore(row: DirectorReportRow): number {
    let score = 0;
    for (const key of ROW_SCORE_KEYS) {
        score += Math.abs(Number(row[key] ?? 0));
    }
    score += row.leadNumbers?.length ?? 0;
    return score;
}
function keepBestRow(map: Map<string, DirectorReportRow>, key: string, candidate: DirectorReportRow) {
    const existing = map.get(key);
    if (!existing ||
        getRowMetricScore(candidate) >
            getRowMetricScore(existing)) {
        map.set(key, candidate);
    }
}
const ADDITIVE_ROW_KEYS = [
    "walkIns",
    "references",
    "applications",
    "sameDayApplications",
    "oldWalkInApplications",
    "universityApplications",
    "offers",
    "dropHoldDif",
    "loanApplications",
    "outsideLoan",
    "loanApproved",
    "loanDisbursed",
    "depositPaid",
    "casApplied",
    "casReceived",
    "visaApplied",
    "visaApproved",
    "target",
    "achieved",
    "appliedAmount",
    "sanctionedAmount",
    "disbursedAmount",
    "avgWeeklyWalkIns",
    "avgWeeklyApplications",
    "avgWeeklyUniversityApplications",
    "avgWeeklyLoanApplications",
    "avgWeeklyLoanApproved",
    "avgWeeklyVisaApproved",
] as const satisfies readonly (keyof DirectorReportRow)[];
function createEmptyDirectorRow(fallbackName: string): DirectorReportRow {
    return {
        rowId: `empty:${normalizeText(fallbackName) || "total"}`,
        periodKey: "",
        periodLabel: "",
        branchId: "",
        branchName: fallbackName,
        counselorId: "",
        counselorName: "All Users",
        intakeId: null,
        intakeName: null,
        leadNumbers: [],
        avgWeeklyWalkIns: 0,
        avgWeeklyApplications: 0,
        avgWeeklyUniversityApplications: 0,
        avgWeeklyLoanApplications: 0,
        avgWeeklyLoanApproved: 0,
        avgWeeklyVisaApproved: 0,
        walkIns: 0,
        references: 0,
        applications: 0,
        sameDayApplications: 0,
        oldWalkInApplications: 0,
        universityApplications: 0,
        offers: 0,
        dropHoldDif: 0,
        loanApplications: 0,
        outsideLoan: 0,
        loanApproved: 0,
        loanDisbursed: 0,
        depositPaid: 0,
        casApplied: 0,
        casReceived: 0,
        visaApplied: 0,
        visaApproved: 0,
        target: 0,
        achieved: 0,
        appliedAmount: 0,
        sanctionedAmount: 0,
        disbursedAmount: 0,
        leadToStudentConversionPercentage: 0,
        universityApplicationConversionPercentage: 0,
        visaConversionPercentage: 0,
        loanConversionPercentage: 0,
        targetCompletionPercentage: 0,
    };
}
function calculatePercentage(part: number, whole: number): number {
    return whole > 0
        ? Number(((part / whole) * 100).toFixed(1))
        : 0;
}
function sumDirectorRows(rows: DirectorReportRow[], fallbackName: string): DirectorReportRow {
    const total = createEmptyDirectorRow(fallbackName);
    if (rows.length === 0) {
        return total;
    }
    const first = rows[0];
    total.rowId = `total:${normalizeText(fallbackName) || "grand"}`;
    total.periodKey = first.periodKey;
    total.periodLabel = first.periodLabel;
    total.intakeId = first.intakeId ?? null;
    total.intakeName = first.intakeName ?? null;
    const mutableTotal = total as unknown as Record<string, number>;
    const leadNumbers = new Set<string>();
    for (const row of rows) {
        const mutableRow = row as unknown as Record<string, number>;
        for (const key of ADDITIVE_ROW_KEYS) {
            mutableTotal[key] += Number(mutableRow[key] ?? 0);
        }
        for (const leadNumber of row.leadNumbers ?? []) {
            if (leadNumber) {
                leadNumbers.add(leadNumber);
            }
        }
    }
    total.leadNumbers = [...leadNumbers].sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
    total.leadToStudentConversionPercentage = calculatePercentage(total.applications, total.walkIns);
    total.universityApplicationConversionPercentage = calculatePercentage(total.universityApplications, total.applications);
    total.visaConversionPercentage = calculatePercentage(total.visaApproved, total.applications);
    total.loanConversionPercentage = calculatePercentage(total.loanApproved, total.loanApplications);
    total.targetCompletionPercentage = calculatePercentage(total.achieved, total.target);
    return total;
}
function createMissingBranchTotals(rows: DirectorReportRow[], existingTotals: DirectorReportRow[]): DirectorReportRow[] {
    const totalMap = new Map<string, DirectorReportRow>();
    for (const total of existingTotals) {
        keepBestRow(totalMap, getIntakeBranchKey(total), total);
    }
    const rowsByBranch = new Map<string, DirectorReportRow[]>();
    for (const row of rows) {
        const branchKey = getIntakeBranchKey(row);
        const branchRows = rowsByBranch.get(branchKey) ?? [];
        branchRows.push(row);
        rowsByBranch.set(branchKey, branchRows);
    }
    for (const [branchKey, branchRows,] of rowsByBranch) {
        if (totalMap.has(branchKey)) {
            continue;
        }
        const firstRow = branchRows[0];
        const calculated = sumDirectorRows(branchRows, firstRow.branchName ||
            "Unknown Branch");
        calculated.branchId =
            firstRow.branchId;
        calculated.branchName =
            firstRow.branchName ||
                "Unknown Branch";
        calculated.intakeId =
            firstRow.intakeId ?? null;
        calculated.intakeName =
            firstRow.intakeName ?? null;
        totalMap.set(branchKey, calculated);
    }
    return Array.from(totalMap.values()).sort((left, right) => left.branchName.localeCompare(right.branchName));
}
async function fetchDirectorReport(filters: DirectorReportFilters): Promise<DirectorReportData> {
    const response = await fetch(`/api/reports/directors?${queryString(filters)}`, {
        cache: "no-store",
    });
    const payload = (await response
        .json()
        .catch(() => null)) as ApiResponse<DirectorReportData> | DirectorReportData | null;
    if (!response.ok) {
        throw new Error(payload &&
            "message" in payload &&
            payload.message
            ? payload.message
            : "Unable to fetch Directors Report");
    }
    if (!payload) {
        throw new Error("Directors Report returned an empty response");
    }
    return "data" in payload && payload.data
        ? payload.data
        : (payload as DirectorReportData);
}
function AccordionHeader({ title, isOpen, onToggle, }: {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
}) {
    return (<button type="button" onClick={onToggle} aria-expanded={isOpen} className="flex w-full items-center justify-between rounded-t-lg border-b border-border/60 bg-muted px-4 py-3 text-left transition-colors hover:bg-muted/80">
      <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">
        {title}
      </h2>

      <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}/>
    </button>);
}
function useHashAwareAccordion(id: string, defaultOpen = false) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    useEffect(() => {
        const openFromHash = () => {
            if (window.location.hash !== `#${id}`) {
                return;
            }
            setIsOpen(true);
            window.requestAnimationFrame(() => {
                document
                    .getElementById(id)
                    ?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            });
        };
        openFromHash();
        window.addEventListener("hashchange", openFromHash);
        return () => {
            window.removeEventListener("hashchange", openFromHash);
        };
    }, [id]);
    return {
        isOpen,
        setIsOpen,
    };
}
const COL_WIDTHS = {
    branch: 40,
    sno: 50,
    user: 220,
} as const;
const LEFT_BRANCH = 0;
const LEFT_SNO = COL_WIDTHS.branch;
const LEFT_USER = COL_WIDTHS.branch + COL_WIDTHS.sno;
function ExcelReportTable({ id, superHeaderDate, superHeaderTitle, columns, rows, totals, defaultOpen = false, }: {
    id: string;
    superHeaderDate: string;
    superHeaderTitle: string;
    columns: MetricColumn[];
    rows: DirectorReportRow[];
    totals: DirectorReportTableTotals;
    defaultOpen?: boolean;
}) {
    const { isOpen, setIsOpen } = useHashAwareAccordion(id, defaultOpen);
    const tableGroups = useMemo<TableGroup[]>(() => {
        const map = new Map<string, TableGroup>();
        for (const total of totals.branchRows) {
            const key = total.branchId ||
                normalizeText(total.branchName);
            map.set(key, {
                key,
                rows: [],
                total,
            });
        }
        for (const row of rows) {
            const key = row.branchId ||
                normalizeText(row.branchName);
            const current = map.get(key) ?? {
                key,
                rows: [],
                total: row,
            };
            current.rows.push(row);
            map.set(key, current);
        }
        return Array.from(map.values()).sort((left, right) => left.total.branchName.localeCompare(right.total.branchName));
    }, [rows, totals.branchRows]);
    return (<section id={id} className="mb-8 w-full scroll-mt-20 rounded-lg border border-border/60 bg-card shadow-sm transition-all">
      <AccordionHeader title={superHeaderTitle} isOpen={isOpen} onToggle={() => setIsOpen((current) => !current)}/>

      {isOpen && (<div className="w-full overflow-x-auto rounded-b-lg bg-card [scrollbar-gutter:stable]">
          <table className="w-full table-auto border-collapse whitespace-nowrap text-[11px]">
            <thead className="sticky top-0 z-30 shadow-sm">
              <tr className="bg-red-600 text-white">
                <th colSpan={3} style={{
                left: LEFT_BRANCH,
                position: "sticky",
                zIndex: 40,
            }} className="border-b border-r border-red-700 bg-red-600 px-3 py-2 text-left font-bold uppercase tracking-wider shadow-[4px_0_12px_-8px_rgba(0,0,0,0.15)]">
                  {superHeaderDate}
                </th>

                <th colSpan={columns.length} className="border-b border-red-700 bg-red-600 px-3 py-2 text-center font-bold uppercase tracking-widest">
                  {superHeaderTitle}
                </th>
              </tr>

              <tr className="bg-card text-foreground">
                <th colSpan={3} style={{
                left: LEFT_BRANCH,
                position: "sticky",
                zIndex: 40,
            }} className="border-b border-r border-border/60 bg-card px-3 py-2 text-center font-bold uppercase shadow-[4px_0_12px_-8px_rgba(0,0,0,0.1)]">
                  GRAND TOTAL
                </th>

                {columns.map((column) => (<th key={`gt-${String(column.key)}`} className="border-b border-border/60 bg-card px-3 py-2 text-center font-bold text-red-600 dark:text-red-400">
                    {formatValue(totals.grandTotal[column.key], column.type)}
                  </th>))}
              </tr>

              <tr className="bg-muted text-foreground">
                <th style={{
                left: LEFT_BRANCH,
                width: COL_WIDTHS.branch,
                minWidth: COL_WIDTHS.branch,
                position: "sticky",
                zIndex: 40,
            }} className="border-b border-border/60 bg-muted px-1 py-2 font-semibold"/>

                <th style={{
                left: LEFT_SNO,
                width: COL_WIDTHS.sno,
                minWidth: COL_WIDTHS.sno,
                position: "sticky",
                zIndex: 40,
            }} className="border-b border-border/60 bg-muted px-2 py-2 text-center font-semibold">
                  S.NO
                </th>

                <th style={{
                left: LEFT_USER,
                width: COL_WIDTHS.user,
                minWidth: COL_WIDTHS.user,
                position: "sticky",
                zIndex: 40,
            }} className="border-b border-r border-border/60 bg-muted px-3 py-2 text-left font-semibold shadow-[4px_0_12px_-8px_rgba(0,0,0,0.1)]">
                  EMPLOYEE NAME
                </th>

                {columns.map((column) => (<th key={`header-${String(column.key)}`} className="min-w-[90px] border-b border-border/60 bg-muted px-3 py-2 text-center font-semibold">
                    {column.label}
                  </th>))}
              </tr>
            </thead>

            <tbody>
              {tableGroups.length === 0 ? (<tr>
                  <td colSpan={columns.length + 3} className="bg-card px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3 text-muted-foreground">
                      <SearchX className="size-8 opacity-40"/>

                      <p className="text-sm">
                        No records found for
                        the selected filters.
                      </p>
                    </div>
                  </td>
                </tr>) : (tableGroups.map((group) => {
                const rowSpanCount = group.rows.length + 1;
                return (<Fragment key={group.key}>
                        {group.rows.map((row, index) => (<tr key={row.rowId} className="group bg-card transition-colors hover:bg-muted/50">
                              {index ===
                            0 && (<td rowSpan={rowSpanCount} style={{
                                left: LEFT_BRANCH,
                                width: COL_WIDTHS.branch,
                                minWidth: COL_WIDTHS.branch,
                                position: "sticky",
                                zIndex: 20,
                            }} className="border-b border-r border-border/50 bg-muted/30 p-1 text-center align-middle">
                                  <div style={{
                                writingMode: "vertical-rl",
                                transform: "rotate(180deg)",
                            }} className="mx-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {group
                                .total
                                .branchName}
                                  </div>
                                </td>)}

                              <td style={{
                            left: LEFT_SNO,
                            width: COL_WIDTHS.sno,
                            minWidth: COL_WIDTHS.sno,
                            position: "sticky",
                            zIndex: 20,
                        }} className="border-b border-border/40 bg-card px-2 py-2 text-center font-medium text-muted-foreground group-hover:bg-muted/50">
                                {index +
                            1}
                              </td>

                              <td style={{
                            left: LEFT_USER,
                            width: COL_WIDTHS.user,
                            minWidth: COL_WIDTHS.user,
                            position: "sticky",
                            zIndex: 20,
                        }} className="border-b border-r border-border/40 bg-card px-3 py-2 text-left font-semibold text-foreground shadow-[4px_0_12px_-8px_rgba(0,0,0,0.1)] group-hover:bg-muted/50">
                                {row.counselorName}
                              </td>

                              {columns.map((column) => (<td key={`cell-${row.rowId}-${String(column.key)}`} className="border-b border-border/40 px-2 py-2 text-center tabular-nums text-muted-foreground group-hover:text-foreground">
                                    {formatValue(row[column
                                .key], column.type)}
                                  </td>))}
                            </tr>))}

                        <tr className="bg-muted/60 font-semibold">
                          {group.rows
                        .length ===
                        0 && (<td style={{
                            left: LEFT_BRANCH,
                            width: COL_WIDTHS.branch,
                            minWidth: COL_WIDTHS.branch,
                            position: "sticky",
                            zIndex: 20,
                        }} className="border-b border-r border-border/50 bg-muted p-1 text-center align-middle">
                              <div style={{
                            writingMode: "vertical-rl",
                            transform: "rotate(180deg)",
                        }} className="mx-auto text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                {group
                            .total
                            .branchName}
                              </div>
                            </td>)}

                          <td style={{
                        left: LEFT_SNO,
                        width: COL_WIDTHS.sno,
                        minWidth: COL_WIDTHS.sno,
                        position: "sticky",
                        zIndex: 20,
                    }} className="border-b border-border/50 bg-muted px-2 py-2"/>

                          <td style={{
                        left: LEFT_USER,
                        width: COL_WIDTHS.user,
                        minWidth: COL_WIDTHS.user,
                        position: "sticky",
                        zIndex: 20,
                    }} className="border-b border-r border-border/50 bg-muted px-3 py-2 text-center uppercase tracking-wide text-foreground shadow-[4px_0_12px_-8px_rgba(0,0,0,0.1)]">
                            TOTAL
                          </td>

                          {columns.map((column) => (<td key={`total-${group.key}-${String(column.key)}`} className="border-b border-border/50 px-2 py-2 text-center tabular-nums text-foreground">
                                {formatValue(group
                            .total[column
                            .key], column.type)}
                              </td>))}
                        </tr>
                      </Fragment>);
            }))}
            </tbody>
          </table>
        </div>)}
    </section>);
}
function comparisonTone(value: number): string {
    if (value > 0) {
        return "text-emerald-600 dark:text-emerald-400";
    }
    if (value < 0) {
        return "text-red-600 dark:text-red-400";
    }
    return "text-muted-foreground";
}
function formatComparisonValue(value: number, type: DirectorReportComparisonRow["valueType"]): string {
    if (type === "currency") {
        return currencyFormat.format(value);
    }
    if (type === "percentage") {
        return `${numberFormat.format(value)}%`;
    }
    return integerFormat.format(value);
}
function ComparisonTable({ id, title, rows, defaultOpen = false, }: {
    id: string;
    title: string;
    rows: DirectorReportComparisonRow[];
    defaultOpen?: boolean;
}) {
    const { isOpen, setIsOpen } = useHashAwareAccordion(id, defaultOpen);
    return (<section id={id} className="mb-6 w-full scroll-mt-20 rounded-lg border border-border/60 bg-card shadow-sm transition-all">
      <AccordionHeader title={title} isOpen={isOpen} onToggle={() => setIsOpen((current) => !current)}/>

      {isOpen && (<div className="w-full overflow-x-auto rounded-b-lg bg-card">
          <table className="w-full border-collapse whitespace-nowrap text-xs">
            <thead className="bg-red-600 text-white">
              <tr>
                <th className="border-b border-red-700 px-4 py-2.5 text-left font-semibold uppercase tracking-wider">
                  Metric
                </th>

                <th className="border-b border-red-700 px-4 py-2.5 text-right font-semibold uppercase tracking-wider">
                  Current
                </th>

                <th className="border-b border-red-700 px-4 py-2.5 text-right font-semibold uppercase tracking-wider">
                  Previous
                </th>

                <th className="border-b border-red-700 px-4 py-2.5 text-right font-semibold uppercase tracking-wider">
                  Difference
                </th>

                <th className="border-b border-red-700 px-4 py-2.5 text-right font-semibold uppercase tracking-wider">
                  Change
                </th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 ? (<tr>
                  <td colSpan={5} className="bg-card px-4 py-8 text-center text-muted-foreground">
                    No comparison data
                    found.
                  </td>
                </tr>) : (rows.map((row) => (<tr key={row.rowId} className="border-b border-border/40 bg-card transition-colors last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium uppercase tracking-wide text-foreground">
                      {row.metric}
                    </td>

                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatComparisonValue(row.current, row.valueType)}
                    </td>

                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {formatComparisonValue(row.previous, row.valueType)}
                    </td>

                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${comparisonTone(row.difference)}`}>
                      {formatComparisonValue(row.difference, row.valueType)}
                    </td>

                    <td className={`px-4 py-3 text-right font-semibold tabular-nums ${comparisonTone(row.changePercentage)}`}>
                      <span className="inline-flex items-center justify-end gap-1.5">
                        {row.changePercentage >
                    0 ? (<TrendingUp className="size-3.5"/>) : row.changePercentage <
                    0 ? (<TrendingDown className="size-3.5"/>) : null}

                        {numberFormat.format(row.changePercentage)}
                        %
                      </span>
                    </td>
                  </tr>)))}
            </tbody>
          </table>
        </div>)}
    </section>);
}
export default function DirectorReportClient() {
    const [appliedFilters, setAppliedFilters,] = useState<DirectorReportFilters>(DEFAULT_DIRECTOR_REPORT_FILTERS);
    const [exporting, setExporting] = useState(false);
    const [exportError, setExportError,] = useState("");
    const [showScrollToTop, setShowScrollToTop,] = useState(false);
    const [activeHash, setActiveHash] = useState("#today-report");
    useEffect(() => {
        const handleScroll = () => setShowScrollToTop(window.scrollY > 500);
        handleScroll();
        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);
    useEffect(() => {
        const onHashChange = () => {
            const hash = window.location.hash;
            if (hash) {
                setActiveHash(hash);
            }
        };
        onHashChange();
        window.addEventListener("hashchange", onHashChange);
        return () => window.removeEventListener("hashchange", onHashChange);
    }, []);
    const reportQuery = useQuery<DirectorReportData>({
        queryKey: [
            "director-report",
            appliedFilters,
        ],
        queryFn: () => fetchDirectorReport(appliedFilters),
        placeholderData: (previous) => previous,
    });
    const data = reportQuery.data;
    const intakes = useMemo<IntakeTableGroup[]>(() => {
        if (!data) {
            return [];
        }
        const currentMonthKey = getMonthYearKey(data.currentMonthTotals.grandTotal.periodLabel) ??
            getMonthYearKey(new Intl.DateTimeFormat("en-IN", {
                timeZone: "Asia/Kolkata",
                month: "long",
                year: "numeric",
            }).format(new Date()));
        const groupMap = new Map<string, MutableIntakeGroup>();
        const getOrCreateGroup = (row: DirectorReportRow): MutableIntakeGroup | null => {
            const displayName = getIntakeDisplayName(row);
            const key = getIntakeGroupKey(row);
            if (isAggregateIntakeName(displayName)) {
                return null;
            }
            // Avoid repeating the current calendar month inside All Intakes.
            // When the user explicitly filters an intake, preserve that selection.
            if (!appliedFilters.intakeId && currentMonthKey && key === currentMonthKey) {
                return null;
            }
            const existing = groupMap.get(key);
            if (existing) {
                return existing;
            }
            const created: MutableIntakeGroup = {
                key,
                name: displayName,
                rowMap: new Map(),
                branchTotalMap: new Map(),
            };
            groupMap.set(key, created);
            return created;
        };
        for (const row of data.intakeWiseRows) {
            const group = getOrCreateGroup(row);
            if (!group) {
                continue;
            }
            keepBestRow(group.rowMap, getIntakeEmployeeKey(row), row);
        }
        for (const row of data.intakeWiseTotals.branchRows) {
            const group = getOrCreateGroup(row);
            if (!group) {
                continue;
            }
            keepBestRow(group.branchTotalMap, getIntakeBranchKey(row), row);
        }
        return [...groupMap.values()]
            .map((group) => {
            const rows = [...group.rowMap.values()].sort((left, right) => left.branchName.localeCompare(right.branchName) ||
                left.counselorName.localeCompare(right.counselorName));
            const branchTotals = createMissingBranchTotals(rows, [...group.branchTotalMap.values()]);
            return {
                key: group.key,
                name: group.name,
                rows,
                branchTotals,
            };
        })
            .filter((group) => group.rows.length > 0 || group.branchTotals.length > 0)
            .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));
    }, [appliedFilters.intakeId, data]);
    const exportExcel = async () => {
        try {
            setExporting(true);
            setExportError("");
            const response = await fetch(`/api/reports/directors/export?${queryString(appliedFilters)}`, {
                cache: "no-store",
            });
            if (!response.ok) {
                const payload = (await response
                    .json()
                    .catch(() => null)) as {
                    message?: string;
                } | null;
                throw new Error(payload?.message ??
                    "Unable to export Directors Report");
            }
            const blob = await response.blob();
            const disposition = response.headers.get("Content-Disposition") ?? "";
            const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
            const filename = filenameMatch?.[1] ??
                `vsource-directors-report-${new Date()
                    .toISOString()
                    .slice(0, 10)}.xlsx`;
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        }
        catch (error) {
            setExportError(error instanceof Error
                ? error.message
                : "Unable to export report");
        }
        finally {
            setExporting(false);
        }
    };
    const tabs = [
        {
            href: "#today-report",
            label: "Today",
        },
        {
            href: "#weekly-report",
            label: "Weekly",
        },
        {
            href: "#month-report",
            label: "Monthly",
        },
        {
            href: "#intake-report",
            label: "Intake",
        },
        {
            href: "#all-time-report",
            label: "Overall",
        },
        {
            href: "#comparisons",
            label: "Comparisons",
        },
    ];
    const weeklyHeaderDate = data?.weeklyTotals
        ?.grandTotal?.periodLabel ||
        "WEEKLY REPORT";
    const monthlyHeaderDate = data?.currentMonthTotals
        ?.grandTotal?.periodLabel ||
        `${new Date()
            .toLocaleString("default", {
            month: "long",
        })
            .toUpperCase()} REPORT`;
    return (<main className="min-h-screen w-full bg-background p-2 text-foreground sm:p-4">
      <header className="relative mb-5 overflow-hidden rounded-lg border border-border/60 bg-card p-4 shadow-sm sm:p-5">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 via-transparent to-transparent opacity-100"/>

        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-lg bg-red-600/10 text-red-600 ring-1 ring-red-600/20">
              <BarChart3 className="size-6"/>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold uppercase tracking-tight text-foreground">
                  Directors Report
                </h1>

                {reportQuery.isFetching && (<Badge variant="secondary" className="animate-pulse text-[10px] uppercase shadow-none">
                    Updating...
                  </Badge>)}
              </div>

              <p className="mt-1 max-w-3xl text-xs leading-relaxed text-muted-foreground">
                Branch and user performance with
                accurate branch totals, grand
                totals, and real-time export.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => reportQuery.refetch()} disabled={reportQuery.isFetching} className="h-9 border-border/60 px-4 text-xs font-bold uppercase tracking-wide hover:bg-muted">
              <RefreshCw className={`mr-2 size-3.5 ${reportQuery.isFetching
            ? "animate-spin"
            : ""}`}/>

              Refresh
            </Button>

            <Button type="button" size="sm" onClick={exportExcel} disabled={!data || exporting} className="h-9 bg-red-600 px-4 text-xs font-bold uppercase tracking-wide text-white shadow-sm hover:bg-red-700">
              {exporting ? (<RefreshCw className="mr-2 size-3.5 animate-spin"/>) : (<Download className="mr-2 size-3.5"/>)}

              Export Excel
            </Button>
          </div>
        </div>

        {exportError && (<div className="relative mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
            {exportError}
          </div>)}
      </header>

      <div className="w-full">
        <DirectorReportFilterSheet value={appliedFilters} options={data?.filterOptions} isLoading={reportQuery.isFetching} onApply={setAppliedFilters}/>

        {reportQuery.isLoading && (<div className="my-5 flex h-40 flex-col items-center justify-center rounded-lg border border-border/60 bg-card text-muted-foreground shadow-sm">
            <RefreshCw className="mb-3 size-6 animate-spin text-red-600/50"/>

            <p className="text-sm font-semibold uppercase tracking-widest">
              Loading Data...
            </p>
          </div>)}

        {reportQuery.isError && (<div className="my-5 flex h-40 flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center text-destructive shadow-sm">
            <Target className="mb-3 size-6 opacity-50"/>

            <p className="text-sm font-semibold uppercase tracking-wide">
              {reportQuery.error instanceof
                Error
                ? reportQuery.error.message
                : "Failed to load report"}
            </p>
          </div>)}

        {data && (<>
            <nav className="sticky top-0 z-30 mb-6 flex overflow-x-auto rounded-lg border border-border/60 bg-background/95 p-1 shadow-sm backdrop-blur hide-scrollbar">
              <div className="flex min-w-max gap-1">
                {tabs.map(({ href, label }) => {
                const isActive = activeHash === href;
                return (<a key={href} href={href} onClick={(event) => {
                        event.preventDefault();
                        window.history.pushState(null, "", href);
                        window.dispatchEvent(new Event("hashchange"));
                    }} className={`rounded px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-200 ${isActive
                        ? "bg-red-600 text-white shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                        {label}
                      </a>);
            })}
              </div>
            </nav>

            <ExcelReportTable id="today-report" superHeaderDate={new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
            })} superHeaderTitle="TODAYS WORK" columns={TODAY_COLUMNS} rows={data.todayRows} totals={data.todayTotals} defaultOpen/>

            <ExcelReportTable id="weekly-report" superHeaderDate={weeklyHeaderDate} superHeaderTitle="CURRENT WEEK PERFORMANCE" columns={MONTHLY_WEEKLY_COLUMNS} rows={data.weeklyRows} totals={data.weeklyTotals}/>

            <ExcelReportTable id="month-report" superHeaderDate={monthlyHeaderDate} superHeaderTitle={`${new Date()
                .toLocaleString("default", {
                month: "long",
            })
                .toUpperCase()} MONTH REPORT`} columns={MONTHLY_WEEKLY_COLUMNS} rows={data.currentMonthRows} totals={data.currentMonthTotals}/>

            <div id="intake-report" className="scroll-mt-20">
              {intakes.length === 0 ? (<ExcelReportTable id="intake-empty" superHeaderDate="INTAKE REPORT" superHeaderTitle="INTAKE SUMMARY" columns={INTAKE_COLUMNS} rows={[]} totals={{
                    branchRows: [],
                    grandTotal: sumDirectorRows([], "Grand Total"),
                }}/>) : (<div className="space-y-6">
                  {intakes.map((intake, index) => {
                    const grandTotal = sumDirectorRows(intake.branchTotals, "Grand Total");
                    grandTotal.intakeName =
                        intake.name;
                    return (<ExcelReportTable key={intake.key} id={`intake-section-${index}`} superHeaderDate="INTAKE REPORT" superHeaderTitle={`${intake.name.toUpperCase()} SUMMARY`} columns={INTAKE_COLUMNS} rows={intake.rows} totals={{
                            branchRows: intake.branchTotals,
                            grandTotal,
                        }} defaultOpen/>);
                })}
                </div>)}
            </div>

            <div className="mt-8">
              <ExcelReportTable id="all-time-report" superHeaderDate="OVERALL" superHeaderTitle="ALL TIME PERFORMANCE" columns={MONTHLY_WEEKLY_COLUMNS} rows={data.allTimeRows} totals={data.allTimeTotals}/>
            </div>

            <div id="comparisons" className="mt-8 scroll-mt-20 pt-6">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold uppercase tracking-wider text-foreground">
                <Target className="size-5 text-red-600"/>

                Performance Comparisons
              </h2>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                <ComparisonTable id="week-comparison" title="WEEK OVER WEEK" rows={data.weekComparison}/>

                <ComparisonTable id="month-comparison" title="MONTH OVER MONTH" rows={data.monthComparison}/>
              </div>
            </div>
          </>)}
      </div>

      {showScrollToTop && (<Button type="button" size="icon" onClick={() => window.scrollTo({
                top: 0,
                behavior: "smooth",
            })} className="fixed bottom-6 right-6 z-40 h-11 w-11 rounded-full bg-red-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-red-700" aria-label="Scroll to top" title="Scroll to top">
          <ArrowUp className="size-5"/>
        </Button>)}
    </main>);
}