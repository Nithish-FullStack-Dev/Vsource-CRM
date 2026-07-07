// app\(dashboard)\master-tracker\TrackerFilter.tsx
"use client";

import { Dispatch, SetStateAction } from "react";
import { Search, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type TrackerFilters = {
  search: string;
  dateRange: string;
  branchId: string;
  counselorId: string;
  country: string;
  intake: string;
  stage: string;
  moduleStatus: string;
  recordType: string;
};

type TrackerFilterProps = {
  filters: TrackerFilters;
  setFilters: Dispatch<SetStateAction<TrackerFilters>>;
  branchOptions: string[];
  counselorOptions: string[];
  countryOptions: string[];
  intakeOptions: string[];
};

export default function TrackerFilter({
  filters,
  setFilters,
  branchOptions,
  counselorOptions,
  countryOptions,
  intakeOptions,
}: TrackerFilterProps) {
  const resetFilters = () => {
    setFilters({
      search: "",
      dateRange: "all",
      branchId: "",
      counselorId: "",
      country: "",
      intake: "",
      stage: "",
      moduleStatus: "",
      recordType: "",
    });
  };

  return (
    <div className="rounded-3xl border bg-background p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-1">
        <h3 className="text-lg font-bold tracking-tight">
          Master Tracker Filters
        </h3>

        <p className="text-sm text-muted-foreground">
          Filter applications by branch, counselor, country, intake, stage, and
          enrollment progress.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search student..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value,
              }))
            }
            className="pl-10"
          />
        </div>

        {/* Date Range */}
        <Select
          value={filters.dateRange}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              dateRange: value,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
          </SelectContent>
        </Select>

        {/* Branch */}
        <Select
          value={filters.branchId || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              branchId: value === "all" ? "" : value,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Branches" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>

            {branchOptions.map((branch) => (
              <SelectItem key={branch} value={branch}>
                {branch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Counselor */}
        <Select
          value={filters.counselorId || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              counselorId: value === "all" ? "" : value,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Counselors" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Counselors</SelectItem>

            {counselorOptions.map((counselor) => (
              <SelectItem key={counselor} value={counselor}>
                {counselor}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Country */}
        <Select
          value={filters.country || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              country: value === "all" ? "" : value,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Countries" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>

            {countryOptions.map((country) => (
              <SelectItem key={country} value={country}>
                {country}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Intake */}
        <Select
          value={filters.intake || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              intake: value === "all" ? "" : value,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Intakes" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Intakes</SelectItem>

            {intakeOptions.map((intake) => (
              <SelectItem key={intake} value={intake}>
                {intake}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Stage */}
        <Select
          value={filters.stage || "all"}
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              stage: value === "all" ? "" : value,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Stages" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="Inquiry">Inquiry</SelectItem>
            <SelectItem value="Documents">Documents</SelectItem>
            <SelectItem value="Applied">Applied</SelectItem>
            <SelectItem value="Visa Process">Visa Process</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Button */}
        <Button variant="outline" onClick={resetFilters} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Reset Filters
        </Button>
      </div>
    </div>
  );
}
