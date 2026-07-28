import type { Prisma } from "@/generated/prisma/client";
import { addReportDays, currentIstDayStart, dateInReportRange, reportRangeLabel, resolveReportDateRange, type ReportDateRange, } from "@/lib/report-date-range";
import { getSharedReportFilterOptions, loadReportDataset, type CommonReportFilters, type ReportAccessScope, type ReportDataset, type ReportLead, type ReportMetricEvent, type ReportStudent, } from "@/lib/report-data";
import { reportPercentage, resolveStudentConversionDate } from "@/lib/report-metric-rules";
import db from "@/lib/prisma";
import { resolveFinalLeadOwner, resolveFinalStudentOwner } from "@/lib/report-owner";
import type { DirectorReportComparisonRow, DirectorReportData, DirectorReportFilterOptions, DirectorReportFilters, DirectorReportIntakeComparisonRow, DirectorReportLeadDetail, DirectorReportRow, DirectorReportSummary, DirectorReportTableTotals, } from "@/types/director-report";
const REPORT_ACCESS: ReportAccessScope = { kind: "all" };
const BRANCH_TOTAL_ID = "__branch_total__";
const GRAND_TOTAL_ID = "__grand_total__";
const clean = (value: unknown) => String(value ?? "").trim();
const round = (value: number) => Number(value.toFixed(1));
const emptySummary = (): DirectorReportSummary => ({
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
});
const additiveKeys = [
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
] as const;
function finalizeSummary<T extends DirectorReportSummary>(summary: T): T {
    summary.achieved = summary.visaApproved;
    summary.leadToStudentConversionPercentage = reportPercentage(summary.applications, summary.walkIns);
    summary.universityApplicationConversionPercentage = reportPercentage(summary.universityApplications, summary.applications);
    summary.visaConversionPercentage = reportPercentage(summary.visaApproved, summary.applications);
    summary.loanConversionPercentage = reportPercentage(summary.loanApproved, summary.loanApplications);
    summary.targetCompletionPercentage = reportPercentage(summary.achieved, summary.target);
    return summary;
}
function addSummary(target: DirectorReportSummary, source: DirectorReportSummary) {
    for (const key of additiveKeys)
        target[key] += source[key];
}
function addEvent(target: DirectorReportSummary, event: ReportMetricEvent) {
    target.walkIns += event.values.walkIns;
    target.references += event.values.references;
    target.applications += event.values.applications;
    target.sameDayApplications += event.values.sameDayApplications;
    target.oldWalkInApplications += event.values.oldWalkInApplications;
    target.universityApplications += event.values.universityApplications;
    target.offers += event.values.offers;
    target.dropHoldDif += event.values.dropHoldDif;
    target.loanApplications += event.values.loanApplications;
    target.outsideLoan += event.values.outsideLoan;
    target.loanApproved += event.values.loanApproved;
    target.loanDisbursed += event.values.loanDisbursed;
    target.depositPaid += event.values.depositPaid;
    target.casApplied += event.values.casApplied;
    target.casReceived += event.values.casReceived;
    target.visaApplied += event.values.visaApplied;
    target.visaApproved += event.values.visaApproved;
    target.appliedAmount += event.values.appliedAmount;
    target.sanctionedAmount += event.values.sanctionedAmount;
    target.disbursedAmount += event.values.disbursedAmount;
}
function dateKey(date: Date) {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(date);
}
function dateLabel(date: Date) {
    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "2-digit",
        month: "short",
    }).format(date);
}
function monthLabel(date: Date) {
    return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "long",
        year: "numeric",
    }).format(date);
}
const INTAKE_MONTHS: Record<string, string> = {
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
function normalizeIntakeName(value: string | null | undefined) {
    return clean(value)
        .toLowerCase()
        .replace(/[_/\\-]+/g, " ")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
function intakeMonthKey(value: string | null | undefined): string | null {
    const normalized = normalizeIntakeName(value);
    if (!normalized) {
        return null;
    }
    const yearMonth = normalized.match(/\b(20\d{2})\s+(0?[1-9]|1[0-2])\b/);
    if (yearMonth) {
        return `${yearMonth[1]}-${yearMonth[2].padStart(2, "0")}`;
    }
    const monthYear = normalized.match(/\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\b.*?\b(20\d{2})\b/);
    if (monthYear) {
        const month = INTAKE_MONTHS[monthYear[1]];
        return month ? `${monthYear[2]}-${month}` : null;
    }
    const yearThenMonth = normalized.match(/\b(20\d{2})\b.*?\b(january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul|august|aug|september|sept|sep|october|oct|november|nov|december|dec)\b/);
    if (yearThenMonth) {
        const month = INTAKE_MONTHS[yearThenMonth[2]];
        return month ? `${yearThenMonth[1]}-${month}` : null;
    }
    return null;
}
function intakeIdentity(intakeId: string | null | undefined, intakeName: string | null | undefined) {
    const displayName = clean(intakeName) || "Not Set";
    const monthKey = intakeMonthKey(displayName);
    const normalizedName = normalizeIntakeName(displayName);
    return {
        id: clean(intakeId) || "not-set",
        name: displayName,
        key: monthKey
            ? `month:${monthKey}`
            : normalizedName
                ? `name:${normalizedName}`
                : clean(intakeId)
                    ? `id:${clean(intakeId)}`
                    : "not-set",
        monthKey,
    };
}
function isAggregateIntake(value: string | null | undefined) {
    const normalized = normalizeIntakeName(value);
    return (normalized === "all" ||
        normalized === "overall" ||
        normalized === "all time" ||
        normalized === "all intake" ||
        normalized === "all intakes" ||
        normalized.includes("all intakes"));
}
function normalizeTargets(targets: TargetRow[]) {
    const map = new Map<string, TargetRow>();
    for (const target of targets) {
        const identity = intakeIdentity(target.intakeId, target.intakeName);
        const key = `${identity.key}:${target.branchId}:${target.counselorId}`;
        const existing = map.get(key);
        if (existing) {
            existing.target += target.target;
            continue;
        }
        map.set(key, {
            ...target,
            intakeName: identity.name,
        });
    }
    return [...map.values()];
}
function startOfCurrentWeek(today: Date) {
    const shifted = new Date(today.getTime() + 5.5 * 60 * 60 * 1000);
    const weekday = shifted.getUTCDay();
    return addReportDays(today, -((weekday + 6) % 7));
}
type TargetRow = {
    branchId: string;
    branchName: string;
    counselorId: string;
    counselorName: string;
    intakeId: string;
    intakeName: string;
    target: number;
};
async function getTargets(filters: DirectorReportFilters): Promise<TargetRow[]> {
    const where: Prisma.CounsellorIntakeTargetWhereInput = {
        ...(filters.branchId && { branchId: filters.branchId }),
        ...(filters.counselorId && { counsellorId: filters.counselorId }),
        ...(filters.intakeId && { intakeId: filters.intakeId }),
    };
    const rows = await db.counsellorIntakeTarget.findMany({
        where,
        select: {
            branchId: true,
            counsellorId: true,
            intakeId: true,
            target: true,
            branch: { select: { name: true } },
            counsellor: { select: { name: true } },
            intake: { select: { name: true } },
        },
    });
    return rows.map((row) => ({
        branchId: row.branchId,
        branchName: row.branch.name,
        counselorId: row.counsellorId,
        counselorName: row.counsellor.name,
        intakeId: row.intakeId,
        intakeName: row.intake.name,
        target: row.target,
    }));
}
function commonFilters(filters: DirectorReportFilters): CommonReportFilters {
    return { ...filters, leadSource: filters.source };
}
function createRow(periodKey: string, periodLabel: string, branchId: string, branchName: string, counselorId: string, counselorName: string, intakeId: string | null = null, intakeName: string | null = null): DirectorReportRow {
    return {
        rowId: `${periodKey}:${intakeId ?? "all"}:${branchId}:${counselorId}`,
        periodKey,
        periodLabel,
        branchId,
        branchName,
        counselorId,
        counselorName,
        intakeId,
        intakeName,
        leadNumbers: [],
        avgWeeklyWalkIns: 0,
        avgWeeklyApplications: 0,
        avgWeeklyUniversityApplications: 0,
        avgWeeklyLoanApplications: 0,
        avgWeeklyLoanApproved: 0,
        avgWeeklyVisaApproved: 0,
        ...emptySummary(),
    };
}
type AggregateOptions = {
    range: ReportDateRange | null;
    periodKey: string;
    periodLabel: string;
    weeks?: number;
    groupByDay?: boolean;
    groupByIntake?: boolean;
};
function aggregateRows(events: ReportMetricEvent[], targets: TargetRow[], options: AggregateOptions): DirectorReportRow[] {
    const rows = new Map<string, DirectorReportRow>();
    const leadNumbers = new Map<string, Set<string>>();
    const normalizedTargets = normalizeTargets(targets);
    const ensure = (event: ReportMetricEvent, periodKey = options.periodKey, periodLabel = options.periodLabel) => {
        const intake = options.groupByIntake
            ? intakeIdentity(event.intakeId, event.intakeName)
            : null;
        const key = `${periodKey}:${intake?.key ?? "all"}:${event.branchId}:${event.ownerId}`;
        const row = rows.get(key) ??
            createRow(periodKey, periodLabel, event.branchId, event.branchName, event.ownerId, event.ownerName, intake?.id ?? null, intake?.name ?? null);
        rows.set(key, row);
        if (!leadNumbers.has(key)) {
            leadNumbers.set(key, new Set());
        }
        return { row, key };
    };
    for (const event of events) {
        if (!dateInReportRange(event.date, options.range)) {
            continue;
        }
        const eventPeriodKey = options.groupByDay
            ? dateKey(event.date)
            : options.periodKey;
        const eventPeriodLabel = options.groupByDay
            ? dateLabel(event.date)
            : options.periodLabel;
        const { row, key } = ensure(event, eventPeriodKey, eventPeriodLabel);
        addEvent(row, event);
        if (event.leadNumber) {
            leadNumbers.get(key)?.add(event.leadNumber);
        }
    }
    for (const target of normalizedTargets) {
        const targetIntake = intakeIdentity(target.intakeId, target.intakeName);
        const matching = [...rows.values()].filter((row) => {
            if (row.branchId !== target.branchId ||
                row.counselorId !== target.counselorId) {
                return false;
            }
            if (!options.groupByIntake) {
                return true;
            }
            return intakeIdentity(row.intakeId, row.intakeName).key === targetIntake.key;
        });
        if (matching.length > 0) {
            for (const row of matching) {
                row.target += target.target;
            }
            continue;
        }
        if (options.groupByDay) {
            continue;
        }
        const intakeKey = options.groupByIntake ? targetIntake.key : "all";
        const key = `${options.periodKey}:${intakeKey}:${target.branchId}:${target.counselorId}`;
        const row = createRow(options.periodKey, options.periodLabel, target.branchId, target.branchName, target.counselorId, target.counselorName, options.groupByIntake ? targetIntake.id : null, options.groupByIntake ? targetIntake.name : null);
        row.target = target.target;
        rows.set(key, row);
        leadNumbers.set(key, new Set());
    }
    const weeks = Math.max(1, options.weeks ?? 1);
    return [...rows.entries()]
        .map(([key, row]) => {
        row.leadNumbers = [...(leadNumbers.get(key) ?? [])].sort((left, right) => left.localeCompare(right, undefined, { numeric: true }));
        row.avgWeeklyWalkIns = round(row.walkIns / weeks);
        row.avgWeeklyApplications = round(row.applications / weeks);
        row.avgWeeklyUniversityApplications = round(row.universityApplications / weeks);
        row.avgWeeklyLoanApplications = round(row.loanApplications / weeks);
        row.avgWeeklyLoanApproved = round(row.loanApproved / weeks);
        row.avgWeeklyVisaApproved = round(row.visaApproved / weeks);
        return finalizeSummary(row);
    })
        .sort((left, right) => left.periodKey.localeCompare(right.periodKey) ||
        (left.intakeName ?? "").localeCompare(right.intakeName ?? "") ||
        left.branchName.localeCompare(right.branchName) ||
        left.counselorName.localeCompare(right.counselorName));
}
function summarizeRows(rows: DirectorReportRow[]): DirectorReportSummary {
    const summary = emptySummary();
    rows.forEach((row) => addSummary(summary, row));
    return finalizeSummary(summary);
}
function tableTotals(rows: DirectorReportRow[]): DirectorReportTableTotals {
    const branches = new Map<string, DirectorReportRow>();
    const leadNumbers = new Map<string, Set<string>>();
    for (const row of rows) {
        const intakeKey = row.intakeName
            ? intakeIdentity(row.intakeId, row.intakeName).key
            : "all";
        const key = `${row.periodKey}:${intakeKey}:${row.branchId}`;
        const total = branches.get(key) ??
            createRow(row.periodKey, row.periodLabel, row.branchId, row.branchName, BRANCH_TOTAL_ID, "Branch Total", row.intakeId, row.intakeName);
        addSummary(total, row);
        branches.set(key, total);
        const numbers = leadNumbers.get(key) ?? new Set<string>();
        row.leadNumbers.forEach((number) => numbers.add(number));
        leadNumbers.set(key, numbers);
    }
    const branchRows = [...branches.entries()]
        .map(([key, row]) => {
        row.leadNumbers = [...(leadNumbers.get(key) ?? [])];
        return finalizeSummary(row);
    })
        .sort((a, b) => a.periodKey.localeCompare(b.periodKey) ||
        (a.intakeName ?? "").localeCompare(b.intakeName ?? "") ||
        a.branchName.localeCompare(b.branchName));
    const grandTotal = createRow("grand-total", "Grand Total", GRAND_TOTAL_ID, "All Branches", GRAND_TOTAL_ID, "Grand Total");
    branchRows.forEach((row) => {
        addSummary(grandTotal, row);
        row.leadNumbers.forEach((number) => {
            if (!grandTotal.leadNumbers.includes(number))
                grandTotal.leadNumbers.push(number);
        });
    });
    finalizeSummary(grandTotal);
    return { branchRows, grandTotal };
}
function comparison(current: DirectorReportSummary, previous: DirectorReportSummary): DirectorReportComparisonRow[] {
    const definitions: Array<[
        keyof DirectorReportSummary,
        string,
        DirectorReportComparisonRow["valueType"]
    ]> = [
        ["walkIns", "Walk-ins", "number"],
        ["references", "Reference", "number"],
        ["applications", "Applications", "number"],
        ["sameDayApplications", "Same Day Apps", "number"],
        ["oldWalkInApplications", "Old Walk-in Apps", "number"],
        ["universityApplications", "University Applied", "number"],
        ["dropHoldDif", "Drops / Hold / DIF", "number"],
        ["loanApplications", "Loan Applications", "number"],
        ["outsideLoan", "OS-LOAN / O-FUND", "number"],
        ["loanApproved", "Loan Approved", "number"],
        ["visaApproved", "Visa Approved", "number"],
        ["leadToStudentConversionPercentage", "Lead Conversion", "percentage"],
        ["targetCompletionPercentage", "Target Completion", "percentage"],
    ];
    return definitions.map(([key, metric, valueType]) => {
        const currentValue = Number(current[key]);
        const previousValue = Number(previous[key]);
        return {
            rowId: String(key),
            metric,
            current: currentValue,
            previous: previousValue,
            difference: round(currentValue - previousValue),
            changePercentage: reportPercentage(currentValue - previousValue, previousValue),
            valueType,
        };
    });
}
function intakeComparison(totals: DirectorReportTableTotals): DirectorReportIntakeComparisonRow[] {
    const rows = new Map<string, DirectorReportSummary & {
        intakeId: string;
        intakeName: string;
    }>();
    for (const row of totals.branchRows) {
        const identity = intakeIdentity(row.intakeId, row.intakeName);
        const current = rows.get(identity.key) ?? {
            intakeId: identity.id,
            intakeName: identity.name,
            ...emptySummary(),
        };
        addSummary(current, row);
        rows.set(identity.key, current);
    }
    return [...rows.values()]
        .map((row) => {
        finalizeSummary(row);
        return {
            rowId: row.intakeId,
            intakeId: row.intakeId,
            intakeName: row.intakeName,
            walkIns: row.walkIns,
            applications: row.applications,
            universityApplications: row.universityApplications,
            visaApproved: row.visaApproved,
            loanApplications: row.loanApplications,
            outsideLoan: row.outsideLoan,
            loanApproved: row.loanApproved,
            leadConversionPercentage: row.leadToStudentConversionPercentage,
            universityApplicationConversionPercentage: row.universityApplicationConversionPercentage,
            visaConversionPercentage: row.visaConversionPercentage,
            loanConversionPercentage: row.loanConversionPercentage,
        };
    })
        .sort((left, right) => right.applications - left.applications ||
        left.intakeName.localeCompare(right.intakeName));
}
function leadDetails(dataset: ReportDataset, range: ReportDateRange | null): DirectorReportLeadDetail[] {
    const leadRows = dataset.leads
        .filter((lead) => dateInReportRange(lead.createdAt, range))
        .map((lead) => detailFromLead(lead));
    const studentRows = dataset.students
        .filter((student) => dateInReportRange(resolveStudentConversionDate(student), range))
        .map((student) => detailFromStudent(student));
    return [...leadRows, ...studentRows]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 300);
}
function detailFromLead(lead: ReportLead): DirectorReportLeadDetail {
    const owner = resolveFinalLeadOwner(lead);
    return {
        rowId: `lead:${lead.id}`,
        leadId: lead.id,
        leadNumber: lead.leadNumber,
        branchName: lead.branch.name,
        counselorId: owner.id,
        counselorName: owner.name,
        studentName: clean(lead.studentName) || "Not Set",
        mobileNumber: clean(lead.mobileNumber),
        source: clean(lead.source) || "Not Set",
        preferredCountry: clean(lead.preferredCountry) || "Not Set",
        preferredIntake: clean(lead.preferredIntake) || "Not Set",
        status: String(lead.status),
        attribution: "Walk-in Owner",
        createdAt: lead.createdAt.toISOString(),
    };
}
function detailFromStudent(student: ReportStudent): DirectorReportLeadDetail {
    const owner = resolveFinalStudentOwner(student);
    return {
        rowId: `student:${student.id}`,
        leadId: student.leadId,
        leadNumber: student.lead.leadNumber,
        branchName: student.branch.name,
        counselorId: owner.id,
        counselorName: owner.name,
        studentName: student.studentName,
        mobileNumber: student.mobileNumber,
        source: clean(student.lead.source) || "Not Set",
        preferredCountry: clean(student.lead.preferredCountry) || "Not Set",
        preferredIntake: clean(student.lead.preferredIntake) || "Not Set",
        status: String(student.status),
        attribution: "Converted-by / Student Owner",
        createdAt: resolveStudentConversionDate(student).toISOString(),
    };
}
function weeksInRange(range: ReportDateRange | null, events: ReportMetricEvent[]) {
    if (range)
        return Math.max(1, Math.ceil((range.lt.getTime() - range.gte.getTime()) / 604800000));
    if (!events.length)
        return 1;
    const dates = events.map((event) => event.date.getTime());
    return Math.max(1, Math.ceil((Math.max(...dates) - Math.min(...dates) + 86400000) / 604800000));
}
function parseFilters(searchParams: URLSearchParams): DirectorReportFilters {
    const value = (key: string) => clean(searchParams.get(key));
    const presets: DirectorReportFilters["datePreset"][] = [
        "all", "today", "yesterday", "last_7_days", "last_30_days", "this_week",
        "last_week", "this_month", "last_month", "this_quarter", "last_quarter",
        "this_year", "custom",
    ];
    const scopes: DirectorReportFilters["recordScope"][] = ["all", "leads", "students"];
    const datePreset = value("datePreset") as DirectorReportFilters["datePreset"];
    const recordScope = value("recordScope") as DirectorReportFilters["recordScope"];
    return {
        search: value("search"),
        recordScope: scopes.includes(recordScope) ? recordScope : "all",
        branchId: value("branchId"),
        counselorId: value("counselorId"),
        leadStatus: value("leadStatus"),
        source: value("source"),
        countryId: value("countryId"),
        intakeId: value("intakeId"),
        universityId: value("universityId"),
        applicationStatus: value("applicationStatus"),
        casStatus: value("casStatus"),
        visaStatus: value("visaStatus"),
        loanStatus: value("loanStatus"),
        nbfc: value("nbfc"),
        fintechAssigneeId: value("fintechAssigneeId"),
        datePreset: presets.includes(datePreset) ? datePreset : "this_month",
        startDate: value("startDate"),
        endDate: value("endDate"),
    };
}
export function parseDirectorReportFilters(searchParams: URLSearchParams) {
    return parseFilters(searchParams);
}
async function filterOptions(): Promise<DirectorReportFilterOptions> {
    const options = await getSharedReportFilterOptions(REPORT_ACCESS);
    return {
        branches: options.branches,
        users: options.users,
        countries: options.countries,
        intakes: options.intakes,
        universities: options.universities,
        fintechAssignees: options.fintechAssignees,
        leadStatuses: options.leadStatuses,
        sources: options.sources,
        applicationStatuses: options.applicationStatuses,
        casStatuses: options.casStatuses,
        visaStatuses: options.visaStatuses,
        loanStatuses: options.loanStatuses,
        nbfcs: options.nbfcs,
    };
}
export async function getDirectorReport(filters: DirectorReportFilters): Promise<DirectorReportData> {
    const [dataset, targets, options] = await Promise.all([
        loadReportDataset(commonFilters(filters), REPORT_ACCESS),
        getTargets(filters),
        filterOptions(),
    ]);
    const todayStart = currentIstDayStart();
    const todayRange = { gte: todayStart, lt: addReportDays(todayStart, 1) };
    const weekStart = startOfCurrentWeek(todayStart);
    const currentWeekRange = { gte: weekStart, lt: addReportDays(weekStart, 7) };
    const previousWeekRange = { gte: addReportDays(weekStart, -7), lt: weekStart };
    const currentMonthRange = resolveReportDateRange("this_month")!;
    const previousMonthRange = resolveReportDateRange("last_month")!;
    const primaryRange = resolveReportDateRange(filters.datePreset, filters.startDate, filters.endDate);
    const primaryLabel = primaryRange ? reportRangeLabel(primaryRange) : "All Time";
    const primaryWeeks = weeksInRange(primaryRange, dataset.events);
    const allTimeRows = aggregateRows(dataset.events, targets, {
        range: null,
        periodKey: "all-time",
        periodLabel: "All Time",
        weeks: weeksInRange(null, dataset.events),
    });
    const todayRows = aggregateRows(dataset.events, targets, {
        range: todayRange,
        periodKey: dateKey(todayStart),
        periodLabel: "Today",
    });
    const weeklyRows = aggregateRows(dataset.events, [], {
        range: currentWeekRange,
        periodKey: "current-week",
        periodLabel: "Current Week",
        groupByDay: true,
    });
    const currentMonthRows = aggregateRows(dataset.events, targets, {
        range: currentMonthRange,
        periodKey: dateKey(currentMonthRange.gte).slice(0, 7),
        periodLabel: monthLabel(currentMonthRange.gte),
        weeks: weeksInRange(currentMonthRange, dataset.events),
    });
    const currentMonthIntakeKey = dateKey(currentMonthRange.gte).slice(0, 7);
    const shouldExcludeCurrentMonthIntake = !filters.intakeId;
    const intakeEvents = dataset.events.filter((event) => {
        if (!shouldExcludeCurrentMonthIntake || isAggregateIntake(event.intakeName)) {
            return !isAggregateIntake(event.intakeName);
        }
        return intakeMonthKey(event.intakeName) !== currentMonthIntakeKey;
    });
    const intakeTargets = targets.filter((target) => {
        if (!shouldExcludeCurrentMonthIntake || isAggregateIntake(target.intakeName)) {
            return !isAggregateIntake(target.intakeName);
        }
        return intakeMonthKey(target.intakeName) !== currentMonthIntakeKey;
    });
    const intakeWiseRows = aggregateRows(intakeEvents, intakeTargets, {
        range: primaryRange,
        periodKey: "intake",
        periodLabel: primaryLabel,
        weeks: primaryWeeks,
        groupByIntake: true,
    });
    const primaryRows = aggregateRows(dataset.events, targets, {
        range: primaryRange,
        periodKey: filters.datePreset,
        periodLabel: primaryLabel,
        weeks: primaryWeeks,
    });
    const currentWeekRows = aggregateRows(dataset.events, targets, {
        range: currentWeekRange,
        periodKey: "current-week-total",
        periodLabel: "Current Week",
    });
    const previousWeekRows = aggregateRows(dataset.events, targets, {
        range: previousWeekRange,
        periodKey: "previous-week-total",
        periodLabel: "Previous Week",
    });
    const previousMonthRows = aggregateRows(dataset.events, targets, {
        range: previousMonthRange,
        periodKey: "previous-month",
        periodLabel: monthLabel(previousMonthRange.gte),
    });
    const allTimeTotals = tableTotals(allTimeRows);
    const todayTotals = tableTotals(todayRows);
    const weeklyTotals = tableTotals(weeklyRows);
    const currentMonthTotals = tableTotals(currentMonthRows);
    const intakeWiseTotals = tableTotals(intakeWiseRows);
    const primaryTotals = tableTotals(primaryRows);
    return {
        generatedAt: new Date().toISOString(),
        filters,
        filterOptions: options,
        summary: primaryTotals.grandTotal,
        allTimeRows,
        allTimeTotals,
        todayRows,
        todayTotals,
        weeklyRows,
        weeklyTotals,
        currentMonthRows,
        currentMonthTotals,
        intakeWiseRows,
        intakeWiseTotals,
        weeklyAverageRows: currentMonthRows,
        weekComparison: comparison(tableTotals(currentWeekRows).grandTotal, tableTotals(previousWeekRows).grandTotal),
        monthComparison: comparison(currentMonthTotals.grandTotal, tableTotals(previousMonthRows).grandTotal),
        intakeComparison: intakeComparison(intakeWiseTotals),
        leadDetails: leadDetails(dataset, primaryRange),
    };
}