// app/(dashboard)/loan-application/all/[id]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  CreditCard,
  FileText,
  FolderOpen,
  Landmark,
  Mail,
  Phone,
  Upload,
  User,
  Users,
} from "lucide-react";
import { PageTransition } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useLoanApplication,
  useLoanStatus,
} from "@/hooks/loan-application/useLoanApplications";
import { getLoanTabs, LOAN_STATUSES } from "@/lib/loan-application/constants";
import {
  loanStatusTone,
  StatusBadge,
} from "@/components/loan-application/LoanProfileUI";
import { BasicTab } from "./_components/BasicTab";
import { EducationTab } from "./_components/EducationTab";
import { EmploymentTab } from "./_components/EmploymentTab";
import { BusinessTab } from "./_components/BusinessTab";
import { CoApplicantTab } from "./_components/CoApplicantTab";
import { DocumentsTab } from "./_components/DocumentsTab";
import { BanksTab } from "./_components/BanksTab";
import { RemarksTab } from "./_components/RemarksTab";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";
import { usePageTitle } from "@/store/page-title";
import { LendingPatner } from "./_components/LendingPatner";

const icons: Record<string, React.ElementType> = {
  basic: User,
  documents: FolderOpen,
  education: FileText,
  employment: User,
  business: Landmark,
  coapplicant: Users,
  leading_patner: CreditCard,
  cibil: CreditCard,
  banks: Landmark,
  followups: CalendarPlus,
  activity: FileText,
};

const initials = (name?: string) =>
  (name || "Applicant")
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export default function LoanApplicationProfilePage() {
  const { canCreate, canUpdate, canDelete } = useAuth();
  const router = useRouter();
  const { setTitle } = usePageTitle();
  const params = useParams();
  const id = params.id as string;
  const [tab, setTab] = useState("basic");
  const { data: a, isLoading, isError, error } = useLoanApplication(id);

  useEffect(() => {
    if (a?.fullName) {
      setTitle(a.fullName);
    }
    return () => {
      setTitle("");
    };
  }, [a?.fullName, setTitle]);

  const update = useLoanStatus(id);
  const tabs = useMemo(
    () => (a ? getLoanTabs(a.applicantCategory, a.loanCategory) : []),
    [a],
  );
  const [open, setOpen] = useState(false);
  const [loanStatus, setLoanStatus] = useState("");

  if (isLoading)
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-slate-500">
        Loading loan application...
      </div>
    );

  if (isError || !a)
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h2 className="text-base font-black text-rose-700">
            Unable to load loan application
          </h2>
          <p className="mt-2 text-sm text-rose-600">
            {error instanceof Error
              ? error.message
              : "Please refresh the page and try again."}
          </p>
          <Button
            variant="outline"
            className="mt-5 w-full sm:w-auto"
            onClick={() => router.push("/loan-application/all")}
          >
            Back to Loan Applications
          </Button>
        </div>
      </div>
    );

  // Cast applicant props to any to avoid cross-module type incompatibilities
  const render = () =>
    ({
      basic: <BasicTab applicant={a as any} canUpdate={canUpdate} />,
      education: <EducationTab applicant={a as any} canUpdate={canUpdate} />,
      employment: <EmploymentTab applicant={a as any} canUpdate={canUpdate} />,
      business: <BusinessTab applicant={a as any} />,
      coapplicant: (
        <CoApplicantTab
          applicant={a as any}
          canUpdate={canUpdate}
          canCreate={canCreate}
        />
      ),
      documents: (
        <DocumentsTab
          applicationId={a.id ?? ""}
          applicantName={a.fullName ?? ""}
          canUpdate={canUpdate}
        />
      ),
      banks: (
        <BanksTab
          applicationId={a.id}
          canUpdate={canUpdate}
          canCreate={canCreate}
          canDelete={canDelete}
        />
      ),
      leading_patner: (
        <LendingPatner applicant={a as any} canUpdate={canUpdate} />
      ),
      remarks: (
        <RemarksTab
          applicant={a as any}
          canCreate={canCreate(MODULES.LOAN_APPLICATION)}
        />
      ),
    })[tab] ?? null;

  return (
    <PageTransition>
      <div className="flex min-h-screen bg-background text-foreground">
        {/* Adjusted padding for mobile (p-4) and desktop (sm:p-6 lg:p-8) */}
        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {/* Header Profile Area - Stacked on mobile, row on tablet/desktop */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between lg:items-center">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <button
                onClick={() => router.push("/loan-application/all")}
                className="inline-flex items-center gap-1.5 text-xs font-black text-red-600 transition-colors hover:text-red-700 hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </button>

              {/* Divider hidden on mobile */}
              <div className="hidden h-8 w-px bg-slate-200 dark:bg-slate-800 sm:block" />

              <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-base font-black text-white sm:h-14 sm:w-14 sm:text-lg">
                  {initials(a.fullName ?? "-")}
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h2 className="truncate text-lg font-black text-slate-900 dark:text-white sm:text-xl">
                      {a.fullName}
                    </h2>
                    <span className="font-mono text-xs text-slate-400">
                      {a.applicationId}
                    </span>
                    <StatusBadge
                      status={a.loanStatus ?? "-"}
                      className={loanStatusTone(a.loanStatus ?? "")}
                    />
                    {a.priority && (
                      <span className="rounded bg-red-600/10 px-1.5 py-0.5 text-[10px] font-black text-red-600">
                        {a.priority} Priority
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 sm:gap-4">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {a.mobile}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {a.email}
                    </span>
                    <span className="hidden sm:inline">·</span>
                    <span>{a.applicantCategory}</span>
                    <span className="hidden sm:inline">·</span>
                    <span>{a.loanCategory}</span>
                  </div>
                </div>
              </div>
            </div>

            {canUpdate(MODULES.LOAN_APPLICATION) && (
              <Button
                onClick={() => {
                  setLoanStatus(a.loanStatus ?? "-");
                  setOpen(true);
                }}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Update Loan Status
              </Button>
            )}
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* TABS CONTAINER - With horizontal scroll optimization */}
            <div className="w-full overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex min-w-max gap-2">
                {tabs.map((item) => {
                  const Icon = icons[item.key] ?? FileText;
                  const selected = tab === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setTab(item.key)}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all sm:px-5 sm:py-3 ${
                        selected
                          ? "border-red-600 bg-red-600 text-white shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:text-red-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAB CONTENT - Standardized min-height across devices */}
            <div className="min-h-[400px] rounded-2xl border border-slate-100 bg-white p-4 shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:min-h-[500px] sm:rounded-3xl sm:p-6">
              {render()}
            </div>
          </div>
        </main>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-md rounded-2xl sm:rounded-lg">
            <DialogHeader>
              <DialogTitle>Update Loan Status</DialogTitle>
              <DialogDescription>Select the new loan status.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <Select value={loanStatus} onValueChange={setLoanStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>

                <SelectContent>
                  {LOAN_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex flex-col-reverse justify-end gap-2 sm:flex-row">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>

                <Button
                  disabled={update.isPending}
                  className="w-full sm:w-auto"
                  onClick={() =>
                    update.mutate(
                      { loanStatus },
                      {
                        onSuccess: () => setOpen(false),
                      },
                    )
                  }
                >
                  {update.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}
