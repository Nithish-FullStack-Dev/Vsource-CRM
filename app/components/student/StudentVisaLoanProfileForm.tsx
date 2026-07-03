"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Edit3,
  FileCheck2,
  Landmark,
  Loader2,
  RefreshCcw,
  Save,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  StudentVisaLoanProfile,
  StudentVisaLoanProfilePayload,
} from "@/types/student";
import { toast } from "sonner";
import { useStudentVisaLoanProfile } from "@/hooks/student/visa-loan/useStudentVisaLoanProfile";
import { useSaveStudentVisaLoanProfile } from "@/hooks/student/visa-loan/useSaveStudentVisaLoanProfile";
import { useFintechUsers } from "@/hooks/student/visa-loan/useFintechUsers";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";

type StudentVisaLoanProfileSectionProps = {
  studentId: string;
  isDarkMode?: boolean;
};

type FormState = {
  depositDeadlineDate: string;
  depositStatus: string;
  ihsPaidStatus: string;
  visaPaidStatus: string;
  casDeadlineDate: string;
  casStatus: string;
  visaStatus: string;
  universityStartDate: string;
  fintechAssigneeId: string;
  nbfc: string;
  loanStatus: string;
  pfStatus: string;
  appliedAmount: string;
  sanctionedAmount: string;
  disbursed: boolean;
  disbursedAmount: string;
};

const initialFormState: FormState = {
  depositDeadlineDate: "",
  depositStatus: "",
  ihsPaidStatus: "",
  visaPaidStatus: "",
  casDeadlineDate: "",
  casStatus: "",
  visaStatus: "",
  universityStartDate: "",
  fintechAssigneeId: "",
  nbfc: "",
  loanStatus: "",
  pfStatus: "",
  appliedAmount: "",
  sanctionedAmount: "",
  disbursed: false,
  disbursedAmount: "",
};

const getDateTimeLocalValue = (value?: string | null) => {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const timezoneOffset = date.getTimezoneOffset() * 60_000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatAmount = (value?: string | number | null) => {
  if (value === null || value === undefined || value === "") return "-";

  const amount = Number(value);

  if (!Number.isFinite(amount)) return "-";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatStatus = (value?: string | null) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getStringValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return "";

  return String(value);
};

const getNullableNumber = (value: string) => {
  const normalizedValue = value.trim();

  if (!normalizedValue) return null;

  const numberValue = Number(normalizedValue);

  return Number.isFinite(numberValue) ? numberValue : null;
};

const getNullableDateTime = (value: string) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
};

const createFormState = (
  profile?: StudentVisaLoanProfile | null,
): FormState => {
  if (!profile) return initialFormState;

  return {
    depositDeadlineDate: getDateTimeLocalValue(profile.depositDeadlineDate),
    depositStatus: profile.depositStatus ?? "",
    ihsPaidStatus: profile.ihsPaidStatus ?? "",
    visaPaidStatus: profile.visaPaidStatus ?? "",
    casDeadlineDate: getDateTimeLocalValue(profile.casDeadlineDate),
    casStatus: profile.casStatus ?? "",
    visaStatus: profile.visaStatus ?? "",
    universityStartDate: getDateTimeLocalValue(profile.universityStartDate),
    fintechAssigneeId: profile.fintechAssigneeId ?? "",
    nbfc: profile.nbfc ?? "",
    loanStatus: profile.loanStatus ?? "",
    pfStatus: profile.pfStatus ?? "",
    appliedAmount: getStringValue(profile.appliedAmount),
    sanctionedAmount: getStringValue(profile.sanctionedAmount),
    disbursed: profile.disbursed ?? false,
    disbursedAmount: getStringValue(profile.disbursedAmount),
  };
};

type DetailItemProps = {
  label: string;
  value: string;
  icon: React.ElementType;
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

export function StudentVisaLoanProfileSection({
  studentId,
  isDarkMode = false,
}: StudentVisaLoanProfileSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const { data: fintechUsers = [] } = useFintechUsers(studentId);
  const { canUpdate } = useAuth();

  const {
    data: profile,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useStudentVisaLoanProfile(studentId);

  const saveMutation = useSaveStudentVisaLoanProfile();

  useEffect(() => {
    setForm(createFormState(profile));
  }, [profile]);

  const updateField = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openEditDialog = () => {
    setForm(createFormState(profile));
    setDialogOpen(true);
  };

  const closeEditDialog = () => {
    if (saveMutation.isPending) return;

    setForm(createFormState(profile));
    setDialogOpen(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!studentId || saveMutation.isPending) return;

    const appliedAmount = getNullableNumber(form.appliedAmount);
    const sanctionedAmount = getNullableNumber(form.sanctionedAmount);
    const disbursedAmount = getNullableNumber(form.disbursedAmount);

    if (form.appliedAmount && appliedAmount === null) {
      toast.error("Enter a valid applied amount");
      return;
    }

    if (form.sanctionedAmount && sanctionedAmount === null) {
      toast.error("Enter a valid sanctioned amount");
      return;
    }

    if (form.disbursed && form.disbursedAmount && disbursedAmount === null) {
      toast.error("Enter a valid disbursed amount");
      return;
    }

    if (
      appliedAmount !== null &&
      sanctionedAmount !== null &&
      sanctionedAmount > appliedAmount
    ) {
      toast.error("Sanctioned amount cannot be greater than applied amount");
      return;
    }

    if (
      sanctionedAmount !== null &&
      disbursedAmount !== null &&
      disbursedAmount > sanctionedAmount
    ) {
      toast.error("Disbursed amount cannot be greater than sanctioned amount");
      return;
    }

    const payload: StudentVisaLoanProfilePayload = {
      depositDeadlineDate: getNullableDateTime(form.depositDeadlineDate),
      depositStatus: form.depositStatus || null,
      ihsPaidStatus: form.ihsPaidStatus || null,
      visaPaidStatus: form.visaPaidStatus || null,
      casDeadlineDate: getNullableDateTime(form.casDeadlineDate),
      casStatus: form.casStatus || null,
      visaStatus: form.visaStatus || null,
      universityStartDate: getNullableDateTime(form.universityStartDate),
      fintechAssigneeId: form.fintechAssigneeId.trim() || null,
      nbfc: form.nbfc || null,
      loanStatus: form.loanStatus || null,
      pfStatus: form.pfStatus || null,
      appliedAmount,
      sanctionedAmount,
      disbursed: form.disbursed,
      disbursedAmount: form.disbursed ? disbursedAmount : null,
    };

    console.log(payload);

    try {
      await saveMutation.mutateAsync({
        studentId,
        payload,
      });

      setDialogOpen(false);
    } catch {
      return;
    }
  };

  const inputClassName = `w-full rounded-xl border px-3 py-2.5 text-xs outline-none transition focus:border-red-600 focus:ring-2 focus:ring-red-600/20 ${
    isDarkMode
      ? "border-slate-800 bg-slate-950 text-slate-100"
      : "border-slate-200 bg-slate-50 text-slate-900"
  }`;

  const sectionClassName = `rounded-2xl border p-4 ${
    isDarkMode
      ? "border-slate-800 bg-slate-950/60"
      : "border-slate-200 bg-slate-50/70"
  }`;

  if (!studentId) {
    return (
      <div className="flex min-h-[350px] items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-800">
        <div>
          <FileCheck2 className="mx-auto mb-3 h-8 w-8 text-slate-400" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            Student profile is unavailable
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Select a valid student to view visa and loan details.
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
            Loading visa and loan profile...
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
            Unable to load visa and loan profile
          </p>

          <p className="mt-1 text-xs text-slate-500">
            The student profile could not be loaded.
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
              Visa & Loan Profile
            </h4>

            <p className="mt-1 text-xs text-slate-400">
              View deposit, CAS, visa, university and loan information.
            </p>
          </div>

          {canUpdate(MODULES.STUDENT_PROFILES) && (
            <button
              type="button"
              onClick={openEditDialog}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-700"
            >
              <Edit3 className="h-4 w-4" />
              {profile ? "Edit Details" : "Add Details"}
            </button>
          )}
        </div>

        {!profile ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-800">
            <div>
              <ShieldCheck className="mx-auto mb-3 h-9 w-9 text-slate-400" />

              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No visa and loan profile available
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Click Add Details to create the student profile.
              </p>

              <button
                type="button"
                onClick={openEditDialog}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white"
              >
                <Edit3 className="h-4 w-4" />
                Add Details
              </button>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-xl bg-purple-500/10 p-2 text-purple-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <h5 className="text-xs font-black uppercase tracking-wide">
                    Deposit, CAS & Visa
                  </h5>

                  <p className="text-[10px] text-slate-400">
                    University and immigration milestones
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <DetailItem
                  label="Deposit Deadline"
                  value={formatDateTime(profile.depositDeadlineDate)}
                  icon={CalendarDays}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="Deposit Status"
                  value={formatStatus(profile.depositStatus)}
                  icon={CheckCircle2}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="IHS Paid Status"
                  value={formatStatus(profile.ihsPaidStatus)}
                  icon={CreditCard}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="Visa Fee Paid Status"
                  value={formatStatus(profile.visaPaidStatus)}
                  icon={CreditCard}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="CAS Deadline"
                  value={formatDateTime(profile.casDeadlineDate)}
                  icon={CalendarDays}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="CAS Status"
                  value={formatStatus(profile.casStatus)}
                  icon={FileCheck2}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="Visa Status"
                  value={formatStatus(profile.visaStatus)}
                  icon={ShieldCheck}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="University Start Date"
                  value={formatDateTime(profile.universityStartDate)}
                  icon={CalendarDays}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>

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
                    NBFC, sanction and disbursement information
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
                  value={profile.nbfc || "-"}
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
                  label="Processing Fee Status"
                  value={formatStatus(profile.pfStatus)}
                  icon={CreditCard}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="Applied Amount"
                  value={formatAmount(profile.appliedAmount)}
                  icon={WalletCards}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="Sanctioned Amount"
                  value={formatAmount(profile.sanctionedAmount)}
                  icon={WalletCards}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="Disbursed"
                  value={profile.disbursed ? "Yes" : "No"}
                  icon={CheckCircle2}
                  isDarkMode={isDarkMode}
                />

                <DetailItem
                  label="Disbursed Amount"
                  value={
                    profile.disbursed
                      ? formatAmount(profile.disbursedAmount)
                      : "-"
                  }
                  icon={WalletCards}
                  isDarkMode={isDarkMode}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeEditDialog();
            return;
          }

          setDialogOpen(true);
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 z-20 border-b bg-background px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-base font-black">
                  {profile
                    ? "Edit Visa & Loan Profile"
                    : "Add Visa & Loan Profile"}
                </DialogTitle>

                <p className="mt-1 text-xs text-slate-400">
                  Update visa, university, loan and disbursement details.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditDialog}
                disabled={saveMutation.isPending}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 px-6 py-5">
            <div className={sectionClassName}>
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-xl bg-purple-500/10 p-2 text-purple-600">
                  <ShieldCheck className="h-4 w-4" />
                </div>

                <div>
                  <h5 className="text-xs font-black uppercase tracking-wide">
                    Deposit, CAS & Visa
                  </h5>

                  <p className="text-[10px] text-slate-400">
                    Select both date and time for deadline fields
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Deposit Deadline Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    value={form.depositDeadlineDate}
                    onChange={(event) =>
                      updateField("depositDeadlineDate", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Deposit Status
                  </label>

                  <select
                    value={form.depositStatus}
                    onChange={(event) =>
                      updateField("depositStatus", event.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="">Select deposit status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partially_paid">Partially Paid</option>
                    <option value="waived">Waived</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    IHS Paid Status
                  </label>

                  <select
                    value={form.ihsPaidStatus}
                    onChange={(event) =>
                      updateField("ihsPaidStatus", event.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="">Select IHS status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Visa Fee Paid Status
                  </label>

                  <select
                    value={form.visaPaidStatus}
                    onChange={(event) =>
                      updateField("visaPaidStatus", event.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="">Select visa payment status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    CAS Deadline Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    value={form.casDeadlineDate}
                    onChange={(event) =>
                      updateField("casDeadlineDate", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    CAS Status
                  </label>

                  <select
                    value={form.casStatus}
                    onChange={(event) =>
                      updateField("casStatus", event.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="">Select CAS status</option>
                    <option value="not_started">Not Started</option>
                    <option value="documents_pending">Documents Pending</option>
                    <option value="under_review">Under Review</option>
                    <option value="received">Received</option>
                    <option value="rejected">Rejected</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Visa Status
                  </label>

                  <select
                    value={form.visaStatus}
                    onChange={(event) =>
                      updateField("visaStatus", event.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="">Select visa status</option>
                    <option value="not_started">Not Started</option>
                    <option value="documents_pending">Documents Pending</option>
                    <option value="applied">Applied</option>
                    <option value="decision_pending">Decision Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="withdrawn">Withdrawn</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    University Start Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    value={form.universityStartDate}
                    onChange={(event) =>
                      updateField("universityStartDate", event.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            <div className={sectionClassName}>
              <div className="mb-4 flex items-center gap-2">
                <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600">
                  <Landmark className="h-4 w-4" />
                </div>

                <div>
                  <h5 className="text-xs font-black uppercase tracking-wide">
                    Loan & Finance
                  </h5>

                  <p className="text-[10px] text-slate-400">
                    Fintech, NBFC, amount and disbursement details
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Fintech Assignee
                  </label>

                  <select
                    value={form.fintechAssigneeId}
                    onChange={(event) =>
                      updateField("fintechAssigneeId", event.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="">Select Fintech Assignee</option>

                    {fintechUsers.map((user: { id: string; name: string }) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    NBFC
                  </label>

                  <select
                    value={form.nbfc}
                    onChange={(event) =>
                      updateField("nbfc", event.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="">Select NBFC</option>
                    <option value="Credila">Credila</option>
                    <option value="Avanse">Avanse</option>
                    <option value="Auxilo">Auxilo</option>
                    <option value="InCred">InCred</option>
                    <option value="Poonawalla Fincorp">
                      Poonawalla Fincorp
                    </option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="State Bank of India">
                      State Bank of India
                    </option>
                    <option value="Self Funding">Self Funding</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Loan Status
                  </label>

                  <select
                    value={form.loanStatus}
                    onChange={(event) =>
                      updateField("loanStatus", event.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="">Select loan status</option>
                    <option value="not_started">Not Started</option>
                    <option value="documents_pending">Documents Pending</option>
                    <option value="applied">Applied</option>
                    <option value="under_review">Under Review</option>
                    <option value="approved">Approved</option>
                    <option value="sanctioned">Sanctioned</option>
                    <option value="partially_disbursed">
                      Partially Disbursed
                    </option>
                    <option value="disbursed">Disbursed</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Processing Fee Status
                  </label>

                  <select
                    value={form.pfStatus}
                    onChange={(event) =>
                      updateField("pfStatus", event.target.value)
                    }
                    className={inputClassName}
                  >
                    <option value="">Select processing fee status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="waived">Waived</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Applied Amount
                  </label>

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.appliedAmount}
                    onKeyDown={(e) => {
                      if (["-", "+", "e", "E"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = Math.max(0, Number(e.target.value) || 0);
                      updateField("appliedAmount", value.toString());
                    }}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Sanctioned Amount
                  </label>

                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={form.sanctionedAmount}
                    onKeyDown={(e) => {
                      if (["-", "+", "e", "E"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = Math.max(0, Number(e.target.value) || 0);
                      updateField("sanctionedAmount", value.toString());
                    }}
                    className={inputClassName}
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 ${
                      isDarkMode
                        ? "border-slate-800 bg-slate-950"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <span className="block text-xs font-bold">
                        Loan Disbursed
                      </span>

                      <span className="mt-0.5 block text-[10px] text-slate-400">
                        Enable after the loan amount is released
                      </span>
                    </div>

                    <input
                      type="checkbox"
                      checked={form.disbursed}
                      onChange={(event) => {
                        updateField("disbursed", event.target.checked);

                        if (!event.target.checked) {
                          updateField("disbursedAmount", "");
                        }
                      }}
                      className="h-4 w-4 accent-red-600"
                    />
                  </label>
                </div>

                {form.disbursed && (
                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                      Disbursed Amount
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.disbursedAmount}
                      onChange={(event) =>
                        updateField("disbursedAmount", event.target.value)
                      }
                      placeholder="0.00"
                      className={inputClassName}
                    />
                  </div>
                )}
              </div>
            </div>

            {saveMutation.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/10 dark:text-rose-400">
                Unable to save the profile. Check the entered information and
                try again.
              </div>
            )}

            <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background py-4">
              <button
                type="button"
                onClick={closeEditDialog}
                disabled={saveMutation.isPending}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-xs font-bold transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-xs font-black uppercase tracking-wide text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Details
                  </>
                )}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
