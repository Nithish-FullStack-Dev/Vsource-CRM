// app\(dashboard)\master-tracker\page.tsx
"use client";

import React, { useState } from "react";
import {
  GripVertical,
  ArrowRight,
  UserCheck,
  Inbox,
  AlertCircle,
  FileText,
  CheckCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMasterTracker } from "@/hooks/application-tracker/useMasterTracker";
import type { StudentRecord } from "@/types/student";
import { useRouter } from "next/navigation";
import TrackerFilter from "./TrackerFilter";

const KANBAN_COLUMNS = [
  {
    id: "Inquiry",
    label: "Inquiry",
    headerStyle:
      "border-sky-200 dark:border-sky-900/50 text-sky-800 dark:text-sky-300 bg-sky-50/60 dark:bg-sky-950/15",
    badgeStyle: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    id: "Documents",
    label: "Documents",
    headerStyle:
      "border-gray-300 dark:border-gray-900/50 text-gray-805 dark:text-gray-300 bg-gray-100/50 dark:bg-gray-950/15",
    badgeStyle:
      "bg-gray-100/90 text-gray-950 border border-gray-200 dark:bg-gray-950 dark:text-gray-300",
  },
  {
    id: "Applied",
    label: "Uni Applied",
    headerStyle:
      "border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 bg-rose-50/60 dark:bg-rose-950/15",
    badgeStyle: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
  {
    id: "Visa Process",
    label: "Visa Process",
    headerStyle:
      "border-purple-200 dark:border-purple-900/50 text-purple-800 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-950/15",
    badgeStyle:
      "bg-purple-100 text-purple-800 dark:bg-purple-955 dark:text-purple-300",
  },
] as const;

type InfoRowProps = {
  label: string;
  value: React.ReactNode;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
      <span className="font-medium text-slate-500">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

export default function ApplicationsTrackerPage() {
  const { data, isLoading } = useMasterTracker();
  const router = useRouter();
  const students: StudentRecord[] = data?.students ?? [];
  const isDarkMode = false;
  const [filters, setFilters] = useState({
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

  const onSelectStudent = (id: string) => {
    router.push(`/student-profiles/${id}`);
  };

  // State for interactive popups in simple English
  const [moveConfirm, setMoveConfirm] = useState<{
    studentId: string;
    studentName: string;
    fromStage: string;
    toStage: string;
  } | null>(null);

  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Maps student current stage text to the correct Kanban Column ID
  const getModuleStatus = (
    student: StudentRecord,
    module:
      | "basic_information"
      | "documents"
      | "university_applications"
      | "visa_process",
  ) => {
    return (
      student.moduleProgress?.find((item) => item.module === module)?.status ??
      "pending"
    );
  };

  const getCurrentModuleStatus = (student: StudentRecord) => {
    const basic = getModuleStatus(student, "basic_information");
    if (basic !== "completed") return basic;

    const docs = getModuleStatus(student, "documents");
    if (docs !== "completed") return docs;

    const apps = getModuleStatus(student, "university_applications");
    if (apps !== "completed") return apps;

    return getModuleStatus(student, "visa_process");
  };

  const mapStageToKanban = (item: any): string => {
    if (item.recordType === "lead") {
      return "Inquiry";
    }

    const basicInfo = getModuleStatus(item, "basic_information");
    const documents = getModuleStatus(item, "documents");
    const applications = getModuleStatus(item, "university_applications");
    const visa = getModuleStatus(item, "visa_process");

    if (basicInfo !== "completed") {
      return "Inquiry";
    }

    if (documents !== "completed") {
      return "Documents";
    }

    if (applications !== "completed") {
      return "Applied";
    }

    if (visa !== "completed") {
      return "Visa Process";
    }

    return "Visa Process";
  };

  // Convert column key back to standard Stage Value
  const mapKanbanToStageValue = (kanbanStage: string): string => {
    switch (kanbanStage) {
      case "Inquiry":
        return "Lead Created";
      case "Documents":
        return "Documents";
      case "Applied":
        return "Application Submitted";
      case "Visa Process":
        return "Visa Applied";
      default:
        return "Lead Created";
    }
  };

  // Colors as specified: yellow, white, green, last option red
  const getStudentColorThemeKey = (
    item: any,
  ): "red" | "green" | "yellow" | "white" => {
    if (item.recordType === "lead") {
      switch (item.status) {
        case "converted":
          return "green";
        case "qualified":
        case "contacted":
          return "yellow";
        case "lost":
          return "red";
        default:
          return "white";
      }
    }

    const stage = mapStageToKanban(item);
    let currentStatus = "pending";

    switch (stage) {
      case "Inquiry":
        currentStatus = getModuleStatus(item, "basic_information");
        break;
      case "Documents":
        currentStatus = getModuleStatus(item, "documents");
        break;
      case "Applied":
        currentStatus = getModuleStatus(item, "university_applications");
        break;
      case "Visa Process":
        currentStatus = getModuleStatus(item, "visa_process");
        break;
    }

    switch (currentStatus) {
      case "completed":
        return "green";
      case "rejected":
        return "red";
      case "started":
      case "in_progress":
      case "need_corrections":
        return "yellow";
      case "pending":
      default:
        return "white";
    }
  };

  // Beautiful styling colors featuring proper vibrant, cheerful yellow!
  const getColorClasses = (
    colorTheme: "red" | "green" | "yellow" | "white",
  ) => {
    switch (colorTheme) {
      case "red":
        return isDarkMode
          ? "bg-rose-950/20 border-rose-800 text-slate-100 hover:bg-rose-955/30 hover:border-rose-700 shadow-rose-950/5"
          : "bg-rose-50 border-rose-200 text-rose-950 hover:bg-rose-100/40 hover:border-rose-300 shadow-rose-200/10";
      case "green":
        return isDarkMode
          ? "bg-emerald-950/25 border-emerald-800 text-slate-100 hover:bg-emerald-950/35 hover:border-emerald-700 shadow-emerald-950/5"
          : "bg-emerald-50 border-emerald-200 text-emerald-950 hover:bg-emerald-100/40 hover:border-emerald-300 shadow-emerald-200/10";
      case "yellow":
        // PROPER vibrant, warm cheerful yellow as requested!
        return isDarkMode
          ? "bg-yellow-950/40 border-yellow-600/80 text-yellow-100 hover:bg-yellow-900/50 hover:border-yellow-500 shadow-yellow-950/10"
          : "bg-amber-100/90 border-amber-300 text-amber-950 font-medium hover:bg-amber-200/80 hover:border-amber-400 shadow-amber-200/20";
      case "white":
      default:
        return isDarkMode
          ? "bg-slate-900 border-slate-800 text-slate-100 hover:bg-slate-850 hover:border-slate-700 shadow-slate-950/5"
          : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-slate-100/30";
    }
  };

  const getProgressPercent = (kanbanStage: string): number => {
    switch (kanbanStage) {
      case "Inquiry":
        return 16;
      case "Documents":
        return 33;
      case "Applied":
        return 50;
      case "Offer Received":
        return 66;
      case "Visa Process":
        return 83;
      case "Enrolled":
        return 100;
      default:
        return 16;
    }
  };

  // Drag handles and verification

  const confirmMove = async () => {
    if (!moveConfirm) return;

    const { studentId, toStage } = moveConfirm;
    const nextStageValue = mapKanbanToStageValue(toStage);

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/students/${studentId}/stage`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            currentStage: nextStageValue,
          }),
        },
      );
      window.location.reload();
    } catch (error) {
      console.error(error);
    }
    setMoveConfirm(null);
  };

  const trackerData = students.map((student) => ({
    ...student,
    recordType: "student",
  }));

  const filteredTrackerData = trackerData.filter((item: any) => {
    const search = filters.search.toLowerCase();
    const matchesSearch =
      !search ||
      item.studentName?.toLowerCase().includes(search) ||
      item.mobileNumber?.toLowerCase().includes(search) ||
      item.emailId?.toLowerCase().includes(search);

    const matchesRecordType =
      !filters.recordType || item.recordType === filters.recordType;

    const matchesStage =
      !filters.stage || mapStageToKanban(item) === filters.stage;

    const matchesCountry =
      !filters.country || item.lead?.preferredCountry === filters.country;
    const matchesIntake =
      !filters.intake || item.lead?.preferredIntake === filters.intake;
    let matchesDate = true;
    const matchesBranch =
      !filters.branchId || item.branch?.name === filters.branchId;
    const matchesCounselor =
      !filters.counselorId || item.counselor?.name === filters.counselorId;

    if (filters.dateRange !== "all") {
      const date = new Date(item.createdAt);
      const today = new Date();

      if (filters.dateRange === "today") {
        matchesDate = date.toDateString() === today.toDateString();
      }

      if (filters.dateRange === "week") {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        matchesDate = date >= weekAgo;
      }

      if (filters.dateRange === "month") {
        matchesDate =
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear();
      }
    }

    let matchesModuleStatus = true;
    if (item.recordType === "student" && filters.moduleStatus) {
      matchesModuleStatus =
        getCurrentModuleStatus(item) === filters.moduleStatus;
    }

    return (
      matchesSearch &&
      matchesBranch &&
      matchesCounselor &&
      matchesStage &&
      matchesCountry &&
      matchesIntake &&
      matchesDate &&
      matchesModuleStatus
    );
  });

  const branchOptions: string[] = [
    ...new Set(
      students
        .map((s) => s.branch?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  const counselorOptions: string[] = [
    ...new Set(
      students
        .map((s) => s.counselor?.name)
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  const countryOptions: string[] = [
    ...new Set(
      students
        .map((s) => s.lead?.preferredCountry)
        .filter((country): country is string => Boolean(country)),
    ),
  ];

  const intakeOptions: string[] = [
    ...new Set(
      students
        .map((s) => s.lead?.preferredIntake)
        .filter((intake): intake is string => Boolean(intake)),
    ),
  ];

  const renderStageContent = (student: StudentRecord, stage: string) => {
    if (stage === "Inquiry") {
      const profileFields = [
        student.lead?.passport,
        student.lead?.preferredCountry,
        student.lead?.preferredCourse,
        student.lead?.preferredIntake,
        student.lead?.bachelorsCourse,
        student.counselor?.name,
      ];
      const completedFields = profileFields.filter(Boolean).length;
      const profileCompletion = Math.round(
        (completedFields / profileFields.length) * 100,
      );

      return (
        <div className="space-y-3">
          <InfoRow
            label="Passport"
            value={student.lead?.passport || "Not Added"}
          />
          <InfoRow
            label="Country"
            value={student.lead?.preferredCountry || "Not Selected"}
          />
          <InfoRow
            label="Intake"
            value={student.lead?.preferredIntake || "Not Selected"}
          />
          <InfoRow
            label="Education"
            value={student.lead?.bachelorsCourse || "Not Added"}
          />
        </div>
      );
    }

    if (stage === "Documents") {
      const uploaded = student.documents?.length ?? 0;

      const status =
        student.moduleProgress?.find((m) => m.module === "documents")?.status ??
        "pending";

      return (
        <div className="space-y-2">
          <InfoRow label="Documents" value={uploaded} />

          <InfoRow label="Checklist" value={status.replaceAll("_", " ")} />

          <InfoRow
            label="Updated"
            value={new Date(student.updatedAt).toLocaleDateString()}
          />
        </div>
      );
    }

    if (stage === "Applied") {
      const totalApps = student.applications?.length ?? 0;
      const appliedCount =
        student.applications?.filter((app) => app.status === "applied")
          .length ?? 0;
      const draftCount =
        student.applications?.filter((app) => app.status === "draft").length ??
        0;
      const offerReceivedCount =
        student.applications?.filter(
          (app) => app.offerStatus !== "not_received",
        ).length ?? 0;

      return (
        <div className="space-y-2">
          <InfoRow label="Uni Application" value={totalApps} />
          <InfoRow label="Uni Applied" value={appliedCount} />
          <InfoRow label="Uni Draft" value={draftCount} />
          <InfoRow label="Uni Offers" value={offerReceivedCount} />
        </div>
      );
    }

    if (stage === "Visa Process") {
      return (
        <div className="space-y-2">
          <InfoRow
            label="CAS"
            value={student.visaLoanProfile?.casStatus ?? "-"}
          />
          <InfoRow
            label="Visa"
            value={student.visaLoanProfile?.visaStatus ?? "-"}
          />
          <InfoRow
            label="Loan"
            value={student.visaLoanProfile?.loanStatus ?? "-"}
          />
          <InfoRow label="NBFC" value={student.visaLoanProfile?.nbfc ?? "-"} />
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <TrackerFilter
        filters={filters}
        setFilters={setFilters}
        branchOptions={branchOptions}
        counselorOptions={counselorOptions}
        countryOptions={countryOptions}
        intakeOptions={intakeOptions}
      />

      {/* Grid container perfectly structured for Mobile (1 col) and Desktop (4 cols) */}
      <div className="w-full pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 xl:gap-6">
          {KANBAN_COLUMNS.map((col) => {
            const columnStudents = filteredTrackerData.filter(
              (student: any) => mapStageToKanban(student) === col.id,
            );

            return (
              <div
                key={col.id}
                className="flex flex-col w-full h-full rounded-[28px] border border-slate-200/60 bg-slate-50/45 p-4 xl:p-5 shadow-sm dark:border-slate-800/60 dark:bg-slate-950/40"
              >
                {/* Header section of each Kanban category */}
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200/50 dark:border-slate-800/50">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl ${col.badgeStyle}`}
                    >
                      {col.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 bg-slate-100 dark:bg-slate-900 rounded-lg text-slate-500">
                    {columnStudents.length}
                  </span>
                </div>

                {/* Vertical list of student cards */}
                <div className="flex flex-col gap-3">
                  {columnStudents.length === 0 ? (
                    <div className="py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-850 text-center text-slate-400 font-bold text-xs flex flex-col items-center justify-center">
                      <span className="text-xl mb-1">📭</span>
                      <span>No students at this stage</span>
                    </div>
                  ) : (
                    columnStudents.map((student) => {
                      const colorKey = getStudentColorThemeKey(student);
                      const colorClass = getColorClasses(colorKey);
                      let progressPercent = 0;

                      switch (col.id) {
                        case "Inquiry":
                          progressPercent =
                            student.moduleProgress?.find(
                              (m: any) => m.module === "basic_information",
                            )?.progress ?? 0;
                          break;

                        case "Documents":
                          progressPercent =
                            student.moduleProgress?.find(
                              (m: any) => m.module === "documents",
                            )?.progress ?? 0;
                          break;

                        case "Applied":
                          progressPercent =
                            student.moduleProgress?.find(
                              (m: any) =>
                                m.module === "university_applications",
                            )?.progress ?? 0;
                          break;

                        case "Visa Process":
                          progressPercent =
                            student.moduleProgress?.find(
                              (m: any) => m.module === "visa_process",
                            )?.progress ?? 0;
                          break;
                      }

                      const progressColor =
                        colorKey === "green"
                          ? "bg-emerald-500"
                          : colorKey === "yellow"
                            ? "bg-amber-500"
                            : colorKey === "red"
                              ? "bg-rose-500"
                              : "bg-slate-400";

                      return (
                        <div
                          key={student.id}
                          draggable
                          onClick={() => onSelectStudent(student.id)}
                          className={`relative p-5 rounded-[24px] border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden ${colorClass}`}
                        >
                          {/* Header */}
                          <div>
                            <div className="flex items-start justify-between gap-3">
                              <div
                                className="flex items-center gap-2 min-w-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="text-slate-400 cursor-grab hover:text-slate-600 transition-colors">
                                  <GripVertical className="h-4 w-4" />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h5
                                      onClick={() =>
                                        onSelectStudent(student.id)
                                      }
                                      className="font-bold text-sm truncate cursor-pointer hover:underline"
                                    >
                                      {student.studentName}
                                    </h5>
                                  </div>
                                </div>
                              </div>

                              <div className="px-2 py-1 rounded-full bg-white/60 dark:bg-slate-800/60 shrink-0">
                                <span className="text-[10px] font-bold uppercase text-black dark:text-white">
                                  {(
                                    student?.lead?.preferredCountry ?? "---"
                                  ).substring(0, 3)}
                                </span>
                              </div>
                            </div>

                            <div className="mt-5">
                              {renderStageContent(student, col.id)}
                            </div>

                            {/* Progress */}
                            <div className="mt-5">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[11px] font-semibold text-slate-500">
                                  Progress
                                </span>
                                <span className="text-[11px] font-bold">
                                  {progressPercent}%
                                </span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-slate-800 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                  style={{ width: `${progressPercent}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-slate-500">
                                {student?.lead?.preferredIntake || "Fall 2026"}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold">
                                {student?.counselor?.name || "Unassigned"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
