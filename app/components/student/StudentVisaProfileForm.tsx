"use client";

import { FormEvent, useEffect, useState, type ElementType } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Edit3,
  FileCheck2,
  Loader2,
  RefreshCcw,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  StudentVisaProfile,
  useStudentVisaProfile,
} from "@/hooks/student/visa/useStudentVisaProfile";
import {
  StudentVisaProfilePayload,
  useSaveStudentVisaProfile,
} from "@/hooks/student/visa/useSaveStudentVisaProfile";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";

type StudentVisaProfileSectionProps = {
  studentId: string;
  isDarkMode?: boolean;
};

type FormState = {
  depositDeadlineDate: string;
  depositStatus: "" | "PENDING" | "PAID";

  ihsPaidStatus: "" | "PENDING" | "PAID" | "PAID_PARTIALLY";

  visaPaidStatus: string;

  casDeadlineDate: string;

  casStatus: "" | "PENDING" | "APPLIED" | "RECEIVED";

  visaStatus: "" | "DECISION_PENDING" | "APPROVED" | "REJECTED";

  visaDecisionDate: string;

  universityStartDate: string;

  universityEndDate: string;

  interviewStatus: "" | "PASSED" | "FAILED" | "NO_INTERVIEW";
};

const initialFormState: FormState = {
  depositDeadlineDate: "",
  depositStatus: "",

  ihsPaidStatus: "",
  visaPaidStatus: "",

  casDeadlineDate: "",
  casStatus: "",

  visaStatus: "",

  visaDecisionDate: "",

  universityStartDate: "",
  universityEndDate: "",

  interviewStatus: "",
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

const formatStatus = (value?: string | null) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getNullableDateTime = (value: string) => {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
};

const createFormState = (profile?: StudentVisaProfile | null): FormState => {
  if (!profile) return initialFormState;

  return {
    depositDeadlineDate: getDateTimeLocalValue(profile.depositDeadlineDate),
    depositStatus: profile.depositStatus ?? "",

    ihsPaidStatus: profile.ihsPaidStatus ?? "",
    visaPaidStatus: profile.visaPaidStatus ?? "",

    casDeadlineDate: getDateTimeLocalValue(profile.casDeadlineDate),
    casStatus: profile.casStatus ?? "",

    visaStatus: profile.visaStatus ?? "",

    visaDecisionDate: getDateTimeLocalValue(profile.visaDecisionDate),

    universityStartDate: getDateTimeLocalValue(profile.universityStartDate),

    universityEndDate: getDateTimeLocalValue(profile.universityEndDate),

    interviewStatus: profile.interviewStatus ?? "",
  };
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

export function StudentVisaProfileSection({
  studentId,
  isDarkMode = false,
}: StudentVisaProfileSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const { canUpdate } = useAuth();

  const {
    data: profile,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useStudentVisaProfile(studentId);

  const saveMutation = useSaveStudentVisaProfile();

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

    const payload: StudentVisaProfilePayload = {
      depositDeadlineDate: getNullableDateTime(form.depositDeadlineDate),
      depositStatus: form.depositStatus || null,

      ihsPaidStatus: form.ihsPaidStatus || null,
      visaPaidStatus: form.visaPaidStatus || null,

      casDeadlineDate: getNullableDateTime(form.casDeadlineDate),
      casStatus: form.casStatus || null,

      visaStatus: form.visaStatus || null,

      visaDecisionDate: getNullableDateTime(form.visaDecisionDate),

      universityStartDate: getNullableDateTime(form.universityStartDate),

      universityEndDate: getNullableDateTime(form.universityEndDate),

      interviewStatus: form.interviewStatus || null,
    };

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
            Select a valid student to view visa details.
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
            Loading visa profile...
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
            Unable to load visa profile
          </p>

          <p className="mt-1 text-xs text-slate-500">
            The visa profile could not be loaded.
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
              Visa Profile
            </h4>

            <p className="mt-1 text-xs text-slate-400">
              View deposit, CAS, visa and university information.
            </p>
          </div>

          {canUpdate(MODULES.STUDENT_PROFILES) && (
            <button
              type="button"
              onClick={openEditDialog}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-700"
            >
              <Edit3 className="h-4 w-4" />
              {profile ? "Edit Visa Details" : "Add Visa Details"}
            </button>
          )}
        </div>

        {!profile ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-800">
            <div>
              <ShieldCheck className="mx-auto mb-3 h-9 w-9 text-slate-400" />

              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No visa profile available
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Click Add Visa Details to create the visa profile.
              </p>

              {canUpdate(MODULES.STUDENT_PROFILES) && (
                <button
                  type="button"
                  onClick={openEditDialog}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white"
                >
                  <Edit3 className="h-4 w-4" />
                  Add Visa Details
                </button>
              )}
            </div>
          </div>
        ) : (
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
                label="IHS & Visa Paid Status"
                value={formatStatus(profile.ihsPaidStatus)}
                icon={CreditCard}
                isDarkMode={isDarkMode}
              />

              <DetailItem
                label="Visa Status"
                value={formatStatus(profile.visaStatus)}
                icon={ShieldCheck}
                isDarkMode={isDarkMode}
              />

              <DetailItem
                label="Visa Decision Date"
                value={formatDateTime(profile.visaDecisionDate)}
                icon={CalendarDays}
                isDarkMode={isDarkMode}
              />

              {/* <DetailItem
                label="Visa Fee Paid Status"
                value={formatStatus(profile.visaPaidStatus)}
                icon={CreditCard}
                isDarkMode={isDarkMode}
              /> */}

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
                label="Interview Status"
                value={formatStatus(profile.interviewStatus)}
                icon={CheckCircle2}
                isDarkMode={isDarkMode}
              />

              <DetailItem
                label="University Start Date"
                value={formatDateTime(profile.universityStartDate)}
                icon={CalendarDays}
                isDarkMode={isDarkMode}
              />

              <DetailItem
                label="University Last Enrollment Date"
                value={formatDateTime(profile.universityEndDate)}
                icon={CalendarDays}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
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
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto p-0">
          <DialogHeader className="sticky top-0 z-20 border-b bg-background px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-base font-black">
                  {profile ? "Edit Visa Profile" : "Add Visa Profile"}
                </DialogTitle>

                <p className="mt-1 text-xs text-slate-400">
                  Update deposit, CAS, visa and university details.
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
                      updateField(
                        "depositStatus",
                        event.target.value as FormState["depositStatus"],
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="">Select Deposit Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Visa Status
                  </label>

                  <select
                    value={form.visaStatus}
                    onChange={(event) =>
                      updateField(
                        "visaStatus",
                        event.target.value as FormState["visaStatus"],
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="">Select Visa Status</option>
                    <option value="DECISION_PENDING">Decision Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Visa Decision Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    value={form.visaDecisionDate}
                    onChange={(e) =>
                      updateField("visaDecisionDate", e.target.value)
                    }
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    IHS & Visa Paid Status
                  </label>

                  <select
                    value={form.ihsPaidStatus}
                    onChange={(event) =>
                      updateField(
                        "ihsPaidStatus",
                        event.target.value as FormState["ihsPaidStatus"],
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="">Select IHS Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="PAID_PARTIALLY">Paid Partially</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Visa Fee Paid Status
                  </label>

                  <select
                    value={form.visaPaidStatus}
                    onChange={(event) =>
                      updateField(
                        "visaPaidStatus",
                        event.target.value as FormState["visaPaidStatus"],
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="">Select Visa Fee Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
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
                      updateField(
                        "casStatus",
                        event.target.value as FormState["casStatus"],
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="">Select CAS Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPLIED">Applied</option>
                    <option value="RECEIVED">Received</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    Interview Status
                  </label>

                  <select
                    value={form.interviewStatus}
                    onChange={(e) =>
                      updateField(
                        "interviewStatus",
                        e.target.value as FormState["interviewStatus"],
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="">Select Interview Status</option>
                    <option value="NO_INTERVIEW">No Interview</option>
                    <option value="PASSED">Passed</option>
                    <option value="FAILED">Failed</option>
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

                <div>
                  <label className="mb-1.5 block text-[9px] font-bold uppercase text-slate-400">
                    University End Date & Time
                  </label>

                  <input
                    type="datetime-local"
                    value={form.universityEndDate}
                    onChange={(e) =>
                      updateField("universityEndDate", e.target.value)
                    }
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            {saveMutation.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/10 dark:text-rose-400">
                Unable to save the visa profile. Check the entered information
                and try again.
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
