"use client";

import React, { useEffect } from "react";
import { BranchOption, IntakeOption, UserOption } from "@/lib/crmTypes";
import { Filter, Calendar, MapPin, Users, Hash } from "lucide-react";
import { useAuth } from "@/store";
import { ROLES } from "@/config/roles";

interface PerformanceFiltersProps {
  branches: BranchOption[];
  users: UserOption[];
  intakes: IntakeOption[];
  selectedBranch: string;
  setSelectedBranch: (val: string) => void;
  selectedUser: string;
  setSelectedUser: (val: string) => void;
  selectedIntake: string;
  setSelectedIntake: (val: string) => void;
  selectedDateRange: "today" | "week" | "month" | "custom";
  setSelectedDateRange: (val: "today" | "week" | "month" | "custom") => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
}

export default function PerformanceFilters({
  branches,
  users,
  intakes,
  selectedBranch,
  setSelectedBranch,
  selectedUser,
  setSelectedUser,
  selectedIntake,
  setSelectedIntake,
  selectedDateRange,
  setSelectedDateRange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: PerformanceFiltersProps) {
  const { user } = useAuth();

  const filteredUsers =
    selectedBranch === "all"
      ? users
      : users.filter((u) => u.branchIds.includes(selectedBranch));

  useEffect(() => {
    if (selectedBranch !== "all" && selectedUser !== "all") {
      const belongs = users.some(
        (u) => u.id === selectedUser && u.branchIds.includes(selectedBranch),
      );

      if (!belongs) {
        setSelectedUser("all");
      }
    }
  }, [selectedBranch, selectedUser, setSelectedUser, users]);

  return (
    <div
      id="filters-container"
      className="rounded-xl border bg-card p-5 text-card-foreground shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2">
        <Filter size={14} className="text-red-600" />
        <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
          Smart Performance Filters
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <div id="branch-filter-group" className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
            <MapPin size={10} className="text-red-600" />
            Branch
          </label>

          <select
            id="branch-select"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none transition-colors focus:ring-2 focus:ring-red-600"
          >
            <option value="all">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {(user?.role?.name === ROLES.SUPER_ADMIN ||
          user?.role?.name === ROLES.DIRECTOR) && (
          <div id="user-filter-group" className="flex flex-col gap-1">
            <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
              <Users size={10} className="text-red-600" />
              User
            </label>

            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none transition-colors focus:ring-2 focus:ring-red-600"
            >
              <option value="all">All Users</option>

              {filteredUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>
        )}

        <div id="intake-filter-group" className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
            <Hash size={10} className="text-red-600" />
            Intake
          </label>

          <select
            id="intake-select"
            value={selectedIntake}
            onChange={(e) => setSelectedIntake(e.target.value)}
            className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs font-medium text-foreground outline-none transition-colors focus:ring-2 focus:ring-red-600"
          >
            <option value="all">All Intakes</option>

            {intakes.map((i) => (
              <option key={i.id} value={i.name}>
                {i.name}
              </option>
            ))}
          </select>
        </div>

        <div id="daterange-filter-group" className="flex flex-col gap-1">
          <label className="flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
            <Calendar size={10} className="text-red-600" />
            Activity Period
          </label>

          <div className="flex rounded-md border border-input bg-background p-0.5">
            {(["today", "week", "month", "custom"] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setSelectedDateRange(range)}
                className={`flex-1 rounded py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  selectedDateRange === range
                    ? "bg-red-600 text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {range === "week"
                  ? "WEEK"
                  : range === "month"
                    ? "MONTH"
                    : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedDateRange === "custom" && (
        <div
          id="custom-date-fields"
          className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 md:grid-cols-2"
        >
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Start Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground outline-none transition-colors focus:ring-2 focus:ring-red-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              End Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2 py-1 text-xs font-medium text-foreground outline-none transition-colors focus:ring-2 focus:ring-red-600"
            />
          </div>
        </div>
      )}
    </div>
  );
}
