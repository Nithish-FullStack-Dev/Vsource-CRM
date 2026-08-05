"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, SlidersHorizontal } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  value: DirectorReportFilters;
  options?: DirectorReportFilterOptions;
  isLoading?: boolean;
  onApply: (filters: DirectorReportFilters) => void;
};

const dateOptions: DirectorReportFilterOption[] = [
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

const scopeOptions: DirectorReportFilterOption[] = [
  { value: "all", label: "Walk-ins, Applications and Loans" },
  { value: "leads", label: "Walk-ins Only" },
  { value: "students", label: "Converted Students Only" },
];

const toOptions = (values: string[]) =>
  values.map((value) => ({
    value,
    label: value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase()),
  }));

function FilterSelect({
  id,
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  options: DirectorReportFilterOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={id}
        className="text-xs font-bold text-slate-700 dark:text-slate-300"
      >
        {label}
      </Label>
      <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id} className="w-full h-10 rounded-xl bg-background">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={`${id}:${option.value}`} value={option.value}>
              {option.roleName
                ? `${option.label} — ${option.roleName}`
                : option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DirectorReportFilterSheet({
  value,
  options,
  isLoading,
  onApply,
}: Props) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(value);
  const invalidCustom =
    draft.datePreset === "custom" && !draft.startDate && !draft.endDate;

  const users = useMemo(() => {
    const all = options?.users ?? [];
    return draft.branchId
      ? all.filter(
          (user) =>
            !user.branchIds?.length || user.branchIds.includes(draft.branchId),
        )
      : all;
  }, [draft.branchId, options]);

  const universities = useMemo(() => {
    const all = options?.universities ?? [];
    return draft.countryId
      ? all.filter((university) => university.countryId === draft.countryId)
      : all;
  }, [draft.countryId, options]);

  const set = <K extends keyof DirectorReportFilters>(
    key: K,
    next: DirectorReportFilters[K],
  ) => setDraft((current) => ({ ...current, [key]: next }));

  const reset = () => {
    const next = { ...DEFAULT_DIRECTOR_REPORT_FILTERS };
    setDraft(next);
    onApply(next);
  };

  return (
    <Accordion type="single" collapsible className="mb-5">
      <AccordionItem
        value="filters"
        className="overflow-hidden rounded-2xl border bg-card shadow-sm"
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
        <AccordionContent className="pb-0">
          <div className="grid gap-4 bg-muted/10 p-4 sm:p-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
            <FilterSelect
              id="director-scope"
              label="Report Scope"
              value={draft.recordScope}
              placeholder="Select scope"
              options={scopeOptions}
              onChange={(next) =>
                set("recordScope", next as DirectorReportRecordScope)
              }
            />

            <FilterSelect
              id="director-date"
              label="Date Range"
              value={draft.datePreset}
              placeholder="Select period"
              options={dateOptions}
              onChange={(next) =>
                setDraft((current) => ({
                  ...current,
                  datePreset: next as DirectorReportDatePreset,
                  startDate: next === "custom" ? current.startDate : "",
                  endDate: next === "custom" ? current.endDate : "",
                }))
              }
            />

            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="director-search"
                className="text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Search
              </Label>
              <Input
                id="director-search"
                value={draft.search}
                placeholder="Walkin number, student, mobile, email, university or course"
                className="h-10 rounded-xl"
                onChange={(event) => set("search", event.target.value)}
              />
            </div>

            {draft.datePreset === "custom" && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={draft.startDate}
                    max={draft.endDate || undefined}
                    className="h-10 rounded-xl"
                    onChange={(event) => set("startDate", event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    End Date
                  </Label>
                  <Input
                    type="date"
                    value={draft.endDate}
                    min={draft.startDate || undefined}
                    className="h-10 rounded-xl"
                    onChange={(event) => set("endDate", event.target.value)}
                  />
                </div>
              </>
            )}

            <FilterSelect
              id="director-branch"
              label="Branch"
              value={draft.branchId}
              placeholder="All Branches"
              options={options?.branches ?? []}
              disabled={isLoading}
              onChange={(branchId) =>
                setDraft((current) => ({
                  ...current,
                  branchId,
                  counselorId: "",
                }))
              }
            />

            <FilterSelect
              id="director-user"
              label="User"
              value={draft.counselorId}
              placeholder="All Users"
              options={users}
              disabled={isLoading}
              onChange={(next) => set("counselorId", next)}
            />

            <FilterSelect
              id="director-status"
              label="Walk-in Status"
              value={draft.leadStatus}
              placeholder="All Statuses"
              options={toOptions(options?.leadStatuses ?? [])}
              disabled={isLoading}
              onChange={(next) => set("leadStatus", next)}
            />

            <FilterSelect
              id="director-source"
              label="Walk-in Source"
              value={draft.source}
              placeholder="All Sources"
              options={(options?.sources ?? []).map((item) => ({
                value: item,
                label: item,
              }))}
              disabled={isLoading}
              onChange={(next) => set("source", next)}
            />

            <FilterSelect
              id="director-country"
              label="Country"
              value={draft.countryId}
              placeholder="All Countries"
              options={options?.countries ?? []}
              disabled={isLoading}
              onChange={(countryId) =>
                setDraft((current) => ({
                  ...current,
                  countryId,
                  universityId: "",
                }))
              }
            />

            <FilterSelect
              id="director-intake"
              label="Intake"
              value={draft.intakeId}
              placeholder="All Intakes"
              options={options?.intakes ?? []}
              disabled={isLoading}
              onChange={(next) => set("intakeId", next)}
            />

            <FilterSelect
              id="director-university"
              label="University"
              value={draft.universityId}
              placeholder="All Universities"
              options={universities}
              disabled={isLoading || draft.recordScope === "leads"}
              onChange={(next) => set("universityId", next)}
            />

            <FilterSelect
              id="director-app-status"
              label="University Application Status"
              value={draft.applicationStatus}
              placeholder="All University Application Statuses"
              options={toOptions(options?.applicationStatuses ?? [])}
              disabled={isLoading || draft.recordScope === "leads"}
              onChange={(next) => set("applicationStatus", next)}
            />

            <FilterSelect
              id="director-cas"
              label="CAS Status"
              value={draft.casStatus}
              placeholder="All CAS Statuses"
              options={toOptions(options?.casStatuses ?? [])}
              disabled={isLoading || draft.recordScope === "leads"}
              onChange={(next) => set("casStatus", next)}
            />

            <FilterSelect
              id="director-visa"
              label="Visa Status"
              value={draft.visaStatus}
              placeholder="All Visa Statuses"
              options={toOptions(options?.visaStatuses ?? [])}
              disabled={isLoading || draft.recordScope === "leads"}
              onChange={(next) => set("visaStatus", next)}
            />

            <FilterSelect
              id="director-loan"
              label="Loan Status"
              value={draft.loanStatus}
              placeholder="All Loan Statuses"
              options={toOptions(options?.loanStatuses ?? [])}
              disabled={isLoading}
              onChange={(next) => set("loanStatus", next)}
            />

            <FilterSelect
              id="director-nbfc"
              label="NBFC / Bank"
              value={draft.nbfc}
              placeholder="All NBFCs / Banks"
              options={(options?.nbfcs ?? []).map((item) => ({
                value: item,
                label: item,
              }))}
              disabled={isLoading}
              onChange={(next) => set("nbfc", next)}
            />

            <FilterSelect
              id="director-fintech"
              label="Fintech Assignee"
              value={draft.fintechAssigneeId}
              placeholder="All Fintech Assignees"
              options={options?.fintechAssignees ?? []}
              disabled={isLoading}
              onChange={(next) => set("fintechAssigneeId", next)}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/60 p-4 bg-card rounded-b-2xl">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl h-9 text-xs font-bold"
              disabled={!isDirty}
              onClick={() => setDraft(value)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-xl h-9 text-xs font-bold"
              disabled={!isDirty || invalidCustom}
              onClick={() => onApply(draft)}
            >
              Apply Filters
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
