// app\(dashboard)\master-tracker\page.tsx
"use client";

import React, {
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowRight, GripVertical, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import TrackerFilter from "./TrackerFilter";
import { useMasterTracker } from "@/hooks/application-tracker/useMasterTracker";

import type {
  StudentModuleStatus,
  StudentModuleType,
  StudentRecord,
} from "@/types/student";

type KanbanStage =
  | "Inquiry"
  | "Documents"
  | "Applied"
  | "Visa Process"
  | "Loan Process";

type CardColor = "red" | "green" | "yellow" | "white";

type TrackerStudent = StudentRecord & {
  recordType: "student";
};

type DraggedStudent = {
  studentId: string;
  fromStage: KanbanStage;
};
type PendingStageMove = {
  studentId: string;
  studentName: string;
  fromStage: KanbanStage;
  toStage: KanbanStage;
};
type InfoRowProps = {
  label: string;
  value: React.ReactNode;
};
type CurrentUser = {
  id: string;
  name: string;
  email: string;

  role?: {
    id: string;
    name: string;
  };
};
const KANBAN_COLUMNS: {
  id: KanbanStage;
  label: string;
  badgeStyle: string;
}[] = [
  {
    id: "Inquiry",
    label: "Inquiry",
    badgeStyle: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  },
  {
    id: "Documents",
    label: "Documents",
    badgeStyle:
      "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
  },
  {
    id: "Applied",
    label: "Uni Applied",
    badgeStyle: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
  {
    id: "Loan Process",
    label: "Loan Process",
    badgeStyle: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  {
    id: "Visa Process",
    label: "Visa Process",
    badgeStyle:
      "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
  },
];

const STAGE_ORDER: KanbanStage[] = [
  "Inquiry",
  "Documents",
  "Applied",
  "Loan Process",
  "Visa Process",
];

const STAGE_MODULE_MAP: Record<KanbanStage, StudentModuleType> = {
  Inquiry: "basic_information",
  Documents: "documents",
  Applied: "university_applications",
  "Visa Process": "visa_process",
  "Loan Process": "loan_process",
};

const INITIAL_FILTERS = {
  search: "",
  dateRange: "all",
  branchId: "",
  counselorId: "",
  country: "",
  intake: "",
  stage: "",
  moduleStatus: "",
  recordType: "",
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <div className="flex h-9 items-center justify-between gap-2 rounded-xl bg-white/60 px-3 text-xs dark:bg-slate-950/40">
      <span className="shrink-0 font-medium text-slate-500 dark:text-white">
        {label}
      </span>

      <span className="min-w-0 truncate text-right font-bold">{value}</span>
    </div>
  );
}

export default function ApplicationsTrackerPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useMasterTracker();

  const students: StudentRecord[] = data?.students ?? [];

  const dragRef = useRef<DraggedStudent | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

  const [draggedStudent, setDraggedStudent] = useState<DraggedStudent | null>(
    null,
  );

  const [dragOverStage, setDragOverStage] = useState<KanbanStage | null>(null);

  const [movingStudentId, setMovingStudentId] = useState<string | null>(null);
  const [pendingStageMove, setPendingStageMove] =
    useState<PendingStageMove | null>(null);
  const getModuleProgress = useCallback(
    (student: StudentRecord, module: StudentModuleType) => {
      return student.moduleProgress?.find((item) => item.module === module);
    },
    [],
  );

  const getModuleStatus = useCallback(
    (
      student: StudentRecord,
      module: StudentModuleType,
    ): StudentModuleStatus => {
      return getModuleProgress(student, module)?.status ?? "not_started";
    },
    [getModuleProgress],
  );
  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          return;
        }

        const user = (await response.json()) as CurrentUser;

        if (mounted) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error("MASTER_TRACKER_CURRENT_USER_ERROR", error);
      }
    };

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);
  const canMoveBackward = useMemo(() => {
    const roleName = currentUser?.role?.name?.trim().toLowerCase();

    return roleName === "super admin" || roleName === "director";
  }, [currentUser]);
  const mapStageToKanban = useCallback(
    (student: StudentRecord): KanbanStage => {
      switch (student.currentStage) {
        case "application_started":
          return "Inquiry";

        case "application_submitted":
          return "Documents";

        case "offer_received":
          return "Applied";

        case "deposit_pending":
        case "deposit_paid":
        case "cas_pending":
        case "cas_received":
        case "visa_filing":
        case "visa_approved":
        case "visa_rejected":
          return "Visa Process";

        case "enrolled":
          return "Loan Process";

        default:
          return "Inquiry";
      }
    },
    [],
  );

  const getCurrentModuleStatus = useCallback(
    (student: StudentRecord): StudentModuleStatus => {
      const stage = mapStageToKanban(student);
      return getModuleStatus(student, STAGE_MODULE_MAP[stage]);
    },
    [getModuleStatus, mapStageToKanban],
  );

  const canDragStudent = useCallback(
    (student: StudentRecord): boolean => {
      const currentStage = mapStageToKanban(student);

      const currentStageIndex = STAGE_ORDER.indexOf(currentStage);

      const progress = getModuleProgress(
        student,
        STAGE_MODULE_MAP[currentStage],
      );

      const canMoveForward =
        currentStageIndex < STAGE_ORDER.length - 1 &&
        progress?.status === "completed" &&
        progress.progress === 100;

      const canMoveBack = canMoveBackward && currentStageIndex > 0;

      return canMoveForward || canMoveBack;
    },
    [canMoveBackward, getModuleProgress, mapStageToKanban],
  );

  const canMoveToStage = useCallback(
    (student: StudentRecord, destination: KanbanStage): boolean => {
      const currentStage = mapStageToKanban(student);

      const currentStageIndex = STAGE_ORDER.indexOf(currentStage);

      const destinationStageIndex = STAGE_ORDER.indexOf(destination);

      const stageDifference = destinationStageIndex - currentStageIndex;

      const isForwardMove = stageDifference === 1;

      const isBackwardMove = stageDifference === -1;

      if (isBackwardMove) {
        return canMoveBackward;
      }

      if (!isForwardMove) {
        return false;
      }

      const progress = getModuleProgress(
        student,
        STAGE_MODULE_MAP[currentStage],
      );

      return progress?.status === "completed" && progress.progress === 100;
    },
    [canMoveBackward, getModuleProgress, mapStageToKanban],
  );

  const handleDragStart = useCallback(
    (event: DragEvent<HTMLElement>, student: StudentRecord) => {
      if (!canDragStudent(student)) {
        event.preventDefault();
        return;
      }

      const dragData: DraggedStudent = {
        studentId: student.id,
        fromStage: mapStageToKanban(student),
      };

      dragRef.current = dragData;
      setDraggedStudent(dragData);

      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/x-student-id", student.id);
      event.dataTransfer.setData("text/plain", student.id);
    },
    [canDragStudent, mapStageToKanban],
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLElement>, destination: KanbanStage) => {
      const dragData = dragRef.current ?? draggedStudent;

      if (!dragData) {
        return;
      }

      const student = students.find((item) => item.id === dragData.studentId);

      if (!student || !canMoveToStage(student, destination)) {
        event.dataTransfer.dropEffect = "none";
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      event.dataTransfer.dropEffect = "move";

      setDragOverStage(destination);
    },
    [canMoveToStage, draggedStudent, students],
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>, destination: KanbanStage) => {
      event.preventDefault();
      event.stopPropagation();

      const studentId =
        dragRef.current?.studentId ||
        draggedStudent?.studentId ||
        event.dataTransfer.getData("application/x-student-id") ||
        event.dataTransfer.getData("text/plain");

      setDragOverStage(null);

      if (!studentId) {
        dragRef.current = null;
        setDraggedStudent(null);
        return;
      }

      const student = students.find((item) => item.id === studentId);

      if (!student || !canMoveToStage(student, destination)) {
        dragRef.current = null;
        setDraggedStudent(null);
        return;
      }

      const fromStage = mapStageToKanban(student);

      setPendingStageMove({
        studentId: student.id,
        studentName: student.studentName,
        fromStage,
        toStage: destination,
      });

      dragRef.current = null;
      setDraggedStudent(null);
      setDragOverStage(null);
    },
    [canMoveToStage, draggedStudent, mapStageToKanban, students],
  );
  const handleConfirmStageMove = useCallback(async () => {
    if (!pendingStageMove || movingStudentId) {
      return;
    }

    const { studentId, toStage } = pendingStageMove;

    setMovingStudentId(studentId);

    try {
      const response = await fetch(`/api/students/${studentId}/stage`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nextStage: toStage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message ?? "Unable to move student");
      }
      setPendingStageMove(null);

      await queryClient.invalidateQueries({
        queryKey: ["master-tracker"],
      });

      await queryClient.refetchQueries({
        queryKey: ["master-tracker"],
        type: "active",
      });
    } catch (error) {
      console.error("MASTER_TRACKER_STAGE_MOVE_ERROR", error);
    } finally {
      setMovingStudentId(null);
    }
  }, [movingStudentId, pendingStageMove, queryClient]);
  const handleCancelStageMove = useCallback(() => {
    if (movingStudentId) {
      return;
    }

    setPendingStageMove(null);
    dragRef.current = null;
    setDraggedStudent(null);
    setDragOverStage(null);
  }, [movingStudentId]);
  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
    setDraggedStudent(null);
    setDragOverStage(null);
  }, []);

  const trackerData: TrackerStudent[] = useMemo(
    () =>
      students.map((student) => ({
        ...student,
        recordType: "student",
      })),
    [students],
  );

  const filteredTrackerData = useMemo(() => {
    return trackerData.filter((item) => {
      const search = filters.search.trim().toLowerCase();

      const matchesSearch =
        !search ||
        item.studentName?.toLowerCase().includes(search) ||
        item.mobileNumber?.toLowerCase().includes(search) ||
        item.emailId?.toLowerCase().includes(search);

      const matchesStage =
        !filters.stage || mapStageToKanban(item) === filters.stage;

      const matchesCountry =
        !filters.country || item.lead?.preferredCountry === filters.country;

      const matchesIntake =
        !filters.intake || item.lead?.preferredIntake === filters.intake;

      const matchesBranch =
        !filters.branchId || item.branch?.name === filters.branchId;

      const matchesCounselor =
        !filters.counselorId || item.counselor?.name === filters.counselorId;

      const matchesModuleStatus =
        !filters.moduleStatus ||
        getCurrentModuleStatus(item) === filters.moduleStatus;

      let matchesDate = true;

      if (filters.dateRange !== "all") {
        const createdDate = new Date(item.createdAt);
        const today = new Date();

        if (filters.dateRange === "today") {
          matchesDate = createdDate.toDateString() === today.toDateString();
        }

        if (filters.dateRange === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(today.getDate() - 7);
          matchesDate = createdDate >= weekAgo;
        }

        if (filters.dateRange === "month") {
          matchesDate =
            createdDate.getMonth() === today.getMonth() &&
            createdDate.getFullYear() === today.getFullYear();
        }
      }

      return (
        matchesSearch &&
        matchesStage &&
        matchesCountry &&
        matchesIntake &&
        matchesBranch &&
        matchesCounselor &&
        matchesModuleStatus &&
        matchesDate
      );
    });
  }, [filters, getCurrentModuleStatus, mapStageToKanban, trackerData]);

  const branchOptions = useMemo(
    () => [
      ...new Set(
        students
          .map((student) => student.branch?.name)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [students],
  );

  const counselorOptions = useMemo(
    () => [
      ...new Set(
        students
          .map((student) => student.counselor?.name)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [students],
  );

  const countryOptions = useMemo(
    () => [
      ...new Set(
        students
          .map((student) => student.lead?.preferredCountry)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [students],
  );

  const intakeOptions = useMemo(
    () => [
      ...new Set(
        students
          .map((student) => student.lead?.preferredIntake)
          .filter((value): value is string => Boolean(value)),
      ),
    ],
    [students],
  );

  const getCardColor = useCallback(
    (student: StudentRecord): CardColor => {
      const stage = mapStageToKanban(student);

      const status = getModuleStatus(student, STAGE_MODULE_MAP[stage]);

      if (status === "completed") {
        return "green";
      }

      if (status === "rejected") {
        return "red";
      }

      if (
        status === "started" ||
        status === "in_progress" ||
        status === "need_corrections"
      ) {
        return "yellow";
      }

      return "white";
    },
    [getModuleStatus, mapStageToKanban],
  );

  const getCardClasses = (color: CardColor) => {
    if (color === "green") {
      return "border-emerald-300 bg-emerald-300 dark:border-emerald-800 dark:bg-emerald-300 dark:text-white";
    }

    if (color === "yellow") {
      return "border-amber-300 bg-amber-200 dark:border-amber-800 dark:bg-amber-200";
    }

    if (color === "red") {
      return "border-rose-300 bg-rose-200 dark:border-rose-800 dark:bg-rose-950/30";
    }

    return "border-slate-200 bg-white dark:border-white dark:bg-white";
  };
  const formatDate = (value?: string | Date | null): string => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString("en-GB");
  };

  const formatStatus = (value?: string | null): string => {
    if (!value) {
      return "-";
    }

    return value
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const formatAmount = (value?: string | number | null): string => {
    if (value === null || value === undefined || value === "") {
      return "-";
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
      return "-";
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getNextApplicationFollowUp = (student: StudentRecord) => {
    const applications = student.applications ?? [];

    const applicationsWithFollowUp = applications
      .filter((application) => application.followUpDate)
      .sort(
        (first, second) =>
          new Date(first.followUpDate!).getTime() -
          new Date(second.followUpDate!).getTime(),
      );

    return applicationsWithFollowUp[0] ?? null;
  };

  const getLatestRemark = (student: StudentRecord) => {
    const remarks = student.remarks ?? [];

    if (remarks.length === 0) {
      return null;
    }

    return [...remarks].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    )[0];
  };
  const renderStageContent = (student: StudentRecord, stage: KanbanStage) => {
    if (stage === "Inquiry") {
      return (
        <>
          <InfoRow
            label="Country"
            value={student.lead?.preferredCountry || "-"}
          />

          <InfoRow
            label="Intake"
            value={student.lead?.preferredIntake || "-"}
          />

          <InfoRow
            label="Course"
            value={student.lead?.preferredCourse || "-"}
          />

          <InfoRow
            label="Education"
            value={student.lead?.bachelorsCourse || "-"}
          />

          <InfoRow
            label="Loan Required"
            value={student.lead?.loanRequirement ? "Yes" : "No"}
          />
        </>
      );
    }
    if (stage === "Documents") {
      const documents = student.documents ?? [];

      const latestDocument = [...documents].sort(
        (first, second) =>
          new Date(second.updatedAt).getTime() -
          new Date(first.updatedAt).getTime(),
      )[0];

      const latestRemark = getLatestRemark(student);

      return (
        <>
          <InfoRow label="Uploaded" value={documents.length} />

          <InfoRow
            label="Progress"
            value={`${getModuleProgress(student, "documents")?.progress ?? 0}%`}
          />

          <InfoRow
            label="Last Document"
            value={latestDocument?.documentType || "-"}
          />

          <InfoRow
            label="Last Upload"
            value={formatDate(latestDocument?.updatedAt)}
          />

          <InfoRow label="Latest Remark" value={latestRemark?.note || "-"} />
        </>
      );
    }
    if (stage === "Applied") {
      const applications = student.applications ?? [];

      const appliedApplications = applications.filter(
        (application) => application.status === "applied",
      );

      const offersReceived = applications.filter(
        (application) =>
          application.offerStatus && application.offerStatus !== "PENDING",
      );

      const nextFollowUp = getNextApplicationFollowUp(student);

      return (
        <>
          <InfoRow label="Universities" value={applications.length} />

          <InfoRow label="Applications" value={appliedApplications.length} />

          <InfoRow label="Offers" value={offersReceived.length} />

          <InfoRow
            label="Next University"
            value={nextFollowUp?.university?.name || "-"}
          />

          <InfoRow
            label="Next Follow-up"
            value={formatDate(nextFollowUp?.followUpDate)}
          />
        </>
      );
    }
    if (stage === "Loan Process") {
      const loan = student.loanProfile;

      return (
        <>
          <InfoRow
            label="Assignee"
            value={loan?.fintechAssignee?.name || "Unassigned"}
          />

          <InfoRow label="NBFC" value={loan?.nbfc || "-"} />

          <InfoRow label="Loan Status" value={formatStatus(loan?.loanStatus)} />

          <InfoRow label="PF Status" value={formatStatus(loan?.pfStatus)} />

          <InfoRow label="Disbursed" value={loan?.disbursed ? "Yes" : "No"} />
        </>
      );
    }
    const visa = student.visaProfile;

    return (
      <>
        <InfoRow label="Deposit" value={formatStatus(visa?.depositStatus)} />

        <InfoRow label="CAS" value={formatStatus(visa?.casStatus)} />

        <InfoRow label="IHS" value={formatStatus(visa?.ihsPaidStatus)} />

        <InfoRow label="Visa" value={formatStatus(visa?.visaStatus)} />

        <InfoRow
          label="Start Date"
          value={formatDate(visa?.universityStartDate)}
        />
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <TrackerFilter
        filters={filters}
        setFilters={setFilters}
        branchOptions={branchOptions}
        counselorOptions={counselorOptions}
        countryOptions={countryOptions}
        intakeOptions={intakeOptions}
      />
      <AlertDialog
        open={pendingStageMove !== null}
        onOpenChange={(open) => {
          if (!open && !movingStudentId) {
            handleCancelStageMove();
          }
        }}
      >
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stage Movement</AlertDialogTitle>

            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Are you sure you want to move{" "}
                  <span className="font-semibold text-foreground">
                    {pendingStageMove?.studentName}
                  </span>{" "}
                  from{" "}
                  <span className="font-semibold text-foreground">
                    {pendingStageMove?.fromStage}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-foreground">
                    {pendingStageMove?.toStage}
                  </span>
                  ?
                </p>

                <div className="flex items-center justify-center gap-3 rounded-2xl border bg-muted/40 p-4">
                  <div className="min-w-0 flex-1 rounded-xl border bg-background px-3 py-3 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      Current Stage
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-foreground">
                      {pendingStageMove?.fromStage}
                    </p>
                  </div>

                  <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground" />

                  <div className="min-w-0 flex-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-center dark:border-emerald-900 dark:bg-emerald-950/30">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
                      Next Stage
                    </p>

                    <p className="mt-1 truncate text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      {pendingStageMove?.toStage}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {pendingStageMove &&
                  STAGE_ORDER.indexOf(pendingStageMove.toStage) <
                    STAGE_ORDER.indexOf(pendingStageMove.fromStage)
                    ? "Admin/Director backward movement will preserve the existing module progress."
                    : "After confirmation, the student will move forward and the next stage progress will start from 0%."}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              disabled={Boolean(movingStudentId)}
              onClick={handleCancelStageMove}
              className="rounded-xl"
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              disabled={Boolean(movingStudentId)}
              onClick={(event) => {
                event.preventDefault();

                void handleConfirmStageMove();
              }}
              className="gap-2 rounded-xl"
            >
              {movingStudentId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Moving...
                </>
              ) : (
                <>
                  <ArrowRight className="h-4 w-4" />
                  Confirm & Move
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="w-full overflow-x-auto overscroll-x-contain pb-4">
        <div className="grid min-w-[1400px] grid-cols-5 items-start gap-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnStudents = filteredTrackerData.filter(
              (student) => mapStageToKanban(student) === column.id,
            );

            const isValidDropColumn = (() => {
              if (!draggedStudent) {
                return false;
              }

              const currentStageIndex = STAGE_ORDER.indexOf(
                draggedStudent.fromStage,
              );

              const destinationStageIndex = STAGE_ORDER.indexOf(column.id);

              const stageDifference = destinationStageIndex - currentStageIndex;

              const isForwardMove = stageDifference === 1;

              const isBackwardMove = canMoveBackward && stageDifference === -1;

              return isForwardMove || isBackwardMove;
            })();

            const isDragOver = dragOverStage === column.id && isValidDropColumn;

            return (
              <section
                key={column.id}
                onDragEnter={(event) => {
                  if (isValidDropColumn) {
                    event.preventDefault();
                    setDragOverStage(column.id);
                  }
                }}
                onDragOver={(event) => handleDragOver(event, column.id)}
                onDrop={(event) => handleDrop(event, column.id)}
                className={`flex min-h-[600px] min-w-0 flex-col rounded-2xl border p-4 transition-colors ${
                  isDragOver
                    ? "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20"
                    : isValidDropColumn
                      ? "border-blue-400 bg-blue-50/40 dark:bg-blue-950/20"
                      : "border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/40"
                }`}
              >
                <div className="mb-4 flex h-10 shrink-0 items-center justify-between border-b pb-3">
                  <span
                    className={`whitespace-nowrap rounded-lg px-3 py-1 text-[10px] font-black uppercase ${column.badgeStyle}`}
                  >
                    {column.label}
                  </span>

                  <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold dark:bg-slate-900">
                    {columnStudents.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {columnStudents.length === 0 ? (
                    <div className="flex h-40 items-center justify-center rounded-xl border border-dashed text-center text-xs font-semibold text-slate-400">
                      {isValidDropColumn ? "Drop student here" : "No students"}
                    </div>
                  ) : (
                    columnStudents.map((student) => {
                      const stage = mapStageToKanban(student);

                      const moduleProgress = getModuleProgress(
                        student,
                        STAGE_MODULE_MAP[stage],
                      );

                      const progress = moduleProgress?.progress ?? 0;

                      const color = getCardColor(student);

                      const draggable = canDragStudent(student);

                      const moving = movingStudentId === student.id;

                      return (
                        <article
                          key={student.id}
                          draggable={draggable && !moving}
                          onDragStart={(event) =>
                            handleDragStart(event, student)
                          }
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            if (!moving) {
                              router.push(`/student-profiles/${student.id}`);
                            }
                          }}
                          className={`relative flex h-[390px] min-w-0 flex-col rounded-2xl border p-4 shadow-sm transition-shadow ${getCardClasses(
                            color,
                          )} ${
                            draggable
                              ? "cursor-grab hover:shadow-md active:cursor-grabbing"
                              : "cursor-pointer"
                          }`}
                        >
                          {moving && (
                            <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-background/80">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          )}

                          <div className="flex h-8 shrink-0 items-center justify-between gap-2">
                            <div className="flex min-w-0 items-center gap-2">
                              {draggable ? (
                                <GripVertical className="h-4 w-4 shrink-0 text-emerald-600" />
                              ) : (
                                <LockKeyhole className="h-4 w-4 shrink-0 text-slate-400" />
                              )}

                              <h3 className="truncate text-sm font-bold">
                                {student.studentName}
                              </h3>
                            </div>

                            <span className="shrink-0 rounded-full bg-background/70 px-2 py-1 text-[10px] font-bold uppercase">
                              {(student.lead?.preferredCountry ?? "---").slice(
                                0,
                                3,
                              )}
                            </span>
                          </div>

                          <div className="mt-4 flex h-[174px] shrink-0 flex-col gap-2 overflow-hidden">
                            {renderStageContent(student, stage)}
                          </div>

                          <div className="mt-4 shrink-0">
                            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>

                            <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                              <div
                                className={`h-full rounded-full transition-[width] duration-300 ${
                                  color === "green"
                                    ? "bg-emerald-500"
                                    : color === "yellow"
                                      ? "bg-amber-500"
                                      : color === "red"
                                        ? "bg-rose-500"
                                        : "bg-slate-400"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, progress),
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>

                          <div className="mt-auto flex h-12 shrink-0 items-end justify-between gap-2 border-t pt-3">
                            <span className="min-w-0 truncate text-[11px] font-semibold text-slate-500">
                              {student.lead?.preferredIntake || "Not Selected"}
                            </span>

                            <span className="max-w-[50%] shrink-0 truncate rounded-md bg-red-500/10 px-2 py-1 text-[10px] font-bold text-red-600">
                              {student.counselor?.name || "Unassigned"}
                            </span>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
