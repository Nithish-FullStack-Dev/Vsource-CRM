"use client";

import { type ReactNode, useEffect, useState } from "react";
import { Eye, Search, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { useStudents } from "@/hooks/student/useStudents";
import { StudentRecord } from "@/types/student";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "use-debounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface StudentTableProps {
  isDarkMode: boolean;
  onSelectStudent: (id: string) => void;
}

interface MobileInfoItemProps {
  label: string;
  value: ReactNode;
  className?: string;
}

function MobileInfoItem({ label, value, className = "" }: MobileInfoItemProps) {
  return (
    <div className={`min-w-0 space-y-1 ${className}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <div className="wrap-break-word text-xs font-semibold text-slate-700 dark:text-slate-200">
        {value}
      </div>
    </div>
  );
}

export function StudentTable({
  isDarkMode,
  onSelectStudent,
}: StudentTableProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);

  const { data, isLoading, isError, error } = useStudents({
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const students = Array.isArray(data?.data) ? data.data : [];
  const meta = data?.meta;

  const getText = (
    value: string | number | null | undefined,
    fallback = "-",
  ) => {
    if (value === null || value === undefined) return fallback;
    const text = String(value).trim();
    return text.length > 0 ? text : fallback;
  };

  const getDate = (value: string | Date | null | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("en-GB");
  };

  const togglePassword = (studentId: string) => {
    setVisiblePasswords((previous) => ({
      ...previous,
      [studentId]: !previous[studentId],
    }));
  };

  const getCellColorClass = (value?: string | null) => {
    const status = getText(value, "").toLowerCase().trim();

    if (!status || status === "-") {
      return "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800";
    }

    if (
      [
        "deposit paid",
        "cas received",
        "visa approved",
        "loan sanctioned",
        "disbursed",
        "file closed",
        "approved",
        "paid",
        "completed",
        "waived",
        "received",
        "sanctioned",
      ].includes(status)
    ) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800";
    }

    if (
      [
        "application rejected",
        "student dropped",
        "visa rejected",
        "rejected",
        "dropped",
        "cancelled",
        "hold",
        "paused",
        "deferred",
        "student requested hold",
      ].includes(status)
    ) {
      return "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900";
    }

    if (
      [
        "university decision pending",
        "cas under review",
        "visa decision pending",
        "applied",
        "under review",
        "decision pending",
        "pending",
        "waiting for documents",
        "intake change requested",
      ].includes(status) ||
      (status.includes("pending") && !status.includes("not")) ||
      status.includes("review")
    ) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800";
    }

    return "bg-white text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-800";
  };

  useEffect(() => {
    if (!isError) return;

    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data
        ?.message ??
      (error instanceof Error ? error.message : null) ??
      "Failed to load students";

    toast.error(message);
  }, [isError, error]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Loading students...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-3xl border border-rose-200 bg-white px-6 text-center dark:border-rose-900 dark:bg-slate-900">
        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">
          Unable to load students
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Please refresh the page or try again later.
        </p>
      </div>
    );
  }

  const thBgClass = isDarkMode
    ? "bg-slate-950 border-slate-800 text-slate-300"
    : "bg-slate-100 border-slate-200 text-slate-600";

  const stickyCellClass =
    "sticky z-20 border-r border-slate-200 bg-white shadow-[2px_0_8px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900";

  const normalCellClass =
    "border-r border-slate-100 px-4 py-3.5 align-middle dark:border-slate-800/50";

  return (
    <div className="space-y-4" id="student-module-master-table">
      <div className="flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by applicant name, email or mobile..."
            className="pl-10"
          />
        </div>
      </div>

      <div className="space-y-4 md:hidden">
        {students.length === 0 ? (
          <Card className="rounded-2xl border-slate-200 shadow-sm dark:border-slate-800">
            <CardContent className="py-12 text-center text-sm font-semibold text-slate-400">
              No students found.
            </CardContent>
          </Card>
        ) : (
          students.map((student: StudentRecord, index: number) => {
            const visaProfile = student?.visaProfile ?? null;
            const lead = student?.lead ?? null;
            const counselor = student?.counselor ?? null;
            const loanApplication = student?.lead?.loanApplication ?? null;
            const remarks = Array.isArray(student?.remarks)
              ? student.remarks
              : [];
            const latestRemark = remarks.at(-1)?.note ?? "No remarks added";
            const password = getText(student?.password, "Not set");
            const latestTimeline = Array.isArray(student?.timeline)
              ? student.timeline.reduce<string | null>((latest, item) => {
                  if (!item.followupDate) return latest;

                  if (
                    !latest ||
                    new Date(item.followupDate).getTime() >
                      new Date(latest).getTime()
                  ) {
                    return item.followupDate;
                  }

                  return latest;
                }, null)
              : null;
            const latestTimelineDate = latestTimeline
              ? new Date(latestTimeline).toLocaleDateString("en-IN")
              : "No timeline added";
            const depositDate = loanApplication?.depositDate
              ? new Date(loanApplication.depositDate).toLocaleDateString(
                  "en-IN",
                )
              : "Not set";
            const disbursedDate = loanApplication?.disbursementDate
              ? new Date(loanApplication.disbursementDate).toLocaleDateString(
                  "en-IN",
                )
              : "Not set";
            const studentNumber = (page - 1) * limit + index + 1;
            const studentCode = student?.id
              ? student.id.slice(0, 8).toUpperCase()
              : "-";

            return (
              <Card
                key={student?.id ?? `student-card-${index}`}
                className="overflow-hidden rounded-2xl border-slate-200 shadow-sm dark:border-slate-800"
              >
                <CardHeader className="space-y-3 bg-slate-50/70 pb-4 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardDescription className="font-mono text-[10px] font-bold uppercase tracking-wider">
                        #{studentNumber} · {studentCode}
                      </CardDescription>
                      <CardTitle
                        className="mt-1 cursor-pointer truncate text-base font-extrabold hover:underline"
                        onClick={() =>
                          student?.id && onSelectStudent(student.id)
                        }
                        title={getText(
                          student?.studentName,
                          "Student name unavailable",
                        )}
                      >
                        {getText(
                          student?.studentName,
                          "Student name unavailable",
                        )}
                      </CardTitle>
                    </div>
                    <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                      {getText(lead?.preferredIntake, "No intake")}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <MobileInfoItem
                      label="Counsellor"
                      value={getText(counselor?.name, "Not assigned")}
                    />
                    <MobileInfoItem
                      label="Role"
                      value={getText(counselor?.role?.name, "Not assigned")}
                    />
                  </div>
                </CardHeader>

                <CardContent className="space-y-5 p-4">
                  <section className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Student Details
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <MobileInfoItem
                        label="Admission Date"
                        value={getDate(student?.applicationDate)}
                      />
                      <MobileInfoItem
                        label="Passport No"
                        value={getText(lead?.passport, "Not provided")}
                      />
                      <MobileInfoItem
                        label="Mobile Number"
                        value={getText(student?.mobileNumber, "Not provided")}
                      />
                      <MobileInfoItem
                        label="Country"
                        value={getText(lead?.preferredCountry, "Not selected")}
                      />
                      <MobileInfoItem
                        label="Visa Email"
                        value={getText(student?.emailId, "Not provided")}
                        className="col-span-2"
                      />
                      <MobileInfoItem
                        label="Password"
                        className="col-span-2"
                        value={
                          <div className="flex items-center gap-2 max-w-[50%]">
                            <span className="min-w-0 flex-1 truncate font-mono">
                              {visiblePasswords[student.id]
                                ? password
                                : password === "Not set"
                                  ? "Not set"
                                  : "••••••••"}
                            </span>
                            {password !== "Not set" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  togglePassword(student.id);
                                }}
                                className="h-7 w-7 shrink-0"
                                aria-label={
                                  visiblePasswords[student.id]
                                    ? "Hide password"
                                    : "Show password"
                                }
                              >
                                {visiblePasswords[student.id] ? (
                                  <ShieldOff className="h-3.5 w-3.5" />
                                ) : (
                                  <Shield className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            )}
                          </div>
                        }
                      />
                      <MobileInfoItem
                        label="12th English & MOI"
                        value={getText(lead?.twelfthPercentage, "Not provided")}
                      />
                      <MobileInfoItem
                        label="Applications"
                        value={getText(
                          student?.applications?.length,
                          "Not provided",
                        )}
                      />
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Visa Progress
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <MobileInfoItem
                        label="Deposit Deadline"
                        value={getDate(visaProfile?.depositDeadlineDate)}
                      />
                      <MobileInfoItem
                        label="Deposit Status"
                        value={
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                              visaProfile?.depositStatus,
                            )}`}
                          >
                            {getText(visaProfile?.depositStatus, "Not updated")}
                          </span>
                        }
                      />
                      <MobileInfoItem
                        label="IHS & Visa Paid"
                        value={
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                              visaProfile?.ihsPaidStatus,
                            )}`}
                          >
                            {getText(visaProfile?.ihsPaidStatus, "Not updated")}
                          </span>
                        }
                      />
                      <MobileInfoItem
                        label="Interview Status"
                        value={
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                              visaProfile?.interviewStatus,
                            )}`}
                          >
                            {getText(
                              visaProfile?.interviewStatus,
                              "Not updated",
                            )}
                          </span>
                        }
                      />
                      <MobileInfoItem
                        label="CAS Deadline"
                        value={getDate(visaProfile?.casDeadlineDate)}
                      />
                      <MobileInfoItem
                        label="CAS Status"
                        value={
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                              visaProfile?.casStatus,
                            )}`}
                          >
                            {getText(visaProfile?.casStatus, "Not updated")}
                          </span>
                        }
                      />
                      <MobileInfoItem
                        label="Visa Status"
                        value={
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                              visaProfile?.visaStatus,
                            )}`}
                          >
                            {getText(visaProfile?.visaStatus, "Not updated")}
                          </span>
                        }
                      />
                      <MobileInfoItem
                        label="University Start"
                        value={getDate(visaProfile?.universityStartDate)}
                      />
                    </div>
                  </section>

                  <Separator />

                  <section className="space-y-3">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Loan Progress
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                      <MobileInfoItem
                        label="Fintech Assignee"
                        value={getText(
                          loanApplication?.fintechAssignee?.name,
                          "Not assigned",
                        )}
                      />
                      <MobileInfoItem
                        label="Sanctioned Bank / NBFC"
                        value={getText(
                          loanApplication?.sanctionBankApplication?.bank?.name,
                          "Not selected",
                        )}
                      />
                      <MobileInfoItem
                        label="Loan Status"
                        value={
                          <span
                            className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                              loanApplication?.loanStatus,
                            )}`}
                          >
                            {getText(
                              loanApplication?.loanStatus,
                              "Not updated",
                            )}
                          </span>
                        }
                      />
                      <MobileInfoItem
                        label="Disbursed Date"
                        value={disbursedDate}
                      />
                      <MobileInfoItem
                        label="Deposit Date"
                        value={depositDate}
                      />
                      <MobileInfoItem
                        label="Next Follow-up"
                        value={latestTimelineDate}
                      />
                    </div>
                  </section>

                  <Separator />

                  <MobileInfoItem
                    label="Remarks"
                    value={latestRemark}
                    className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/40"
                  />
                </CardContent>

                <CardFooter className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
                  <Button
                    type="button"
                    onClick={() =>
                      router.push(`/student-profiles/${student.id}`)
                    }
                    className="w-full bg-red-600 text-white hover:bg-red-700"
                  >
                    <Eye className="h-4 w-4" />
                    View Student Profile
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
      </div>

      <div className="relative hidden overflow-auto rounded-3xl border border-slate-200/85 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 md:block">
        <table className="w-max min-w-full table-fixed border-separate border-spacing-0 text-left text-xs">
          <colgroup>
            <col className="w-16" />
            <col className="w-28" />
            <col className="w-55" />
            <col className="w-48" />
            <col className="w-38" />
            <col className="w-38" />
            <col className="w-38" />
            <col className="w-58" />
            <col className="w-38" />
            <col className="w-38" />
            <col className="w-38" />
            <col className="w-48" />
            <col className="w-38" />
            <col className="w-48" />
            <col className="w-38" />
            <col className="w-48" />
            <col className="w-38" />
            <col className="w-55" />
            <col className="w-48" />
            <col className="w-48" />
            <col className="w-55" />
            <col className="w-55" />
            <col className="w-55" />
            <col className="w-55" />
            <col className="w-55" />
            <col className="w-58" />
            <col className="w-48" />
          </colgroup>

          <thead className="select-none whitespace-nowrap text-[10px] font-black uppercase tracking-wider">
            <tr>
              <th
                className={`sticky left-0 top-0 z-41 border-b border-r px-3 py-3 text-center align-middle ${thBgClass}`}
              >
                SNO
              </th>
              <th
                className={`sticky left-16 top-0 z-41 border-b border-r px-3 py-3 align-middle ${thBgClass}`}
              >
                STUD ID
              </th>
              <th
                className={`sticky left-44 top-0 z-41 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                STUDENT NAME
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                COUNSELLOR/OTHERS
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                DATE OF ADMISSION
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                PASSPORT NO
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                MOBILE NUMBER
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                VISA EMAIL
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                PASSWORD
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                COUNTRY
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 text-center align-middle ${thBgClass}`}
              >
                INTAKE
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                12TH ENGLISH & MOI
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                APP STATUS
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                DEPOSIT DEADLINE DATE
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                DEPOSIT STATUS
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                IHS & VISA PAID STATUS
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                Interview Status
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                CAS DEADLINE DATE
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                CAS STATUS
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                VISA STATUS
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                UNIV START DATE
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                FINTECH ASSIGNEE
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                SANCTIONED BANK / NBFC
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                LOAN STATUS
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                DISBURSED DATE
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                DEPOSIT DATE
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                NEXT FOLLOWUP DATE
              </th>
              <th
                className={`sticky top-0 z-40 border-b border-r px-4 py-3 align-middle ${thBgClass}`}
              >
                REMARKS
              </th>
              <th
                className={`sticky right-0 top-0 z-41 border-b border-l px-5 py-3 text-right align-middle shadow-[-2px_0_8px_rgba(15,23,42,0.08)] ${thBgClass}`}
              >
                ACTIONS
              </th>
            </tr>
          </thead>

          <tbody className="whitespace-nowrap">
            {students.length === 0 ? (
              <tr>
                <td
                  colSpan={29}
                  className="bg-white py-12 text-center text-xs font-bold text-slate-400 dark:bg-slate-900"
                >
                  No students found.
                </td>
              </tr>
            ) : (
              students.map((student: StudentRecord, index: number) => {
                const visaProfile = student?.visaProfile ?? null;
                const lead = student?.lead ?? null;
                const counselor = student?.counselor ?? null;
                const remarks = Array.isArray(student?.remarks)
                  ? student.remarks
                  : [];
                const latestRemark = remarks.at(-1)?.note ?? "No remarks added";
                const password = getText(student?.password, "Not set");
                const latestTimeline = Array.isArray(student?.timeline)
                  ? student.timeline.reduce<string | null>((latest, item) => {
                      if (!item.followupDate) return latest;

                      if (
                        !latest ||
                        new Date(item.followupDate).getTime() >
                          new Date(latest).getTime()
                      ) {
                        return item.followupDate;
                      }

                      return latest;
                    }, null)
                  : null;

                const latestTimelineDate = latestTimeline
                  ? new Date(latestTimeline).toLocaleDateString("en-IN")
                  : "No timeline added";

                const depositDate = student?.lead?.loanApplication?.depositDate
                  ? new Date(
                      student?.lead?.loanApplication?.depositDate,
                    ).toLocaleDateString("en-IN")
                  : "Not set";
                const disbursedDate = student?.lead?.loanApplication
                  ?.disbursementDate
                  ? new Date(
                      student?.lead?.loanApplication?.disbursementDate,
                    ).toLocaleDateString("en-IN")
                  : "Not set";

                return (
                  <tr
                    key={student?.id ?? `student-${index}`}
                    className="bg-white transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/40"
                  >
                    <td
                      className={`${stickyCellClass} left-0 w-16 px-3 py-3.5 text-center align-middle font-mono font-bold text-slate-400`}
                    >
                      {(page - 1) * limit + index + 1}
                    </td>

                    <td
                      className={`${stickyCellClass} left-16 w-28 px-3 py-3.5 align-middle font-mono text-[11px] font-black tracking-wider text-slate-500`}
                    >
                      {student?.id ? student.id.slice(0, 8).toUpperCase() : "-"}
                    </td>

                    <td
                      className={`${stickyCellClass} left-44 w-55 cursor-pointer truncate px-4 py-3.5 align-middle font-extrabold text-slate-900 hover:underline dark:text-white`}
                      onClick={() => student?.id && onSelectStudent(student.id)}
                      title={getText(
                        student?.studentName,
                        "Student name unavailable",
                      )}
                    >
                      {getText(
                        student?.studentName,
                        "Student name unavailable",
                      )}
                    </td>

                    <td
                      className={`${normalCellClass} font-semibold text-slate-600 dark:text-slate-300`}
                    >
                      <div className="truncate">
                        {getText(counselor?.name, "Not assigned")}
                      </div>
                      <div className="truncate text-[11px] font-normal text-slate-400 dark:text-slate-500">
                        {getText(counselor?.role?.name, "Not assigned")}
                      </div>
                    </td>

                    <td
                      className={`${normalCellClass} font-mono text-[11px] font-semibold text-slate-500`}
                    >
                      {getDate(student?.applicationDate)}
                    </td>

                    <td
                      className={`${normalCellClass} font-mono text-[11px] text-slate-600 dark:text-slate-400`}
                    >
                      {getText(lead?.passport, "Not provided")}
                    </td>

                    <td
                      className={`${normalCellClass} font-mono text-[11px] text-slate-600 dark:text-slate-400`}
                    >
                      {getText(student?.mobileNumber, "Not provided")}
                    </td>

                    <td
                      className={`${normalCellClass} text-slate-600 dark:text-slate-400`}
                    >
                      <div
                        className="truncate"
                        title={getText(student?.emailId, "Not provided")}
                      >
                        {getText(student?.emailId, "Not provided")}
                      </div>
                    </td>

                    <td
                      className={`${normalCellClass} font-mono text-[11px] text-slate-600 dark:text-slate-400`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="max-w-26.25 truncate">
                          {visiblePasswords[student.id]
                            ? password
                            : password === "Not set"
                              ? "Not set"
                              : "••••••••"}
                        </span>
                        {password !== "Not set" && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              togglePassword(student.id);
                            }}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            aria-label={
                              visiblePasswords[student.id]
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {visiblePasswords[student.id] ? (
                              <ShieldOff className="h-3 w-3" />
                            ) : (
                              <Shield className="h-3 w-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    <td
                      className={`${normalCellClass} text-slate-600 dark:text-slate-300`}
                    >
                      {getText(lead?.preferredCountry, "Not selected")}
                    </td>

                    <td className={`${normalCellClass} text-center font-bold`}>
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] dark:bg-slate-800">
                        {getText(lead?.preferredIntake, "Not selected")}
                      </span>
                    </td>

                    <td
                      className={`${normalCellClass} font-medium text-slate-500`}
                    >
                      {getText(lead?.twelfthPercentage, "Not provided")}
                    </td>

                    <td
                      className={`${normalCellClass} font-mono font-bold text-slate-600 dark:text-slate-400`}
                    >
                      {getText(student?.applications?.length, "Not provided")}
                    </td>

                    <td
                      className={`${normalCellClass} font-mono text-[11px] font-semibold text-slate-500`}
                    >
                      {getDate(visaProfile?.depositDeadlineDate)}
                    </td>

                    <td className={`${normalCellClass} text-center`}>
                      <span
                        className={`inline-flex max-w-full rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                          visaProfile?.depositStatus,
                        )}`}
                      >
                        {getText(visaProfile?.depositStatus, "Not updated")}
                      </span>
                    </td>

                    <td className={`${normalCellClass} text-center`}>
                      <span
                        className={`inline-flex max-w-full rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                          visaProfile?.ihsPaidStatus,
                        )}`}
                      >
                        {getText(visaProfile?.ihsPaidStatus, "Not updated")}
                      </span>
                    </td>

                    <td className={`${normalCellClass} text-center`}>
                      <span
                        className={`inline-flex max-w-full rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                          visaProfile?.interviewStatus,
                        )}`}
                      >
                        {getText(visaProfile?.interviewStatus, "Not updated")}
                      </span>
                    </td>

                    <td
                      className={`${normalCellClass} font-mono text-[11px] font-semibold text-slate-500`}
                    >
                      {getDate(visaProfile?.casDeadlineDate)}
                    </td>

                    <td className={`${normalCellClass} text-center`}>
                      <span
                        className={`inline-flex max-w-full rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                          visaProfile?.casStatus,
                        )}`}
                      >
                        {getText(visaProfile?.casStatus, "Not updated")}
                      </span>
                    </td>

                    <td className={`${normalCellClass} text-center`}>
                      <span
                        className={`inline-flex max-w-full rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                          visaProfile?.visaStatus,
                        )}`}
                      >
                        {getText(visaProfile?.visaStatus, "Not updated")}
                      </span>
                    </td>

                    <td
                      className={`${normalCellClass} font-mono text-[11px] font-semibold text-slate-500`}
                    >
                      {getDate(visaProfile?.universityStartDate)}
                    </td>

                    <td
                      className={`${normalCellClass} font-mono text-[11px] font-medium text-slate-600 dark:text-slate-400`}
                    >
                      <div className="truncate">
                        {getText(
                          student?.lead?.loanApplication?.fintechAssignee?.name,
                          "Not assigned",
                        )}
                      </div>
                    </td>

                    <td
                      className={`${normalCellClass} font-bold text-slate-600 dark:text-slate-300`}
                    >
                      {getText(
                        student?.lead?.loanApplication?.sanctionBankApplication
                          ?.bank?.name,
                        "Not selected",
                      )}
                    </td>

                    <td className={`${normalCellClass} text-center`}>
                      <span
                        className={`inline-flex max-w-full rounded-lg border px-2.5 py-1 text-[10px] font-bold ${getCellColorClass(
                          student?.lead?.loanApplication?.loanStatus,
                        )}`}
                      >
                        {getText(
                          student?.lead?.loanApplication?.loanStatus,
                          "Not updated",
                        )}
                      </span>
                    </td>

                    <td
                      className={`${normalCellClass} font-mono text-[11px] font-semibold text-slate-500`}
                    >
                      {disbursedDate}
                    </td>

                    <td
                      className={`${normalCellClass} font-mono text-[11px] font-semibold text-slate-500`}
                    >
                      {depositDate}
                    </td>

                    <td
                      className={`${normalCellClass} max-w-55 truncate text-[11px] text-slate-500`}
                    >
                      {latestTimelineDate}
                    </td>
                    <td
                      className={`${normalCellClass} max-w-55 truncate text-[11px] text-slate-500`}
                      title={latestRemark}
                    >
                      {latestRemark}
                    </td>

                    <td className="sticky right-0 z-30 border-l border-slate-200 bg-white px-5 py-3.5 text-right align-middle shadow-[-2px_0_8px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex flex-nowrap items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/student-profiles/${student.id}`)
                          }
                          className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-red-600/10 px-2.5 py-1.5 text-[10px] font-black tracking-wide text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                        >
                          <Eye className="h-3 w-3" />
                          <span>View</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-center text-sm text-muted-foreground sm:text-left">
          Showing {meta?.total ? (page - 1) * limit + 1 : 0}–
          {Math.min(page * limit, meta?.total ?? 0)} of {meta?.total ?? 0}
        </div>

        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) {
                      setPage((p) => p - 1);
                    }
                  }}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              <PaginationItem>
                <span className="px-4 text-sm font-medium">
                  Page {meta?.page ?? page} of {meta?.totalPages ?? 1}
                </span>
              </PaginationItem>

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();

                    if (page < (meta?.totalPages ?? 1)) {
                      setPage((p) => p + 1);
                    }
                  }}
                  className={
                    page >= (meta?.totalPages ?? 1)
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              setLimit(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
