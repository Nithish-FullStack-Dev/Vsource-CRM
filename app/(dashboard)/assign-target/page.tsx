"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  Target,
  BookOpen,
  CheckSquare,
  HelpCircle,
  Loader2,
} from "lucide-react";
import PerformanceFilters from "@/components/assign-target/PerformanceFilters";
import SummaryCard from "@/components/assign-target/SummaryCard";
import PerformanceTable from "@/components/assign-target/PerformanceTable";
import ToastContainer, {
  Toast,
} from "@/components/assign-target/ToastNotification";
import { motion } from "motion/react";
import {
  BranchOption,
  IntakeOption,
  MastersResponse,
  UserOption,
} from "@/lib/crmTypes";

function getDateValue(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getCurrentMonthRange() {
  const now = new Date();
  return {
    start: getDateValue(new Date(now.getFullYear(), now.getMonth(), 1)),
    end: getDateValue(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

export default function TargetPerformancePage() {
  const currentMonthRange = getCurrentMonthRange();
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [intakes, setIntakes] = useState<IntakeOption[]>([]);
  const [isMastersLoaded, setIsMastersLoaded] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedIntake, setSelectedIntake] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<
    "today" | "week" | "month" | "custom"
  >("month");
  const [startDate, setStartDate] = useState<string>(currentMonthRange.start);
  const [endDate, setEndDate] = useState<string>(currentMonthRange.end);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isFilterLoading, setIsFilterLoading] = useState<boolean>(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState<boolean>(false);
  const [modalBranch, setModalBranch] = useState<string>("");
  const [modalUser, setModalUser] = useState<string>("");
  const [modalIntake, setModalIntake] = useState<string>("");
  const [modalTarget, setModalTarget] = useState<string>("");
  const [isModalSaving, setIsModalSaving] = useState<boolean>(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 5);
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/masters");
        if (!res.ok) {
          throw new Error("Failed to load CRM master data");
        }
        const json = (await res.json()) as MastersResponse;
        setBranches(json.branches);
        setUsers(json.users);
        setIntakes(json.intakes);
        setSelectedIntake(json.defaultIntake || "all");
        setModalBranch(
          json.defaultBranch === "all"
            ? (json.branches[0]?.id ?? "")
            : json.defaultBranch,
        );
        setModalUser(
          json.defaultUser === "all"
            ? (json.users[0]?.id ?? "")
            : json.defaultUser,
        );
        setModalIntake(
          json.defaultIntake === "all"
            ? (json.intakes[0]?.name ?? "")
            : json.defaultIntake,
        );
        setIsMastersLoaded(true);
      } catch (err: any) {
        console.error(err);
        addToast("error", err.message || "Unable to fetch CRM master data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMasters();
  }, [addToast]);

  const fetchPerformanceData = useCallback(
    async (isInitial = false) => {
      if (!isMastersLoaded) return;

      if (isInitial) {
        setIsLoading(true);
      } else {
        setIsFilterLoading(true);
      }

      try {
        const params = new URLSearchParams({
          branchId: selectedBranch,
          userId: selectedUser,
          intake: selectedIntake,
          dateRangeType: selectedDateRange,
        });

        if (selectedDateRange === "custom") {
          if (startDate) params.append("startDate", startDate);
          if (endDate) params.append("endDate", endDate);
        }

        const res = await fetch(`/api/assign-target?${params.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load performance metrics");
        }

        const json = await res.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        addToast(
          "error",
          err.message || "Unable to fetch CRM data. Please retry.",
        );
      } finally {
        setIsLoading(false);
        setIsFilterLoading(false);
      }
    },
    [
      selectedBranch,
      selectedUser,
      selectedIntake,
      selectedDateRange,
      startDate,
      endDate,
      addToast,
      isMastersLoaded,
    ],
  );

  useEffect(() => {
    if (!isMastersLoaded) return;
    const timer = setTimeout(() => {
      fetchPerformanceData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchPerformanceData, isMastersLoaded]);

  const handleUpdateTarget = async (
    branchId: string,
    userId: string,
    targetValue: number,
  ): Promise<boolean> => {
    setSavingUserId(userId);
    try {
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          userId,
          intake: selectedIntake,
          target: targetValue,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to update target value");
      }

      setData((prevData: any) => {
        if (!prevData) return prevData;

        const updatedBranches = prevData.branches.map((branch: any) => {
          if (branch.branchId !== branchId) return branch;

          const userIndex = branch.users.findIndex(
            (u: any) => u.userId === userId,
          );
          if (userIndex === -1) return branch;

          const updatedUsers = [...branch.users];
          const user = { ...updatedUsers[userIndex] };
          user.target = targetValue;
          user.progress =
            targetValue > 0
              ? parseFloat(
                  ((user.visaConversions / targetValue) * 100).toFixed(1),
                )
              : 0;
          updatedUsers[userIndex] = user;

          const totalsTarget = updatedUsers.reduce(
            (sum: number, u: any) => sum + u.target,
            0,
          );
          const totalsVisa = updatedUsers.reduce(
            (sum: number, u: any) => sum + u.visaConversions,
            0,
          );
          const totalsProgress =
            totalsTarget > 0
              ? parseFloat(((totalsVisa / totalsTarget) * 100).toFixed(1))
              : 0;

          return {
            ...branch,
            users: updatedUsers,
            totals: {
              ...branch.totals,
              target: totalsTarget,
              progress: totalsProgress,
            },
          };
        });

        const grandTarget = updatedBranches.reduce(
          (sum: number, b: any) => sum + b.totals.target,
          0,
        );
        const grandVisa = updatedBranches.reduce(
          (sum: number, b: any) => sum + b.totals.visaConversions,
          0,
        );
        const grandProgress =
          grandTarget > 0
            ? parseFloat(((grandVisa / grandTarget) * 100).toFixed(1))
            : 0;

        return {
          ...prevData,
          summary: {
            ...prevData.summary,
            target: grandTarget,
            progress: grandProgress,
          },
          branches: updatedBranches,
          grandTotal: {
            ...prevData.grandTotal,
            target: grandTarget,
            progress: grandProgress,
          },
        };
      });

      addToast(
        "success",
        `Target updated successfully to ${targetValue.toLocaleString()} for the ${selectedIntake} Intake!`,
      );
      return true;
    } catch (err: any) {
      console.error(err);
      addToast(
        "error",
        err.message || "Failed to update target. Please check permission.",
      );
      return false;
    } finally {
      setSavingUserId(null);
    }
  };

  const handleModalSave = async () => {
    if (!modalTarget || !modalBranch || !modalUser || !modalIntake) return;
    setIsModalSaving(true);
    try {
      const targetNum = parseInt(modalTarget, 10) || 0;
      const res = await fetch("/api/targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: modalBranch,
          userId: modalUser,
          intake: modalIntake,
          target: targetNum,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to assign target");
      }

      addToast(
        "success",
        `Target of ${targetNum.toLocaleString()} assigned successfully to user in database!`,
      );
      setIsAssignModalOpen(false);
      setModalTarget("");

      fetchPerformanceData();
    } catch (err: any) {
      console.error(err);
      addToast(
        "error",
        err.message || "Could not assign target. Please retry.",
      );
    } finally {
      setIsModalSaving(false);
    }
  };

  const handleExportReport = () => {
    if (!data) {
      addToast(
        "error",
        "No data available to export yet. Please wait for the dashboard to load.",
      );
      return;
    }

    try {
      const headers = [
        "Branch Name",
        "User Name",
        "Role",
        "Assigned Target",
        "Walk-ins Logged",
        "Applications Formed",
        "Visa Conversions",
        "Conversion Progress %",
      ];

      const rows: string[][] = [];

      data.branches.forEach((branch: any) => {
        branch.users.forEach((user: any) => {
          rows.push([
            branch.branchName,
            user.userName,
            user.role,
            user.target.toString(),
            user.walkIns.toString(),
            user.applications.toString(),
            user.visaConversions.toString(),
            `${user.progress}%`,
          ]);
        });
        rows.push([
          `${branch.branchName} TOTAL`,
          "—",
          "—",
          branch.totals.target.toString(),
          branch.totals.walkIns.toString(),
          branch.totals.applications.toString(),
          branch.totals.visaConversions.toString(),
          `${branch.totals.progress}%`,
        ]);
      });

      rows.push([
        "GRAND GLOBAL TOTAL",
        "—",
        "—",
        data.grandTotal.target.toString(),
        data.grandTotal.walkIns.toString(),
        data.grandTotal.applications.toString(),
        data.grandTotal.visaConversions.toString(),
        `${data.grandTotal.progress}%`,
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map((row) =>
          row.map((val) => `"${val.replace(/"/g, '""')}"`).join(","),
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const intakeLabel =
        selectedIntake !== "all"
          ? `_${selectedIntake.replace(/\s+/g, "_")}`
          : "_All_Intakes";
      link.setAttribute(
        "download",
        `VSource_CRM_Performance_Report${intakeLabel}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      addToast(
        "success",
        "Performance metrics report successfully exported to Excel/CSV!",
      );
    } catch (err: any) {
      console.error("Export failure:", err);
      addToast(
        "error",
        "Failed to generate Excel/CSV report. Please try again.",
      );
    }
  };

  return (
    <main className="min-h-screen transition-colors duration-300 font-sans pb-16 bg-background text-[#09090b]">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-2">
          <div>
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              Assign Target
            </h2>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium leading-relaxed">
              Track daily, weekly and monthly performance and export the
              filtered report to Excel.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportReport}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-border bg-background text-foreground hover:bg-muted transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <BookOpen size={13} className="text-red-600" />
              <span>Export Report</span>
            </button>
            <button
              onClick={() => {
                if (selectedBranch !== "all") {
                  setModalBranch(selectedBranch);
                  const branchUsers = users.filter((u) =>
                    u.branchIds.includes(selectedBranch),
                  );
                  if (branchUsers.length > 0) {
                    setModalUser(branchUsers[0].id);
                  }
                } else if (!modalBranch && branches.length > 0) {
                  setModalBranch(branches[0].id);
                }
                if (selectedIntake !== "all") {
                  setModalIntake(selectedIntake);
                } else if (!modalIntake && intakes.length > 0) {
                  setModalIntake(intakes[0].name);
                }
                setIsAssignModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-red-600 hover:bg-red-700 text-white transition-all flex items-center gap-2 shadow-sm shadow-red-600/10 active:scale-[0.98] cursor-pointer"
            >
              <Target size={13} />
              <span>Assign Target</span>
            </button>
          </div>
        </div>

        <PerformanceFilters
          branches={branches}
          users={users}
          intakes={intakes}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          selectedIntake={selectedIntake}
          setSelectedIntake={setSelectedIntake}
          selectedDateRange={selectedDateRange}
          setSelectedDateRange={setSelectedDateRange}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
        />

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-3 rounded border animate-pulse flex flex-col gap-1.5 bg-muted border-border"
              >
                <div className="flex justify-between items-center">
                  <div className="w-16 h-2 bg-gray-300 rounded" />
                  <div className="w-4 h-4 bg-gray-300 rounded" />
                </div>
                <div className="w-20 h-6 bg-gray-300 rounded" />
                <div className="w-24 h-2 bg-gray-300 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div
            id="summary-cards-grid"
            className={`grid grid-cols-2 md:grid-cols-4 gap-3 transition-opacity duration-300 ${
              isFilterLoading ? "opacity-70" : "opacity-100"
            }`}
          >
            <SummaryCard
              id="card-target"
              title="Total Target"
              value={data?.summary?.target ?? 0}
              icon={Target}
              subtext={
                selectedIntake === "all"
                  ? "Aggregated over all intakes"
                  : `For ${selectedIntake} Intake`
              }
            />
            <SummaryCard
              id="card-walkins"
              title="Walk-ins"
              value={data?.summary?.walkIns ?? 0}
              icon={Users}
              subtext="Total walk-in records registered"
            />
            <SummaryCard
              id="card-applications"
              title="Applications"
              value={data?.summary?.applications ?? 0}
              icon={BookOpen}
              subtext="Walk-ins converted to application status"
            />
            <SummaryCard
              id="card-visa"
              title="Visa Approved"
              value={data?.summary?.visaConversions ?? 0}
              icon={CheckSquare}
              subtext="Applications converted to approved visas"
            />
          </div>
        )}

        {isLoading ? (
          <div className="w-full rounded-2xl border p-4 flex flex-col gap-3 animate-pulse bg-background border-gray-150 shadow-sm">
            <div className="flex gap-4 border-b pb-2 border-border">
              <div className="w-1/4 h-4 bg-gray-300 rounded" />
              <div className="w-1/4 h-4 bg-gray-300 rounded" />
              <div className="w-1/4 h-4 bg-gray-300 rounded" />
              <div className="w-1/4 h-4 bg-gray-300 rounded" />
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 justify-between">
                <div className="w-1/5 h-6 bg-gray-300 rounded" />
                <div className="w-1/5 h-6 bg-gray-300 rounded" />
                <div className="w-1/5 h-6 bg-gray-300 rounded" />
                <div className="w-1/5 h-6 bg-gray-300 rounded" />
                <div className="w-1/5 h-6 bg-gray-300 rounded" />
              </div>
            ))}
          </div>
        ) : !data || data.branches.length === 0 ? (
          <div className="w-full rounded-2xl border p-12 text-center flex flex-col items-center justify-center gap-3 bg-background border-gray-150 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
              <HelpCircle size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-800">
                No performance records found
              </h3>
              <p className="text-xs mt-1 text-zinc-500">
                Try adjusting your intake, branch or date filters.
              </p>
            </div>
          </div>
        ) : (
          <div
            id="table-section"
            className={`transition-opacity duration-300 relative ${
              isFilterLoading ? "opacity-75" : "opacity-100"
            }`}
          >
            {isFilterLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/5 backdrop-blur-[1px] rounded-lg">
                <div className="bg-zinc-900 text-white border border-zinc-800/80 px-3 py-2 rounded-lg shadow-xl flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-red-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Updating View...
                  </span>
                </div>
              </div>
            )}

            <PerformanceTable
              branches={data.branches}
              grandTotal={data.grandTotal}
              selectedIntake={selectedIntake}
              isAllBranches={selectedBranch === "all"}
              isAllUsers={selectedUser === "all"}
              onUpdateTarget={handleUpdateTarget}
              savingUserId={savingUserId}
            />
          </div>
        )}
      </div>

      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 rounded-2xl border transition-all bg-background border-gray-150 text-foreground shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Target className="text-red-600 animate-pulse" size={18} />
                <h3 className="text-sm font-black uppercase tracking-wider">
                  Assign Global Target
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAssignModalOpen(false);
                  setModalTarget("");
                }}
                className="text-gray-400 hover:text-red-600 transition-colors text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Select Branch
                </label>
                <select
                  value={modalBranch}
                  onChange={(e) => {
                    const nextBranch = e.target.value;
                    setModalBranch(nextBranch);
                    const branchUsers = users.filter((u) =>
                      u.branchIds.includes(nextBranch),
                    );
                    if (branchUsers.length > 0) {
                      setModalUser(branchUsers[0].id);
                    }
                  }}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-red-600 outline-none font-medium text-foreground"
                >
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Select Counsellor / Advisor
                </label>
                <select
                  value={modalUser}
                  onChange={(e) => setModalUser(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-red-600 outline-none font-medium text-foreground"
                >
                  {users
                    .filter((u) => u.branchIds.includes(modalBranch))
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Select Intake
                </label>
                <select
                  value={modalIntake}
                  onChange={(e) => setModalIntake(e.target.value)}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-red-600 outline-none font-medium text-foreground"
                >
                  {intakes.map((i) => (
                    <option key={i.id} value={i.name}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Target Value
                </label>
                <input
                  type="number"
                  placeholder="e.g. 20"
                  value={modalTarget}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "" || /^\d+$/.test(val)) {
                      setModalTarget(val);
                    }
                  }}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-red-600 outline-none font-medium text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAssignModalOpen(false);
                    setModalTarget("");
                  }}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-border hover:bg-muted transition-colors text-gray-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleModalSave}
                  disabled={
                    isModalSaving ||
                    !modalTarget ||
                    !modalBranch ||
                    !modalUser ||
                    !modalIntake
                  }
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:text-muted-foreground text-white transition-colors flex items-center gap-2 shadow-md cursor-pointer"
                >
                  {isModalSaving ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Target</span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
