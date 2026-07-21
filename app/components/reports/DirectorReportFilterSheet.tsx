"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarDays,
  GitBranch,
  GraduationCap,
  Landmark,
  RotateCcw,
  SlidersHorizontal,
  Users,
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
  DEFAULT_DIRECTOR_REPORT_FILTERS,
  type DirectorReportDatePreset,
  type DirectorReportFilterOption,
  type DirectorReportFilterOptions,
  type DirectorReportFilters,
  type DirectorReportRecordScope,
} from "@/types/director-report";

type Props = {
  value: DirectorReportFilters;
  options?: DirectorReportFilterOptions;
  isLoading?: boolean;
  onApply: (filters: DirectorReportFilters) => void;
};

type SelectProps = {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: DirectorReportFilterOption[];
  disabled?: boolean;
  showRole?: boolean;
  onChange: (value: string) => void;
};

const DATE_OPTIONS: DirectorReportFilterOption[] = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "last_7_days", label: "Last 7 Days" },
  { value: "last_30_days", label: "Last 30 Days" },
  { value: "this_week", label: "This Week" },
  { value: "last_week", label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_quarter", label: "This Quarter" },
  { value: "last_quarter", label: "Last Quarter" },
  { value: "this_year", label: "This Year" },
  { value: "custom", label: "Custom Date Range" },
];

const SCOPE_OPTIONS: DirectorReportFilterOption[] = [
  { value: "all", label: "Walk-ins, Students and Applications" },
  { value: "leads", label: "Walk-ins Only" },
  { value: "students", label: "Students and Applications Only" },
];

function FilterSelect({
  id,
  label,
  value,
  placeholder,
  options,
  disabled,
  showRole,
  onChange,
}: SelectProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={`${id}:${option.value}`} value={option.value}>
            {showRole && option.roleName
              ? `${option.label} — ${option.roleName}`
              : option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function toOptions(values: string[]): DirectorReportFilterOption[] {
  return Array.from(new Set(values.filter(Boolean))).map((value) => ({
    value,
    label: value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
  }));
}

function countFilters(filters: DirectorReportFilters): number {
  return Object.entries(filters).reduce((count, [key, value]) => {
    if (!value) return count;
    if (key === "recordScope" && value === "all") return count;
    if (key === "datePreset" && value === "this_month") return count;
    return count + 1;
  }, 0);
}

function FilterGroup({
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
    <section className={`rounded-xl border bg-background p-4 ${className}`}>
      <div className="mb-4 flex items-start gap-2.5">
        <div className="rounded-lg bg-primary/10 p-2 text-primary">
          <Icon className="size-4" />
        </div>
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function DirectorReportFilterSheet({
  value,
  options,
  isLoading,
  onApply,
}: Props) {
  const [draft, setDraft] = useState(value);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(value);
  const customDateInvalid =
    draft.datePreset === "custom" && !draft.startDate && !draft.endDate;

  useEffect(() => setDraft(value), [value]);

  const users = useMemo(() => {
    const allUsers = options?.users ?? [];
    if (!draft.branchId) return allUsers;

    return allUsers.filter(
      (user) =>
        !user.branchIds?.length || user.branchIds.includes(draft.branchId),
    );
  }, [draft.branchId, options]);

  const universities = useMemo(() => {
    const allUniversities = options?.universities ?? [];
    if (!draft.countryId) return allUniversities;

    return allUniversities.filter(
      (university) => university.countryId === draft.countryId,
    );
  }, [draft.countryId, options]);

  const update = <K extends keyof DirectorReportFilters>(
    key: K,
    next: DirectorReportFilters[K],
  ) => setDraft((current) => ({ ...current, [key]: next }));

  const changeScope = (nextValue: string) => {
    const recordScope = nextValue as DirectorReportRecordScope;

    setDraft((current) => ({
      ...current,
      recordScope,
      ...(recordScope === "leads" && {
        universityId: "",
        applicationStatus: "",
        casStatus: "",
        visaStatus: "",
        loanStatus: "",
        nbfc: "",
        fintechAssigneeId: "",
      }),
      ...(recordScope === "students" &&
        current.leadStatus &&
        current.leadStatus !== "converted" && { leadStatus: "" }),
    }));
  };

  const changeBranch = (branchId: string) => {
    setDraft((current) => {
      const selectedUser = options?.users.find(
        (user) => user.value === current.counselorId,
      );
      const keepUser =
        !branchId ||
        !selectedUser ||
        !selectedUser.branchIds?.length ||
        selectedUser.branchIds.includes(branchId);

      return {
        ...current,
        branchId,
        counselorId: keepUser ? current.counselorId : "",
      };
    });
  };

  const changeCountry = (countryId: string) => {
    setDraft((current) => {
      const selectedUniversity = options?.universities.find(
        (university) => university.value === current.universityId,
      );

      return {
        ...current,
        countryId,
        universityId:
          !countryId ||
          !selectedUniversity ||
          selectedUniversity.countryId === countryId
            ? current.universityId
            : "",
      };
    });
  };

  const reset = () => {
    const next = { ...DEFAULT_DIRECTOR_REPORT_FILTERS };
    setDraft(next);
    onApply(next);
  };

  return (
    <Accordion type="single" collapsible className="mb-5">
      <AccordionItem
        value="director-report-filters"
        className="overflow-hidden rounded-2xl border bg-card shadow-sm"
      >
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-12 top-1/2 z-10 -translate-y-1/2 bg-background"
            onClick={reset}
            disabled={!countFilters(value) && !isDirty}
          >
            <RotateCcw className="mr-2 size-4" />
            Reset
          </Button>

          <AccordionTrigger className="min-h-[82px] px-4 pr-36 text-left hover:no-underline sm:px-5 sm:pr-40">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-xl bg-primary p-2.5 text-primary-foreground">
                <SlidersHorizontal className="size-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">Advanced Filters</h2>
                  <Badge variant="secondary">
                    {countFilters(value)} active
                  </Badge>
                  {isDirty && <Badge variant="outline">Not applied</Badge>}
                </div>
                <p className="mt-1 text-xs font-normal text-muted-foreground sm:text-sm">
                  Closed by default. The same filters are used for the screen and Excel export.
                </p>
              </div>
            </div>
          </AccordionTrigger>
        </div>

        <AccordionContent className="pb-0">
          <div className="space-y-4 bg-muted/10 p-4 sm:p-5">
            <FilterGroup
              icon={CalendarDays}
              title="Report period"
              description="Choose the data scope, lifecycle period and a general search term."
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FilterSelect
                  id="director-scope"
                  label="Report Scope"
                  value={draft.recordScope}
                  placeholder="Select scope"
                  options={SCOPE_OPTIONS}
                  onChange={changeScope}
                />
                <FilterSelect
                  id="director-date-preset"
                  label="Date Range"
                  value={draft.datePreset}
                  placeholder="Select period"
                  options={DATE_OPTIONS}
                  onChange={(nextValue) =>
                    setDraft((current) => ({
                      ...current,
                      datePreset: nextValue as DirectorReportDatePreset,
                      startDate:
                        nextValue === "custom" ? current.startDate : "",
                      endDate: nextValue === "custom" ? current.endDate : "",
                    }))
                  }
                />
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="director-search" className="text-xs">
                    Search
                  </Label>
                  <Input
                    id="director-search"
                    className="h-10"
                    value={draft.search}
                    placeholder="Lead no., applicant, mobile, email, university or course"
                    onChange={(event) => update("search", event.target.value)}
                  />
                </div>
              </div>

              {draft.datePreset === "custom" && (
                <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2 xl:max-w-2xl">
                  <div className="space-y-1.5">
                    <Label htmlFor="director-start-date" className="text-xs">
                      Start Date
                    </Label>
                    <Input
                      id="director-start-date"
                      type="date"
                      className="h-10"
                      value={draft.startDate}
                      max={draft.endDate || undefined}
                      onChange={(event) =>
                        update("startDate", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="director-end-date" className="text-xs">
                      End Date
                    </Label>
                    <Input
                      id="director-end-date"
                      type="date"
                      className="h-10"
                      value={draft.endDate}
                      min={draft.startDate || undefined}
                      onChange={(event) =>
                        update("endDate", event.target.value)
                      }
                    />
                  </div>
                  {customDateInvalid && (
                    <p className="text-xs text-destructive sm:col-span-2">
                      Select at least one custom date.
                    </p>
                  )}
                </div>
              )}
            </FilterGroup>

            <div className="grid gap-4 xl:grid-cols-2">
              <FilterGroup
                icon={Users}
                title="Branch and user"
                description="All CRM users are available, not only counsellor-role users."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FilterSelect
                    id="director-branch"
                    label="Branch"
                    value={draft.branchId}
                    placeholder="All Branches"
                    options={options?.branches ?? []}
                    disabled={isLoading}
                    onChange={changeBranch}
                  />
                  <FilterSelect
                    id="director-user"
                    label="User"
                    value={draft.counselorId}
                    placeholder="All Users"
                    options={users}
                    showRole
                    disabled={isLoading}
                    onChange={(nextValue) =>
                      update("counselorId", nextValue)
                    }
                  />
                </div>
              </FilterGroup>

              <FilterGroup
                icon={GitBranch}
                title="Walk-in pipeline"
                description="Filter lead status and acquisition source."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FilterSelect
                    id="director-lead-status"
                    label="Walk-in Status"
                    value={draft.leadStatus}
                    placeholder="All Statuses"
                    options={toOptions(options?.leadStatuses ?? [])}
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
                    id="director-source"
                    label="Walk-in Source"
                    value={draft.source}
                    placeholder="All Sources"
                    options={(options?.sources ?? []).map((source) => ({
                      value: source,
                      label: source,
                    }))}
                    disabled={isLoading}
                    onChange={(nextValue) => update("source", nextValue)}
                  />
                </div>
              </FilterGroup>

              <FilterGroup
                icon={GraduationCap}
                title="Destination and applications"
                description="Narrow results by destination, intake, university and status."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FilterSelect
                    id="director-country"
                    label="Country"
                    value={draft.countryId}
                    placeholder="All Countries"
                    options={options?.countries ?? []}
                    disabled={isLoading}
                    onChange={changeCountry}
                  />
                  <FilterSelect
                    id="director-intake"
                    label="Intake"
                    value={draft.intakeId}
                    placeholder="All Intakes"
                    options={options?.intakes ?? []}
                    disabled={isLoading}
                    onChange={(nextValue) => update("intakeId", nextValue)}
                  />
                  <FilterSelect
                    id="director-university"
                    label="University"
                    value={draft.universityId}
                    placeholder="All Universities"
                    options={universities}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(nextValue) =>
                      update("universityId", nextValue)
                    }
                  />
                  <FilterSelect
                    id="director-application-status"
                    label="Application Status"
                    value={draft.applicationStatus}
                    placeholder="All Application Statuses"
                    options={toOptions(options?.applicationStatuses ?? [])}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(nextValue) =>
                      update("applicationStatus", nextValue)
                    }
                  />
                </div>
              </FilterGroup>

              <FilterGroup
                icon={Landmark}
                title="Visa and loan"
                description="Apply compliance, loan, bank and fintech ownership filters."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FilterSelect
                    id="director-cas-status"
                    label="CAS Status"
                    value={draft.casStatus}
                    placeholder="All CAS Statuses"
                    options={toOptions(options?.casStatuses ?? [])}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(nextValue) => update("casStatus", nextValue)}
                  />
                  <FilterSelect
                    id="director-visa-status"
                    label="Visa Status"
                    value={draft.visaStatus}
                    placeholder="All Visa Statuses"
                    options={toOptions(options?.visaStatuses ?? [])}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(nextValue) => update("visaStatus", nextValue)}
                  />
                  <FilterSelect
                    id="director-loan-status"
                    label="Loan Status"
                    value={draft.loanStatus}
                    placeholder="All Loan Statuses"
                    options={toOptions(options?.loanStatuses ?? [])}
                    disabled={isLoading}
                    onChange={(nextValue) => update("loanStatus", nextValue)}
                  />
                  <FilterSelect
                    id="director-nbfc"
                    label="NBFC / Bank"
                    value={draft.nbfc}
                    placeholder="All NBFCs / Banks"
                    options={(options?.nbfcs ?? []).map((nbfc) => ({
                      value: nbfc,
                      label: nbfc,
                    }))}
                    disabled={isLoading}
                    onChange={(nextValue) => update("nbfc", nextValue)}
                  />
                  <div className="sm:col-span-2">
                    <FilterSelect
                      id="director-fintech-user"
                      label="Fintech Assignee"
                      value={draft.fintechAssigneeId}
                      placeholder="All Fintech Assignees"
                      options={options?.fintechAssignees ?? []}
                      disabled={isLoading}
                      onChange={(nextValue) =>
                        update("fintechAssigneeId", nextValue)
                      }
                    />
                  </div>
                </div>
              </FilterGroup>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t bg-background p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-xs text-muted-foreground">
              Filters run only after selecting Apply Filters.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDraft(value)}
                disabled={!isDirty}
              >
                Cancel
              </Button>
              <Button
                type="button"
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
