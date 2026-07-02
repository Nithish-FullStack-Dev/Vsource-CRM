"use client";

import { Download, Loader2, RefreshCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Branch,
  PerformancePeriodType,
} from "@/types/counsellor-performance";

type PerformanceFiltersProps = {
  period: PerformancePeriodType;
  date: string;
  customStartDate: string;
  customEndDate: string;
  branchId: string;
  search: string;
  branches: Branch[];
  isRefreshing: boolean;
  isExporting: boolean;
  onPeriodChange: (value: PerformancePeriodType) => void;
  onDateChange: (value: string) => void;
  onCustomStartDateChange: (value: string) => void;
  onCustomEndDateChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onExport: () => void;
  onClearFilters: () => void;
};

export function PerformanceFilters({
  period,
  date,
  customStartDate,
  customEndDate,
  branchId,
  search,
  branches,
  isRefreshing,
  isExporting,
  onPeriodChange,
  onDateChange,
  onCustomStartDateChange,
  onCustomEndDateChange,
  onBranchChange,
  onSearchChange,
  onRefresh,
  onExport,
  onClearFilters,
}: PerformanceFiltersProps) {
  const isMonthly = period === "monthly";
  const isCustom = period === "custom";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base">Report Filters</CardTitle>
            <CardDescription>
              Filters, sorting and Excel export are processed by the backend.
            </CardDescription>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={onClearFilters}>
              Clear Filters
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={isRefreshing}
              onClick={onRefresh}
            >
              {isRefreshing ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 size-4" />
              )}
              Refresh
            </Button>

            <Button type="button" disabled={isExporting} onClick={onExport}>
              {isExporting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Download className="mr-2 size-4" />
              )}
              Export Excel
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div
          className={`grid gap-4 md:grid-cols-2 ${
            isCustom ? "xl:grid-cols-5" : "xl:grid-cols-4"
          }`}
        >
          <div className="space-y-2">
            <Label htmlFor="performance-period">Period</Label>

            <Select
              value={period}
              onValueChange={(value) =>
                onPeriodChange(value as PerformancePeriodType)
              }
            >
              <SelectTrigger id="performance-period">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isCustom ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="performance-start-date">From date</Label>

                <Input
                  id="performance-start-date"
                  type="date"
                  value={customStartDate}
                  max={customEndDate}
                  onChange={(event) =>
                    onCustomStartDateChange(event.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="performance-end-date">To date</Label>

                <Input
                  id="performance-end-date"
                  type="date"
                  value={customEndDate}
                  min={customStartDate}
                  onChange={(event) =>
                    onCustomEndDateChange(event.target.value)
                  }
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="performance-date">
                {isMonthly ? "Month" : "Date"}
              </Label>

              <Input
                id="performance-date"
                type={isMonthly ? "month" : "date"}
                value={isMonthly ? date.slice(0, 7) : date}
                onChange={(event) => {
                  const value = event.target.value;

                  if (!value) {
                    return;
                  }

                  onDateChange(isMonthly ? `${value}-01` : value);
                }}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="performance-branch">Branch</Label>

            <Select value={branchId} onValueChange={onBranchChange}>
              <SelectTrigger id="performance-branch">
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All branches</SelectItem>

                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="counsellor-search">Search</Label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                id="counsellor-search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Name, email or branch"
                className="pl-9"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
