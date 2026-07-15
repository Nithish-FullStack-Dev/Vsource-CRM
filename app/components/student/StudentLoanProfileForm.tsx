"use client";

import { type ElementType } from "react";
import {
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Landmark,
  Loader2,
  RefreshCcw,
  UserRound,
} from "lucide-react";
import { useLoanProcess } from "@/hooks/loan-application/useLoanProcess";

type StudentLoanProfileSectionProps = {
  leadId: string;
  isDarkMode?: boolean;
};

const formatStatus = (value?: string | null) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

type DetailItemProps = {
  label: string;
  value: string;
  icon: ElementType;
  isDarkMode: boolean;
};

function DetailItem({ label, value, icon: Icon, isDarkMode }: DetailItemProps) {
  return (
    <div
      className={`flex min-h-[82px] items-start gap-3 rounded-2xl border p-3.5 ${
        isDarkMode
          ? "border-slate-800 bg-slate-950"
          : "border-slate-100 bg-slate-50"
      }`}
    >
      <div className="rounded-xl bg-red-600/10 p-2 text-red-600">
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0">
        <span className="mb-1 block text-[9px] font-black uppercase tracking-wider text-slate-400">
          {label}
        </span>

        <span className="block break-words text-xs font-extrabold text-slate-800 dark:text-slate-100">
          {value || "-"}
        </span>
      </div>
    </div>
  );
}

export function StudentLoanProfileSection({
  leadId,
  isDarkMode = false,
}: StudentLoanProfileSectionProps) {
  const {
    data: profile,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useLoanProcess(leadId);

  if (!leadId) {
    return (
      <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-800">
        <div>
          <FileCheck2 className="mx-auto mb-3 h-8 w-8 text-slate-400" />

          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Student profile is unavailable
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Select a valid student to view loan details.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-red-600" />

          <p className="mt-3 text-xs font-bold text-slate-500">
            Loading loan profile...
          </p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-rose-200 bg-rose-50/50 p-6 text-center dark:border-rose-900/40 dark:bg-rose-950/10">
        <div>
          <FileCheck2 className="mx-auto mb-3 h-8 w-8 text-rose-500" />

          <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
            Unable to load loan profile
          </p>

          <p className="mt-1 text-xs text-slate-500">
            The loan profile could not be loaded.
          </p>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 border-b border-inherit pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Loan Profile
            </h4>

            <p className="mt-1 text-xs text-slate-400">
              View NBFC, loan sanction and disbursement information.
            </p>
          </div>
        </div>

        {!profile ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-800">
            <div>
              <Landmark className="mx-auto mb-3 h-9 w-9 text-slate-400" />

              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No loan profile available
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Navigate to Loan Applications to add loan.
              </p>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
                <Landmark className="h-4 w-4" />
              </div>

              <div>
                <h5 className="text-xs font-black uppercase tracking-wide">
                  Loan & Finance
                </h5>

                <p className="text-[10px] text-slate-400">
                  NBFC, deposit and disbursement information
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DetailItem
                label="Fintech Assignee"
                value={profile.fintechAssignee?.name || "-"}
                icon={UserRound}
                isDarkMode={isDarkMode}
              />

              <DetailItem
                label="NBFC"
                value={profile.sanction?.bank?.name || "-"}
                icon={Landmark}
                isDarkMode={isDarkMode}
              />

              <DetailItem
                label="Loan Status"
                value={formatStatus(profile.loanStatus)}
                icon={FileCheck2}
                isDarkMode={isDarkMode}
              />

              <DetailItem
                label="Deposit Status"
                value={formatStatus(profile.depositStatus)}
                icon={CreditCard}
                isDarkMode={isDarkMode}
              />

              <DetailItem
                label="Loan Category"
                value={formatStatus(profile.loanCategory)}
                icon={CreditCard}
                isDarkMode={isDarkMode}
              />

              <DetailItem
                label="Deposit Date"
                value={
                  profile.depositDate
                    ? new Date(profile.depositDate).toLocaleString()
                    : "-"
                }
                icon={CreditCard}
                isDarkMode={isDarkMode}
              />

              <DetailItem
                label="Disbursed Date"
                value={
                  profile?.disbursement?.disbursementDate
                    ? new Date(
                        profile?.disbursement?.disbursementDate,
                      ).toLocaleDateString()
                    : "-"
                }
                icon={CheckCircle2}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
