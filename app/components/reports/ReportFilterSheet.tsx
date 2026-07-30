// app\components\reports\ReportFilterSheet.tsx
"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  GitBranch,
  GraduationCap,
  Landmark,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { countPerformanceReportFilters } from "@/lib/performance-report-utils";
import {
  DEFAULT_PERFORMANCE_REPORT_FILTERS,
  type PerformanceReportFilterOptions,
  type PerformanceReportFilters,
  type ReportDatePreset,
  type ReportOption,
  type ReportRecordScope,
} from "@/types/performance-report";

type Props = {
  value: PerformanceReportFilters;
  options?: PerformanceReportFilterOptions;
  isLoading?: boolean;
  onApply: (filters: PerformanceReportFilters) => void;
};

type SelectProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: ReportOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

function FilterSelect({
  id,
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: SelectProps) {
  return (
    <div className="space-y-1.5 w-full max-w-full overflow-hidden">
      <Label
        htmlFor={id}
        className="text-xs font-bold text-slate-700 dark:text-slate-300"
      >
        {label}
      </Label>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          className="w-full h-10 rounded-xl bg-background truncate"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const statusOptions = (values: string[]): ReportOption[] =>
  values.map((value) => ({
    value,
    label: value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
  }));

function getDateOptions(): Array<{ value: ReportDatePreset; label: string }> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return [
    { value: "all", label: "All Time" },
    { value: "today", label: `Today (${now.toLocaleDateString("en-IN")})` },
    {
      value: "yesterday",
      label: `Yesterday (${yesterday.toLocaleDateString("en-IN")})`,
    },
    { value: "last_7_days", label: "Last 7 Days" },
    { value: "last_30_days", label: "Last 30 Days" },
    {
      value: "this_month",
      label: `This Month (${now.toLocaleDateString("en-IN", { month: "long" })})`,
    },
    {
      value: "last_month",
      label: `Last Month (${lastMonth.toLocaleDateString("en-IN", { month: "long" })})`,
    },
    { value: "this_quarter", label: `This Quarter (Q${quarter})` },
    {
      value: "last_quarter",
      label: `Last Quarter (Q${quarter === 1 ? 4 : quarter - 1})`,
    },
    { value: "this_year", label: `This Year (${now.getFullYear()})` },
    { value: "custom", label: "Custom Date Range" },
  ];
}

const scopeOptions: ReportOption[] = [
  { value: "all", label: "Walk-ins and Converted Students" },
  { value: "leads", label: "Walk-ins Only" },
  { value: "students", label: "Converted Students Only" },
];

function Section({
  icon: Icon,
  title,
  description,
  children,
  className = "",
}: {
  icon: typeof CalendarDays;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-border/60 p-3.5 sm:p-5 w-full max-w-full overflow-hidden ${className}`}
    >
      <div className="mb-4 flex items-start gap-3">
        <div className="shrink-0 rounded-xl bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-black text-foreground">{title}</h3>
          <p className="text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function ReportFilterSheet({
  value,
  options,
  isLoading,
  onApply,
}: Props) {
  const [draft, setDraft] = useState(value);
  const dateOptions = useMemo(getDateOptions, []);
  const isUserScoped = options?.access.kind === "user";
  const currentUserId = isUserScoped
    ? (options?.counselors[0]?.value ?? "")
    : "";
  const displayUserId = isUserScoped ? currentUserId : draft.counselorId;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(value);
  const customDateInvalid =
    draft.datePreset === "custom" && !draft.startDate && !draft.endDate;

  useEffect(() => setDraft(value), [value]);

  const users = useMemo(() => {
    if (!options || !draft.branchId) return options?.counselors ?? [];
    return options.counselors.filter((user) =>
      user.branchIds.includes(draft.branchId),
    );
  }, [draft.branchId, options]);

  const universities = useMemo(() => {
    if (!options || !draft.countryId) return options?.universities ?? [];
    return options.universities.filter(
      (university) => university.countryId === draft.countryId,
    );
  }, [draft.countryId, options]);

  const update = <K extends keyof PerformanceReportFilters>(
    key: K,
    next: PerformanceReportFilters[K],
  ) => setDraft((current) => ({ ...current, [key]: next }));

  const changeScope = (value: string) => {
    const recordScope = value as ReportRecordScope;
    setDraft((current) => ({
      ...current,
      recordScope,
      ...(recordScope === "leads" && {
        universityId: "",
        applicationStatus: "",
        casStatus: "",
        visaStatus: "",
      }),
      ...(recordScope === "students" &&
        current.leadStatus &&
        current.leadStatus !== "converted" && { leadStatus: "" }),
    }));
  };

  const changeBranch = (branchId: string) => {
    setDraft((current) => {
      const selected = options?.counselors.find(
        (user) => user.value === current.counselorId,
      );
      return {
        ...current,
        branchId,
        counselorId:
          !branchId || !selected || selected.branchIds.includes(branchId)
            ? current.counselorId
            : "",
      };
    });
  };

  const changeCountry = (countryId: string) => {
    setDraft((current) => {
      const selected = options?.universities.find(
        (university) => university.value === current.universityId,
      );
      return {
        ...current,
        countryId,
        universityId:
          !countryId || !selected || selected.countryId === countryId
            ? current.universityId
            : "",
      };
    });
  };

  const reset = () => {
    const filters = { ...DEFAULT_PERFORMANCE_REPORT_FILTERS };
    setDraft(filters);
    onApply(filters);
  };

  return (
    <Accordion type="single" collapsible className="mb-6 w-full max-w-full">
      <AccordionItem
        value="report-filters"
        className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm w-full max-w-full"
      >
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-4 top-auto bottom-4 z-10 h-9 sm:right-12 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2"
            onClick={reset}
          >
            <RotateCcw className="mr-2 size-4" />
            Reset
          </Button>
          <AccordionTrigger className="min-h-[110px] px-4 pb-16 pr-4 text-left hover:no-underline sm:min-h-[78px] sm:px-5 sm:pb-0 sm:pr-40">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary p-2.5 text-primary-foreground">
                <SlidersHorizontal className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold">Advanced Filters</h2>
                  {isDirty && <Badge variant="outline">Not applied</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  The same filters are used on screen and in Excel.
                </p>
              </div>
            </div>
          </AccordionTrigger>
        </div>

        <AccordionContent className="pb-0 w-full max-w-full overflow-hidden">
          <div className="space-y-4 sm:space-y-5 p-3 sm:p-6 bg-muted/10 w-full max-w-full overflow-hidden">
            <Section
              icon={CalendarDays}
              title="Report Scope and Lifecycle Date"
              description="Walk-ins use creation date, applications use conversion date, loans use login date, and target achievement uses visa decision date."
              className="bg-card shadow-sm"
            >
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4 w-full">
                <FilterSelect
                  id="report-record-scope"
                  label="Report Scope"
                  value={draft.recordScope}
                  placeholder="Select scope"
                  options={scopeOptions}
                  onChange={changeScope}
                />
                <FilterSelect
                  id="report-date-preset"
                  label="Lifecycle Date Range"
                  value={draft.datePreset}
                  placeholder="Select date range"
                  options={dateOptions}
                  onChange={(value) =>
                    setDraft((current) => ({
                      ...current,
                      datePreset: value as ReportDatePreset,
                      startDate: value === "custom" ? current.startDate : "",
                      endDate: value === "custom" ? current.endDate : "",
                    }))
                  }
                />
                <div className="space-y-1.5 md:col-span-2 w-full max-w-full">
                  <Label
                    htmlFor="report-search"
                    className="text-xs font-bold text-slate-700 dark:text-slate-300"
                  >
                    Search
                  </Label>
                  <Input
                    id="report-search"
                    className="h-10 rounded-xl bg-background w-full"
                    value={draft.search}
                    placeholder="Walk-in no., loan login, applicant, email, mobile..."
                    onChange={(event) => update("search", event.target.value)}
                  />
                </div>
              </div>
              {draft.datePreset === "custom" && (
                <div className="mt-4 grid gap-3 sm:gap-4 border-t border-border/60 pt-4 sm:grid-cols-2 xl:max-w-2xl w-full">
                  <div className="space-y-1.5 w-full">
                    <Label
                      htmlFor="report-start-date"
                      className="text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      Start Date
                    </Label>
                    <Input
                      id="report-start-date"
                      type="date"
                      className="h-10 rounded-xl bg-background w-full"
                      value={draft.startDate}
                      max={draft.endDate || undefined}
                      onChange={(event) =>
                        update("startDate", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5 w-full">
                    <Label
                      htmlFor="report-end-date"
                      className="text-xs font-bold text-slate-700 dark:text-slate-300"
                    >
                      End Date
                    </Label>
                    <Input
                      id="report-end-date"
                      type="date"
                      className="h-10 rounded-xl bg-background w-full"
                      value={draft.endDate}
                      min={draft.startDate || undefined}
                      onChange={(event) =>
                        update("endDate", event.target.value)
                      }
                    />
                  </div>
                  {customDateInvalid && (
                    <p className="text-xs font-semibold text-destructive sm:col-span-2">
                      Select at least one custom date.
                    </p>
                  )}
                </div>
              )}
            </Section>

            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3 w-full">
              <Section
                icon={GitBranch}
                title="Walk-in Pipeline"
                description="Branches and users are restricted by the signed-in role."
                className="bg-card shadow-sm"
              >
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 w-full">
                  <FilterSelect
                    id="report-branch"
                    label="Branch"
                    value={draft.branchId}
                    placeholder="All Accessible Branches"
                    options={options?.branches ?? []}
                    disabled={isLoading}
                    onChange={changeBranch}
                  />
                  <FilterSelect
                    id="report-user"
                    label={isUserScoped ? "Current User" : "User"}
                    value={displayUserId}
                    placeholder={isUserScoped ? "Current User" : "All Users"}
                    options={users}
                    disabled={isLoading || isUserScoped}
                    onChange={(value) => update("counselorId", value)}
                  />
                  <FilterSelect
                    id="report-lead-status"
                    label="Walk-in Status"
                    value={draft.leadStatus}
                    placeholder="All Walk-in Statuses"
                    options={statusOptions(options?.leadStatuses ?? [])}
                    disabled={isLoading}
                    onChange={(leadStatus) =>
                      setDraft((current) => ({
                        ...current,
                        leadStatus,
                        recordScope:
                          leadStatus === "converted"
                            ? "students"
                            : leadStatus
                              ? "leads"
                              : current.recordScope,
                      }))
                    }
                  />
                  <FilterSelect
                    id="report-lead-source"
                    label="Walk-in Source"
                    value={draft.leadSource}
                    placeholder="All Walk-in Sources"
                    options={(options?.leadSources ?? []).map((source) => ({
                      value: source,
                      label: source,
                    }))}
                    disabled={isLoading}
                    onChange={(value) => update("leadSource", value)}
                  />
                </div>
              </Section>

              <Section
                icon={GraduationCap}
                title="Destination and Applications"
                description="University filters apply to converted applications only."
                className="bg-card shadow-sm"
              >
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 w-full">
                  <FilterSelect
                    id="report-country"
                    label="Country"
                    value={draft.countryId}
                    placeholder="All Countries"
                    options={options?.countries ?? []}
                    disabled={isLoading}
                    onChange={changeCountry}
                  />
                  <FilterSelect
                    id="report-intake"
                    label="Intake"
                    value={draft.intakeId}
                    placeholder="All Intakes"
                    options={options?.intakes ?? []}
                    disabled={isLoading}
                    onChange={(value) => update("intakeId", value)}
                  />
                  <FilterSelect
                    id="report-university"
                    label="University"
                    value={draft.universityId}
                    placeholder="All Universities"
                    options={universities}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(value) => update("universityId", value)}
                  />
                  <FilterSelect
                    id="report-application-status"
                    label="University Application Status"
                    value={draft.applicationStatus}
                    placeholder="All University Application Statuses"
                    options={statusOptions(options?.applicationStatuses ?? [])}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(value) => update("applicationStatus", value)}
                  />
                </div>
              </Section>

              <Section
                icon={Landmark}
                title="Visa and Loan Filters"
                description="Loan filters include standalone loan forms and walk-in generated loan logins."
                className="xl:col-span-2 2xl:col-span-1 bg-card shadow-sm"
              >
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 w-full">
                  <FilterSelect
                    id="report-cas-status"
                    label="CAS Status"
                    value={draft.casStatus}
                    placeholder="All CAS Statuses"
                    options={statusOptions(options?.casStatuses ?? [])}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(value) => update("casStatus", value)}
                  />
                  <FilterSelect
                    id="report-visa-status"
                    label="Visa Status"
                    value={draft.visaStatus}
                    placeholder="All Visa Statuses"
                    options={statusOptions(options?.visaStatuses ?? [])}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(value) => update("visaStatus", value)}
                  />
                  <FilterSelect
                    id="report-loan-status"
                    label="Loan Status"
                    value={draft.loanStatus}
                    placeholder="All Loan Statuses"
                    options={statusOptions(options?.loanStatuses ?? [])}
                    disabled={isLoading}
                    onChange={(value) => update("loanStatus", value)}
                  />
                  <FilterSelect
                    id="report-nbfc"
                    label="NBFC / Bank"
                    value={draft.nbfc}
                    placeholder="All NBFCs / Banks"
                    options={(options?.nbfcs ?? []).map((nbfc) => ({
                      value: nbfc,
                      label: nbfc,
                    }))}
                    disabled={isLoading}
                    onChange={(value) => update("nbfc", value)}
                  />
                  <div className="sm:col-span-2 w-full">
                    <FilterSelect
                      id="report-fintech-assignee"
                      label="Fintech Assignee"
                      value={draft.fintechAssigneeId}
                      placeholder="All Fintech Assignees"
                      options={options?.fintechAssignees ?? []}
                      disabled={isLoading}
                      onChange={(value) => update("fintechAssigneeId", value)}
                    />
                  </div>
                </div>
              </Section>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 bg-card p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 rounded-b-2xl w-full">
            <p className="text-xs font-medium text-muted-foreground">
              Filters run only after selecting Apply Filters.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl h-9 text-xs font-bold"
                onClick={() => setDraft(value)}
                disabled={!isDirty}
              >
                Cancel Changes
              </Button>
              <Button
                type="button"
                className="rounded-xl h-9 text-xs font-bold"
                onClick={() => !customDateInvalid && onApply(draft)}
                disabled={!isDirty || customDateInvalid}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
