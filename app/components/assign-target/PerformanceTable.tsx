"use client";

import React, { useEffect, useState } from "react";
import { BranchPerformanceGroup } from "@/lib/crmTypes";
import { Edit3, HelpCircle } from "lucide-react";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";

interface PerformanceTableProps {
  branches: BranchPerformanceGroup[];
  grandTotal: any;
  selectedIntake: string;
  isAllBranches: boolean;
  isAllUsers: boolean;
  onUpdateTarget: (
    branchId: string,
    userId: string,
    target: number,
  ) => Promise<boolean>;
  savingUserId: string | null;
}

export default function PerformanceTable({
  branches,
  grandTotal,
  selectedIntake,
  isAllBranches,
  onUpdateTarget,
  savingUserId,
}: PerformanceTableProps) {
  const isIntakeSelected = selectedIntake !== "all";

  const { canUpdate } = useAuth();

  const [editedTargets, setEditedTargets] = useState<{
    [rowKey: string]: string;
  }>({});
  const [editingRowKey, setEditingRowKey] = useState<string | null>(null);

  const getRowKey = (branchId: string, userId: string) =>
    `${branchId}:${userId}`;

  useEffect(() => {
    const initialTargets: { [rowKey: string]: string } = {};

    branches.forEach((branch) => {
      branch.users.forEach((user) => {
        initialTargets[getRowKey(branch.branchId, user.userId)] =
          user.target.toString();
      });
    });

    setEditedTargets(initialTargets);
    setEditingRowKey(null);
  }, [branches, selectedIntake]);

  const handleInputChange = (rowKey: string, value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setEditedTargets((prev) => ({ ...prev, [rowKey]: value }));
    }
  };

  const handleSave = async (
    branchId: string,
    rowKey: string,
    userId: string,
  ) => {
    const currentStr = editedTargets[rowKey] || "0";
    const currentNum = parseInt(currentStr, 10) || 0;
    const success = await onUpdateTarget(branchId, userId, currentNum);

    if (success) {
      setEditingRowKey(null);
    }
  };

  const handleCancel = (rowKey: string, target: number) => {
    setEditedTargets((prev) => ({ ...prev, [rowKey]: target.toString() }));
    setEditingRowKey(null);
  };

  const renderProgressBar = (
    progress: number,
    type: "user" | "branch" | "grand",
  ) => {
    const displayProgress = progress > 0 ? `${progress}%` : "—";
    const progressWidth = Math.min(progress, 100);

    if (type === "grand") {
      return (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-500"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <span className="text-xs font-black w-10 text-right shrink-0">
            {displayProgress}
          </span>
        </div>
      );
    }

    if (type === "branch") {
      return (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-2 bg-muted  rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground transition-all duration-500"
              style={{ width: `${progressWidth}%` }}
            />
          </div>
          <span className="font-bold w-8 text-[10px] text-right shrink-0 text-foreground">
            {displayProgress}
          </span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted  rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 transition-all duration-500"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
        <span className="font-bold w-8 text-[10px] text-right shrink-0 text-foreground">
          {displayProgress}
        </span>
      </div>
    );
  };

  return (
    <div id="performance-table-container" className="w-full">
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-background  shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-muted/80 border-b border-border backdrop-blur-sm">
            <tr>
              <th className="px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground  w-32">
                Branch
              </th>
              <th className="px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground ">
                User
              </th>
              <th className="px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground  w-24">
                Target
              </th>
              <th className="px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground  w-20 text-center">
                Walks
              </th>
              <th className="px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground  w-20 text-center">
                Apps
              </th>
              <th className="px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground  w-20 text-center">
                Visas
              </th>
              <th className="px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground ">
                Progress
              </th>
              <th className="px-4 py-2 text-[10px] font-bold uppercase text-muted-foreground  w-32 text-right">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="text-xs divide-y divide-border">
            {branches.map((branch) => {
              const usersCount = branch.users.length;

              return (
                <React.Fragment key={branch.branchId}>
                  {branch.users.map((user, idx) => {
                    const rowKey = getRowKey(branch.branchId, user.userId);
                    const isUserSaving =
                      savingUserId === user.userId && editingRowKey === rowKey;
                    const targetVal =
                      editedTargets[rowKey] ?? user.target.toString();
                    const isEditing = editingRowKey === rowKey;

                    return (
                      <tr
                        key={rowKey}
                        className="group hover:bg-muted/50 text-xs transition-colors"
                      >
                        {idx === 0 && (
                          <td
                            rowSpan={usersCount + 1}
                            className="px-4 py-4 align-middle border-r border-border  bg-muted/50  w-32"
                          >
                            <span className="font-black text-foreground uppercase tracking-tighter text-sm">
                              {branch.branchName}
                            </span>
                          </td>
                        )}

                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted  shrink-0 flex items-center justify-center font-bold text-[10px] text-foreground">
                              {user.avatar}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold text-foreground">
                                {user.userName}
                              </span>
                              <span className="text-[10px] text-muted-foreground ">
                                {user.role}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-2">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min={1}
                                value={targetVal}
                                onChange={(e) =>
                                  handleInputChange(rowKey, e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (
                                    e.key === "-" ||
                                    e.key === "e" ||
                                    e.key === "E"
                                  ) {
                                    e.preventDefault();
                                  }
                                }}
                                className="w-20 px-1.5 py-0.5 rounded border text-xs font-bold text-center focus:ring-1 focus:ring-red-600 outline-none bg-background border-red-600 text-foreground font-mono"
                                autoFocus
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 group/editbtn">
                              <span className="font-bold text-xs text-foreground  font-mono">
                                {user.target.toLocaleString()}
                              </span>
                              {isIntakeSelected &&
                              canUpdate(MODULES.ASSIGN_TARGET) ? (
                                <button
                                  type="button"
                                  onClick={() => setEditingRowKey(rowKey)}
                                  className="text-muted-foreground hover:text-red-600 dark:hover:text-red-500 transition-colors opacity-0 group-hover/editbtn:opacity-100 focus:opacity-100"
                                  title="Edit Target"
                                >
                                  <Edit3 size={11} />
                                </button>
                              ) : (
                                <div className="relative group/tooltip">
                                  <HelpCircle
                                    size={11}
                                    className="text-muted-foreground hover:text-zinc-350 cursor-help"
                                  />
                                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover/tooltip:block w-44 p-2 rounded bg-popover border border-border text-popover-foreground text-[10px] text-center leading-normal shadow-xl z-20">
                                    Select a specific intake to manage user
                                    targets.
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-2 text-center font-mono font-black text-foreground">
                          {user.walkIns.toLocaleString()}
                        </td>

                        <td className="px-4 py-2 text-center font-mono text-foreground">
                          {user.applications.toLocaleString()}
                        </td>

                        <td className="px-4 py-2 text-center font-mono font-bold text-foreground">
                          {user.visaConversions.toLocaleString()}
                        </td>

                        <td className="px-4 py-2">
                          {renderProgressBar(user.progress, "user")}
                        </td>

                        <td className="px-4 py-2 text-right">
                          {isIntakeSelected ? (
                            isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSave(
                                      branch.branchId,
                                      rowKey,
                                      user.userId,
                                    )
                                  }
                                  disabled={isUserSaving}
                                  className="text-[10px] font-extrabold uppercase text-green-600 hover:text-green-500 hover:underline cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  {isUserSaving ? "Saving..." : "Save"}
                                </button>
                                <span className="text-gray-300 ">|</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCancel(rowKey, user.target)
                                  }
                                  disabled={isUserSaving}
                                  className="text-[10px] font-extrabold uppercase text-muted-foreground hover:text-muted-foreground hover:underline cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : canUpdate(MODULES.ASSIGN_TARGET) ? (
                              <button
                                type="button"
                                onClick={() => setEditingRowKey(rowKey)}
                                className="text-[10px] font-bold uppercase text-red-600 hover:text-red-500 hover:underline cursor-pointer"
                              >
                                Edit Target
                              </button>
                            ) : null
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              —
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  <tr className="bg-muted  border-t-2 border-border  text-xs font-bold">
                    <td className="px-4 py-2 font-bold uppercase text-[10px] text-foreground dark:text-gray-100">
                      {branch.branchName} Totals
                    </td>
                    <td className="px-4 py-2 font-black font-mono text-foreground">
                      {branch.totals.target.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center font-mono text-foreground">
                      {branch.totals.walkIns.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center font-mono text-foreground">
                      {branch.totals.applications.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center font-mono font-black text-foreground">
                      {branch.totals.visaConversions.toLocaleString()}
                    </td>
                    <td className="px-4 py-2" colSpan={2}>
                      {renderProgressBar(branch.totals.progress, "branch")}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}
          </tbody>

          {isAllBranches && (
            <tfoot className="sticky bottom-0 bg-red-600 text-foreground font-bold">
              <tr>
                <td
                  colSpan={2}
                  className="px-4 py-3 text-sm uppercase tracking-wider font-black"
                >
                  Grand Global Total
                </td>
                <td className="px-4 py-3 font-mono text-lg tracking-tighter">
                  {grandTotal.target.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center font-mono">
                  {grandTotal.walkIns.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center font-mono">
                  {grandTotal.applications.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center font-mono">
                  {grandTotal.visaConversions.toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {renderProgressBar(grandTotal.progress, "grand")}
                </td>
                <td className="px-4 py-3 text-right text-[10px] uppercase opacity-80">
                  Consolidated
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-6">
        {branches.map((branch) => (
          <div
            key={branch.branchId}
            className="rounded-2xl border border-border bg-background p-4 shadow-sm"
          >
            <div className="flex items-center gap-2 border-b border-border  pb-3 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 " />
              <h4 className="font-bold tracking-tight text-sm uppercase text-foreground ">
                {branch.branchName} Branch
              </h4>
            </div>

            <div className="flex flex-col gap-4">
              {branch.users.map((user) => {
                const rowKey = getRowKey(branch.branchId, user.userId);
                const isUserSaving =
                  savingUserId === user.userId && editingRowKey === rowKey;
                const targetVal =
                  editedTargets[rowKey] ?? user.target.toString();
                const isEditing = editingRowKey === rowKey;

                return (
                  <div
                    key={rowKey}
                    className="rounded-xl border border-border bg-muted p-3"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-muted  flex items-center justify-center font-bold text-xs text-foreground ">
                        {user.avatar}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-foreground ">
                          {user.userName}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-semibold">
                          {user.role}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs border-t border-border  pt-3">
                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Target
                        </span>
                        {isEditing ? (
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={targetVal}
                            onChange={(e) => {
                              const val = e.target.value;

                              if (val === "") {
                                handleInputChange(rowKey, "");
                                return;
                              }

                              const num = Number(val);

                              if (Number.isInteger(num) && num > 0) {
                                handleInputChange(rowKey, val);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (["-", "+", "e", "E", "."].includes(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            className="w-20 px-1.5 py-0.5 rounded border text-xs font-bold text-center focus:ring-1 focus:ring-red-600 outline-none bg-background border-red-600 text-foreground font-mono"
                            autoFocus
                          />
                        ) : (
                          <span className="font-bold text-foreground ">
                            {user.target.toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Walk-ins
                        </span>
                        <span className="font-bold text-foreground ">
                          {user.walkIns}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Applications
                        </span>
                        <span className="font-bold text-foreground ">
                          {user.applications}
                        </span>
                      </div>

                      <div>
                        <span className="text-muted-foreground block mb-1">
                          Visa Approved
                        </span>
                        <span className="font-bold text-foreground ">
                          {user.visaConversions}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-end justify-between mt-3 pt-3 border-t border-border ">
                      <div>
                        <span className="text-[10px] text-muted-foreground block mb-1">
                          Progress
                        </span>
                        {renderProgressBar(user.progress, "user")}
                      </div>

                      {isIntakeSelected &&
                        (isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                handleSave(branch.branchId, rowKey, user.userId)
                              }
                              disabled={isUserSaving}
                              className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-popover-foreground rounded text-[10px] font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isUserSaving ? "Saving" : "Save"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCancel(rowKey, user.target)}
                              disabled={isUserSaving}
                              className="px-2.5 py-1 bg-muted  text-foreground  rounded text-[10px] font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setEditingRowKey(rowKey)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-popover-foreground rounded text-[10px] font-bold"
                          >
                            Edit
                          </button>
                        ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t-2 border-dashed border-border flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-bold text-red-600 uppercase tracking-wide">
                <span>{branch.branchName} Total</span>
                <span>{branch.totals.progress}%</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] text-muted-foreground  font-semibold bg-muted  p-2 rounded-xl">
                <div>
                  <span className="block text-[9px] text-muted-foreground">
                    Target
                  </span>
                  <span className="font-bold text-foreground ">
                    {branch.totals.target}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-muted-foreground">
                    Walks
                  </span>
                  <span className="font-bold text-foreground ">
                    {branch.totals.walkIns}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-muted-foreground">
                    Apps
                  </span>
                  <span className="font-bold text-foreground ">
                    {branch.totals.applications}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] text-muted-foreground">
                    Visas
                  </span>
                  <span className="font-bold text-foreground ">
                    {branch.totals.visaConversions}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {isAllBranches && (
          <div className="bg-primary  text-popover-foreground p-4 rounded-2xl border border-zinc-800 shadow-xl flex flex-col gap-3">
            <div className="flex justify-between items-center text-xs font-black text-red-500 uppercase tracking-wider">
              <span>Grand Total</span>
              <span>{grandTotal.progress}%</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-bold bg-popover p-3 rounded-xl border border-zinc-800">
              <div>
                <span className="block text-[9px] text-muted-foreground uppercase mb-1">
                  Target
                </span>
                <span className="text-sm font-extrabold text-popover-foreground">
                  {grandTotal.target}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground uppercase mb-1">
                  Walk-ins
                </span>
                <span className="text-sm font-extrabold text-popover-foreground">
                  {grandTotal.walkIns}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground uppercase mb-1">
                  Apps
                </span>
                <span className="text-sm font-extrabold text-popover-foreground">
                  {grandTotal.applications}
                </span>
              </div>
              <div>
                <span className="block text-[9px] text-muted-foreground uppercase mb-1">
                  Visas
                </span>
                <span className="text-sm font-extrabold text-popover-foreground">
                  {grandTotal.visaConversions}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
