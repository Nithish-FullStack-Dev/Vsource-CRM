"use client";

import { useEffect, useMemo, useState } from "react";
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
import { countPerformanceReportFilters } from "@/lib/performance-report-utils";
import {
  DEFAULT_PERFORMANCE_REPORT_FILTERS,
  type PerformanceReportFilters,
  type PerformanceReportFilterOptions,
  type ReportDatePreset,
  type ReportOption,
  type ReportRecordScope,
} from "@/types/performance-report";

type ReportFilterSheetProps = {
  value: PerformanceReportFilters;
  options?: PerformanceReportFilterOptions;
  isLoading?: boolean;
  onApply: (filters: PerformanceReportFilters) => void;
};

type FilterSelectProps = {
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
}: FilterSelectProps) {
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
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm outline-none transition-colors focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function toStatusOptions(values: string[]): ReportOption[] {
  return values.map((value) => ({
    value,
    label: value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (character) => character.toUpperCase()),
  }));
}

function getDateOptions(): Array<{ value: ReportDatePreset; label: string }> {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const month = now.toLocaleDateString("en-IN", { month: "long" });
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.toLocaleDateString("en-IN", {
    month: "long",
  });
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  const lastQuarter = quarter === 1 ? 4 : quarter - 1;

  return [
    { value: "all", label: "All Time" },
    {
      value: "today",
      label: `Today (${now.toLocaleDateString("en-IN")})`,
    },
    {
      value: "yesterday",
      label: `Yesterday (${yesterday.toLocaleDateString("en-IN")})`,
    },
    { value: "last_7_days", label: "Last 7 Days" },
    { value: "last_30_days", label: "Last 30 Days" },
    { value: "this_month", label: `This Month (${month})` },
    { value: "last_month", label: `Last Month (${lastMonth})` },
    { value: "this_quarter", label: `This Quarter (Q${quarter})` },
    { value: "last_quarter", label: `Last Quarter (Q${lastQuarter})` },
    { value: "this_year", label: `This Year (${now.getFullYear()})` },
    { value: "custom", label: "Custom Date Range" },
  ];
}

const recordScopeOptions: ReportOption[] = [
  { value: "all", label: "Leads and Students" },
  { value: "leads", label: "Leads Only" },
  { value: "students", label: "Students Only" },
];

export function ReportFilterSheet({
  value,
  options,
  isLoading,
  onApply,
}: ReportFilterSheetProps) {
  const [draft, setDraft] = useState<PerformanceReportFilters>(value);
  const dateOptions = useMemo(getDateOptions, []);
  const activeCount = countPerformanceReportFilters(value);
  const isUserScoped = options?.access.kind === "user";
  const userCounselorId = isUserScoped
    ? (options?.counselors[0]?.value ?? "")
    : "";
  const displayCounselorId = isUserScoped
    ? userCounselorId
    : draft.counselorId;
  const isDirty = JSON.stringify(draft) !== JSON.stringify(value);
  const customDateInvalid =
    draft.datePreset === "custom" && !draft.startDate && !draft.endDate;

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const counselorOptions = useMemo(() => {
    if (!options) {
      return [];
    }

    return draft.branchId
      ? options.counselors.filter((counselor) =>
          counselor.branchIds.includes(draft.branchId),
        )
      : options.counselors;
  }, [draft.branchId, options]);

  const universityOptions = useMemo(() => {
    if (!options) {
      return [];
    }

    return draft.countryId
      ? options.universities.filter(
          (university) => university.countryId === draft.countryId,
        )
      : options.universities;
  }, [draft.countryId, options]);

  const updateFilter = <K extends keyof PerformanceReportFilters>(
    key: K,
    nextValue: PerformanceReportFilters[K],
  ) => {
    setDraft((current) => ({ ...current, [key]: nextValue }));
  };

  const handleDatePresetChange = (nextValue: string) => {
    const datePreset = nextValue as ReportDatePreset;
    setDraft((current) => ({
      ...current,
      datePreset,
      startDate: datePreset === "custom" ? current.startDate : "",
      endDate: datePreset === "custom" ? current.endDate : "",
    }));
  };

  const handleRecordScopeChange = (nextValue: string) => {
    const recordScope = nextValue as ReportRecordScope;

    setDraft((current) => {
      if (recordScope === "leads") {
        return {
          ...current,
          recordScope,
          leadStatus: current.leadStatus === "converted" ? "" : current.leadStatus,
          universityId: "",
          applicationStatus: "",
          casStatus: "",
          visaStatus: "",
          loanStatus: "",
          nbfc: "",
          fintechAssigneeId: "",
        };
      }

      if (recordScope === "students") {
        return {
          ...current,
          recordScope,
          leadStatus:
            current.leadStatus && current.leadStatus !== "converted"
              ? ""
              : current.leadStatus,
        };
      }

      return { ...current, recordScope };
    });
  };

  const handleLeadStatusChange = (leadStatus: string) => {
    setDraft((current) => ({
      ...current,
      leadStatus,
      recordScope:
        leadStatus === "converted"
          ? "students"
          : leadStatus
            ? "leads"
            : current.recordScope,
    }));
  };

  const handleBranchChange = (branchId: string) => {
    setDraft((current) => {
      const selectedCounselor = options?.counselors.find(
        (counselor) => counselor.value === current.counselorId,
      );
      const counselorIsValid =
        !branchId ||
        !selectedCounselor ||
        selectedCounselor.branchIds.includes(branchId);

      return {
        ...current,
        branchId,
        counselorId: counselorIsValid ? current.counselorId : "",
      };
    });
  };

  const handleCountryChange = (countryId: string) => {
    setDraft((current) => {
      const selectedUniversity = options?.universities.find(
        (university) => university.value === current.universityId,
      );
      const universityIsValid =
        !countryId ||
        !selectedUniversity ||
        selectedUniversity.countryId === countryId;

      return {
        ...current,
        countryId,
        universityId: universityIsValid ? current.universityId : "",
      };
    });
  };

  const handleReset = () => {
    const resetFilters = { ...DEFAULT_PERFORMANCE_REPORT_FILTERS };
    setDraft(resetFilters);
    onApply(resetFilters);
  };

  const handleApply = () => {
    if (!customDateInvalid) {
      onApply(draft);
    }
  };

  return (
    <Accordion type="single" collapsible className="mb-4">
      <AccordionItem
        value="report-filters"
        className="overflow-hidden rounded-xl border border-primary/15 bg-card shadow-sm"
      >
        <div className="relative bg-gradient-to-r from-primary/10 via-primary/5 to-background">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="absolute right-12 top-1/2 z-10 -translate-y-1/2 bg-background shadow-sm"
            onClick={handleReset}
            disabled={activeCount === 0 && !isDirty}
          >
            <RotateCcw className="mr-2 size-4" />
            Reset All
          </Button>

          <AccordionTrigger className="min-h-[92px] w-full px-4 py-4 pr-40 text-left hover:no-underline sm:px-6 sm:pr-44">
            <div className="flex min-w-0 items-start gap-3">
              <div className="shrink-0 rounded-xl bg-primary p-2.5 text-primary-foreground shadow-sm">
                <SlidersHorizontal className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold tracking-tight">
                    Report Filters
                  </h2>
                  <Badge variant="secondary">{activeCount} active</Badge>
                  {isDirty && <Badge variant="outline">Unsaved changes</Badge>}
                </div>
                <p className="mt-1 text-xs font-normal leading-5 text-muted-foreground sm:text-sm">
                  Configure filters, then apply them to the summary, tables,
                  charts, and Excel export.
                </p>
              </div>
            </div>
          </AccordionTrigger>
        </div>

        <AccordionContent className="pb-0">
          <div className="space-y-5 p-4 sm:p-6">
            <section className="rounded-xl border bg-muted/20 p-4">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold">
                    Report Scope and Lifecycle Date
                  </h3>
                  <p className="text-xs leading-5 text-muted-foreground">
                    Lead dates use creation date. Student dates use conversion
                    date, with creation date as fallback.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <FilterSelect
                  id="report-record-scope"
                  label="Report Scope"
                  value={draft.recordScope}
                  placeholder="Select report scope"
                  options={recordScopeOptions}
                  onChange={handleRecordScopeChange}
                />
                <FilterSelect
                  id="report-date-preset"
                  label="Lifecycle Date Range"
                  value={draft.datePreset}
                  placeholder="Select date range"
                  options={dateOptions}
                  onChange={handleDatePresetChange}
                />
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor="report-search" className="text-xs font-medium">
                    Search
                  </Label>
                  <Input
                    id="report-search"
                    value={draft.search}
                    className="h-10"
                    placeholder="Lead no., student, email, mobile, university or course"
                    onChange={(event) =>
                      updateFilter("search", event.target.value)
                    }
                  />
                </div>
              </div>

              {draft.datePreset === "custom" && (
                <div className="mt-4 grid gap-4 border-t pt-4 sm:grid-cols-2 xl:max-w-2xl">
                  <div className="space-y-1.5">
                    <Label htmlFor="report-start-date" className="text-xs">
                      Start Date
                    </Label>
                    <Input
                      id="report-start-date"
                      type="date"
                      className="h-10"
                      value={draft.startDate}
                      max={draft.endDate || undefined}
                      onChange={(event) =>
                        updateFilter("startDate", event.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="report-end-date" className="text-xs">
                      End Date
                    </Label>
                    <Input
                      id="report-end-date"
                      type="date"
                      className="h-10"
                      value={draft.endDate}
                      min={draft.startDate || undefined}
                      onChange={(event) =>
                        updateFilter("endDate", event.target.value)
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
            </section>

            <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              <section className="rounded-xl border p-4">
                <div className="mb-4 flex items-start gap-2">
                  <GitBranch className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold">Lead Pipeline</h3>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Branch and counselor options are already restricted by the
                      signed-in user role.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FilterSelect
                    id="report-branch"
                    label="Branch"
                    value={draft.branchId}
                    placeholder="All Accessible Branches"
                    options={options?.branches ?? []}
                    disabled={isLoading}
                    onChange={handleBranchChange}
                  />
                  <FilterSelect
                    id="report-counselor"
                    label={isUserScoped ? "Current User" : "Counselor / Associate"}
                    value={displayCounselorId}
                    placeholder={isUserScoped ? "Current User" : "All Counselors"}
                    options={counselorOptions}
                    disabled={isLoading || isUserScoped}
                    onChange={(nextValue) =>
                      updateFilter("counselorId", nextValue)
                    }
                  />
                  <FilterSelect
                    id="report-lead-status"
                    label="Lead Status"
                    value={draft.leadStatus}
                    placeholder="All Lead Statuses"
                    options={toStatusOptions(options?.leadStatuses ?? [])}
                    disabled={isLoading}
                    onChange={handleLeadStatusChange}
                  />
                  <FilterSelect
                    id="report-lead-source"
                    label="Lead Source"
                    value={draft.leadSource}
                    placeholder="All Lead Sources"
                    options={(options?.leadSources ?? []).map((source) => ({
                      value: source,
                      label: source,
                    }))}
                    disabled={isLoading}
                    onChange={(nextValue) =>
                      updateFilter("leadSource", nextValue)
                    }
                  />
                </div>
              </section>

              <section className="rounded-xl border p-4">
                <div className="mb-4 flex items-start gap-2">
                  <GraduationCap className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold">
                      Destination and Applications
                    </h3>
                    <p className="text-xs leading-5 text-muted-foreground">
                      University and application status apply to converted
                      students only.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FilterSelect
                    id="report-country"
                    label="Country"
                    value={draft.countryId}
                    placeholder="All Countries"
                    options={options?.countries ?? []}
                    disabled={isLoading}
                    onChange={handleCountryChange}
                  />
                  <FilterSelect
                    id="report-intake"
                    label="Intake"
                    value={draft.intakeId}
                    placeholder="All Intakes"
                    options={options?.intakes ?? []}
                    disabled={isLoading}
                    onChange={(nextValue) =>
                      updateFilter("intakeId", nextValue)
                    }
                  />
                  <FilterSelect
                    id="report-university"
                    label="University"
                    value={draft.universityId}
                    placeholder="All Universities"
                    options={universityOptions}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(nextValue) =>
                      updateFilter("universityId", nextValue)
                    }
                  />
                  <FilterSelect
                    id="report-application-status"
                    label="Application Status"
                    value={draft.applicationStatus}
                    placeholder="All Application Statuses"
                    options={toStatusOptions(
                      options?.applicationStatuses ?? [],
                    )}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(nextValue) =>
                      updateFilter("applicationStatus", nextValue)
                    }
                  />
                </div>
              </section>

              <section className="rounded-xl border p-4 xl:col-span-2 2xl:col-span-1">
                <div className="mb-4 flex items-start gap-2">
                  <Landmark className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div>
                    <h3 className="text-sm font-semibold">
                      Visa and Loan Filters
                    </h3>
                    <p className="text-xs leading-5 text-muted-foreground">
                      These filters apply only to converted students.
                    </p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FilterSelect
                    id="report-cas-status"
                    label="CAS Status"
                    value={draft.casStatus}
                    placeholder="All CAS Statuses"
                    options={toStatusOptions(options?.casStatuses ?? [])}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(nextValue) =>
                      updateFilter("casStatus", nextValue)
                    }
                  />
                  <FilterSelect
                    id="report-visa-status"
                    label="Visa Status"
                    value={draft.visaStatus}
                    placeholder="All Visa Statuses"
                    options={toStatusOptions(options?.visaStatuses ?? [])}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(nextValue) =>
                      updateFilter("visaStatus", nextValue)
                    }
                  />
                  <FilterSelect
                    id="report-loan-status"
                    label="Loan Status"
                    value={draft.loanStatus}
                    placeholder="All Loan Statuses"
                    options={toStatusOptions(options?.loanStatuses ?? [])}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(nextValue) =>
                      updateFilter("loanStatus", nextValue)
                    }
                  />
                  <FilterSelect
                    id="report-nbfc"
                    label="NBFC"
                    value={draft.nbfc}
                    placeholder="All NBFCs"
                    options={(options?.nbfcs ?? []).map((nbfc) => ({
                      value: nbfc,
                      label: nbfc,
                    }))}
                    disabled={isLoading || draft.recordScope === "leads"}
                    onChange={(nextValue) => updateFilter("nbfc", nextValue)}
                  />
                  <div className="sm:col-span-2">
                    <FilterSelect
                      id="report-fintech-assignee"
                      label="Fintech Assignee"
                      value={draft.fintechAssigneeId}
                      placeholder="All Fintech Assignees"
                      options={options?.fintechAssignees ?? []}
                      disabled={isLoading || draft.recordScope === "leads"}
                      onChange={(nextValue) =>
                        updateFilter("fintechAssigneeId", nextValue)
                      }
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-muted-foreground">
              Filters are applied only after selecting Apply Filters.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDraft(value)}
                disabled={!isDirty}
              >
                Cancel Changes
              </Button>
              <Button
                type="button"
                onClick={handleApply}
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
