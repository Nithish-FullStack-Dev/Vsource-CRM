"use client";

import { useCallback, useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentIstDate } from "@/lib/performance-period";
import {
  useExportPerformance,
  usePerformance,
  useUpdateMonthlyTarget,
} from "@/hooks/assign-target/usePerformance";
import {
  downloadBlob,
  getErrorMessage,
} from "@/services/performance/performance";
import type {
  CounsellorPerformance,
  PerformancePeriodType,
  PerformanceQueryParams,
  PerformanceSortField,
  TargetDialogCounsellor,
} from "@/types/counsellor-performance";
import { PerformanceSummary } from "@/components/assign-target/performance-summary";
import { PerformanceFilters } from "@/components/assign-target/performance-filters";
import { PerformanceTable } from "@/components/assign-target/performance-table";
import { TargetDialog } from "@/components/assign-target/target-dialog";
import { useDebouncedValue } from "@/hooks/assign-target/useDebouncedValue";
import { useAuth } from "@/store";

const DEFAULT_SUMMARY = {
  totalCounsellors: 0,
  totalTarget: 0,
  totalAchieved: 0,
  totalLeadsCreated: 0,
  completionPercentage: 0,
};

const SORT_FIELDS = new Set<PerformanceSortField>([
  "name",
  "target",
  "achieved",
  "leadsCreated",
  "completionPercentage",
]);

function getSortField(sorting: SortingState): PerformanceSortField {
  const value = sorting[0]?.id as PerformanceSortField | undefined;

  return value && SORT_FIELDS.has(value) ? value : "completionPercentage";
}

export default function CounsellorPerformancePage() {
  const [period, setPeriod] = useState<PerformancePeriodType>("monthly");
  const [date, setDate] = useState(() => getCurrentIstDate());
  const [branchId, setBranchId] = useState("all");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: "completionPercentage",
      desc: true,
    },
  ]);
  const [targetDialogCounsellor, setTargetDialogCounsellor] =
    useState<TargetDialogCounsellor | null>(null);

  const [customStartDate, setCustomStartDate] = useState(() =>
    getCurrentIstDate(),
  );

  const [customEndDate, setCustomEndDate] = useState(() => getCurrentIstDate());

  const { canCreate, canUpdate } = useAuth();

  const debouncedSearch = useDebouncedValue(search);

  const queryParams = useMemo<PerformanceQueryParams>(
    () => ({
      period,
      date,
      startDate: period === "custom" ? customStartDate : undefined,
      endDate: period === "custom" ? customEndDate : undefined,
      branchId,
      search: debouncedSearch,
      sortBy: getSortField(sorting),
      sortOrder: sorting[0]?.desc === false ? "asc" : "desc",
    }),
    [
      branchId,
      customEndDate,
      customStartDate,
      date,
      debouncedSearch,
      period,
      sorting,
    ],
  );

  const performanceQuery = usePerformance(queryParams);
  const updateTargetMutation = useUpdateMonthlyTarget();
  const exportMutation = useExportPerformance();
  const performanceData = performanceQuery.data;
  const isInitialLoading = performanceQuery.isPending && !performanceData;
  const isRefreshing = performanceQuery.isFetching && Boolean(performanceData);
  const periodLabel = performanceData?.period.label ?? "selected period";

  const handleCustomStartDateChange = useCallback((value: string) => {
    if (!value) {
      return;
    }

    setCustomStartDate(value);

    setCustomEndDate((currentEndDate) =>
      currentEndDate < value ? value : currentEndDate,
    );
  }, []);

  const handleCustomEndDateChange = useCallback((value: string) => {
    if (!value) {
      return;
    }

    setCustomEndDate(value);

    setCustomStartDate((currentStartDate) =>
      currentStartDate > value ? value : currentStartDate,
    );
  }, []);

  const openTargetDialog = useCallback((counsellor: CounsellorPerformance) => {
    setTargetDialogCounsellor({
      id: counsellor.id,
      name: counsellor.name,
      target: counsellor.target,
    });
  }, []);

  const closeTargetDialog = useCallback(() => {
    if (!updateTargetMutation.isPending) {
      setTargetDialogCounsellor(null);
    }
  }, [updateTargetMutation.isPending]);

  const handleSaveTarget = async (target: number) => {
    if (!targetDialogCounsellor || !performanceData) {
      return;
    }

    try {
      await updateTargetMutation.mutateAsync({
        counsellorId: targetDialogCounsellor.id,
        year: performanceData.period.year,
        month: performanceData.period.month,
        target,
      });
      setTargetDialogCounsellor(null);
      toast.success("Monthly target updated successfully");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleExport = async () => {
    try {
      const result = await exportMutation.mutateAsync(queryParams);
      downloadBlob(result.blob, result.filename);
      toast.success("Excel report exported successfully");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleClearFilters = useCallback(() => {
    const today = getCurrentIstDate();

    setPeriod("monthly");
    setDate(today);
    setCustomStartDate(today);
    setCustomEndDate(today);
    setBranchId("all");
    setSearch("");
    setSorting([
      {
        id: "completionPercentage",
        desc: true,
      },
    ]);
  }, []);

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Assign Target
          </h1>
          {isRefreshing && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Track daily, weekly and monthly performance and export the filtered
          report to Excel.
        </p>
      </div>

      {performanceQuery.isError && (
        <Card className="border-destructive">
          <CardContent className="p-5">
            <p className="font-medium text-destructive">
              Unable to load counsellor performance
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {getErrorMessage(performanceQuery.error)}
            </p>
          </CardContent>
        </Card>
      )}

      <PerformanceSummary
        summary={performanceData?.summary ?? DEFAULT_SUMMARY}
        periodLabel={periodLabel}
        isLoading={isInitialLoading}
      />

      <PerformanceFilters
        period={period}
        date={date}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        branchId={branchId}
        onClearFilters={handleClearFilters}
        search={search}
        branches={performanceData?.availableBranches ?? []}
        isRefreshing={performanceQuery.isFetching}
        isExporting={exportMutation.isPending}
        onPeriodChange={setPeriod}
        onDateChange={setDate}
        onCustomStartDateChange={handleCustomStartDateChange}
        onCustomEndDateChange={handleCustomEndDateChange}
        onBranchChange={setBranchId}
        onSearchChange={setSearch}
        onRefresh={() => void performanceQuery.refetch()}
        onExport={() => void handleExport()}
      />

      <PerformanceTable
        data={performanceData?.counsellors ?? []}
        periodLabel={periodLabel}
        sorting={sorting}
        isLoading={isInitialLoading}
        isError={performanceQuery.isError && !performanceData}
        canSetTarget={period === "monthly"}
        onSortingChange={setSorting}
        onSetTarget={openTargetDialog}
        canCreate={canCreate}
        canUpdate={canUpdate}
      />

      <TargetDialog
        counsellor={targetDialogCounsellor}
        periodLabel={periodLabel}
        isSaving={updateTargetMutation.isPending}
        onClose={closeTargetDialog}
        onSave={(target) => void handleSaveTarget(target)}
      />
    </div>
  );
}
