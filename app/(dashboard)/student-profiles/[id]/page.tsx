// app\(dashboard)\student-profiles\[id]\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  CreditCard,
  FileCheck2,
  User,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Globe2,
  FileSignature,
  FolderOpen,
  ShieldOff,
  Shield,
} from "lucide-react";
import { DMSSection } from "../DMSSection";
import { motion, AnimatePresence } from "framer-motion";
import { useStudents } from "@/hooks/student/useStudents";
import { Remarks, StudentRecord } from "@/types/student";
import { useCreateStudentApplication } from "@/hooks/student/useCreateStudentApplication";
import { useUpdateStudentApplication } from "@/hooks/student/useUpdateStudentApplication";
import { useDeleteStudentApplication } from "@/hooks/student/useDeleteStudentApplication";
import {
  useCreateStudentRemark,
  useRemarks,
} from "@/hooks/student/useCreateStudentRemark";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { STUDENTKEY } from "@/services/student/query-key";
import { toast } from "sonner";
import { StudentBasicInfoDialog } from "@/components/student/StudentBasicInfoDialog";
import { StudentVisaProfileSection } from "@/components/student/StudentVisaProfileForm";
import { StudentLoanProfileSection } from "@/components/student/StudentLoanProfileForm";
import { StudentModuleProgressDialog } from "@/components/student/StudentModuleProgressDialog";
import {
  StudentModuleKey,
  useStudentModuleProgress,
} from "@/hooks/student/useStudentModuleProgress";
import { Progress } from "@/components/ui/progress";
import StudentApplicationsSection from "@/components/student/StudentApplicationsSection";
import { useParams, useRouter } from "next/navigation";
import { usePageTitle } from "@/store/page-title";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";
import { StudentStatusDialog } from "@/components/student/StudentStatusDialog";
import { Button } from "@/components/ui/button";
import { useStudentTimeline } from "@/hooks/student/timeline/useStudentTimeline";
import { useCreateStudentTimeline } from "@/hooks/student/timeline/useCreateStudentTimeline";
import { Badge } from "@/components/ui/badge";
import StudentRemarksTimelineTab from "@/components/student/StudentRemarksTimelineTab";
import StudentComplianceStepper from "./StudentComplianceStep";

const ALL_TABS = [
  {
    key: "info",
    label: "Basic",
    icon: User,
    color: "text-red-500",
  },
  {
    key: "documents",
    label: "Documents",
    icon: FolderOpen,
    color: "text-blue-500",
  },
  {
    key: "applications",
    label: "Uni Applications",
    icon: FileText,
    color: "text-emerald-500",
  },
  {
    key: "loan",
    label: "Loan Process",
    icon: CreditCard,
    color: "text-amber-500",
  },
  {
    key: "visa",
    label: "Visa Process",
    icon: FileCheck2,
    color: "text-purple-500",
  },
  {
    key: "remarks",
    label: "Remarks",
    icon: FileSignature,
    color: "text-rose-500",
  },
] as const;

type StudentDetailTab = (typeof ALL_TABS)[number]["key"];

export default function Home() {
  const queryClient = useQueryClient();
  const { canUpdate, canCreate } = useAuth();
  const [visiblePasswords, setVisiblePasswords] = useState<
    Record<string, boolean>
  >({});
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const { data, isLoading, isError, error } = useStudents();
  const selectedStudentId = studentId;
  const students = useMemo<StudentRecord[]>(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

  const selectedStudent = useMemo<StudentRecord | null>(() => {
    return (
      students.find(
        (student: StudentRecord) => student.id === selectedStudentId,
      ) ?? null
    );
  }, [students, selectedStudentId]);
  const [basicInfoOpen, setBasicInfoOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [currentView] = useState<"students">("students");

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [detailTab, setDetailTab] = useState<StudentDetailTab>("info");
  const { setTitle, clearTitle } = usePageTitle();
  const [newRemarkText, setNewRemarkText] = useState<string>("");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [followupDate, setFollowupDate] = useState("");
  const [timelineType, setTimelineType] = useState<
    | "note"
    | "followup"
    | "call"
    | "meeting"
    | "status_change"
    | "document"
    | "application"
    | "offer_letter"
    | "loan"
    | "visa"
    | "payment"
    | "info"
  >("followup");

  const { data: moduleProgress = [], isLoading: isModuleProgressLoading } =
    useStudentModuleProgress(selectedStudentId || "");

  const { data: remarks = [] } = useRemarks(selectedStudentId ?? "");

  const { data: timeline = [] } = useStudentTimeline(selectedStudentId ?? "");

  const createTimelineMutation = useCreateStudentTimeline(
    selectedStudentId ?? "",
  );

  const tabModuleMap: Partial<Record<StudentDetailTab, StudentModuleKey>> = {
    info: "basic_information",
    documents: "documents",
    applications: "university_applications",
    visa: "visa_process",
    loan: "loan_process",
  };

  const tabProgressMap: Partial<Record<StudentDetailTab, StudentModuleKey>> = {
    info: "basic_information",
    documents: "documents",
    applications: "university_applications",
    visa: "visa_process",
    loan: "loan_process",
  };

  const activeModule = tabModuleMap[detailTab];
  const safeModuleProgress = Array.isArray(moduleProgress)
    ? moduleProgress
    : [];

  const activeModuleProgress = activeModule
    ? safeModuleProgress.find((item) => item?.module === activeModule)
    : undefined;

  const activeProgressValue = Math.min(
    100,
    Math.max(0, Number(activeModuleProgress?.progress) || 0),
  );

  const tabs = useMemo(() => {
    return ALL_TABS.filter((tab) => {
      if (tab.key === "loan") {
        return selectedStudent?.lead?.loanRequirement;
      }

      return true;
    });
  }, [selectedStudent]);

  const activeTabLabel =
    tabs.find((tab) => tab.key === detailTab)?.label ?? "Module";

  useEffect(() => {
    const root = document.documentElement;

    const syncTheme = () => {
      setIsDarkMode(root.classList.contains("dark"));
    };

    syncTheme();

    const observer = new MutationObserver(syncTheme);
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const createApplicationMutation = useCreateStudentApplication();
  const updateApplicationMutation = useUpdateStudentApplication();
  const deleteApplicationMutation = useDeleteStudentApplication();
  const createRemarkMutation = useCreateStudentRemark();

  const formatDateForDisplay = (value?: string | Date | null) => {
    if (!value) return "Not provided";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Not provided"
      : date.toLocaleDateString("en-GB");
  };

  const getErrorMessage = (caughtError: unknown, fallback: string) => {
    if (caughtError instanceof Error && caughtError.message) {
      return caughtError.message;
    }

    return fallback;
  };

  useEffect(() => {
    if (
      detailTab === "loan" &&
      selectedStudent &&
      !selectedStudent.lead?.loanRequirement
    ) {
      setDetailTab("info");
    }
  }, [detailTab, selectedStudent]);
  const complianceProgress = useMemo(() => {
    if (!selectedStudent) {
      return {
        currentIndex: 0,
        completedIndexes: new Set<number>(),
      };
    }

    const completedIndexes = new Set<number>();

    const applications = selectedStudent.applications ?? [];
    const visa = selectedStudent.visaProfile;
    const loan = selectedStudent.lead?.loanApplication;

    let currentIndex = 0;

    // STEP 0 - Walkin
    completedIndexes.add(0);
    currentIndex = 1;

    // STEP 1 - Documents
    if (
      !selectedStudent.moduleProgress?.some(
        (m) => m.module === "documents" && m.progress === 100,
      )
    ) {
      return { currentIndex, completedIndexes };
    }

    completedIndexes.add(1);
    currentIndex = 2;

    // STEP 2 - Applications
    const hasApplied = applications.some((app) => app.status === "applied");

    if (!hasApplied) {
      return { currentIndex, completedIndexes };
    }

    completedIndexes.add(2);
    currentIndex = 3;

    // STEP 3 - Offer
    const hasOffer = applications.some((app) =>
      ["PRIORITY_UCOL", "PRIORITY_COL", "COL", "UCOL"].includes(
        app.offerStatus ?? "",
      ),
    );

    if (!hasOffer) {
      return { currentIndex, completedIndexes };
    }

    completedIndexes.add(3);
    currentIndex = 4;

    /**
     * Loan Required?
     */
    const loanRequired = !!selectedStudent.lead?.loanRequirement;

    if (loanRequired) {
      // STEP 4 - Loan
      if (!loan) {
        return { currentIndex, completedIndexes };
      }

      completedIndexes.add(4);
      currentIndex = 5;

      // STEP 5 - Disbursed
      if (loan?.disbursementStatus !== "Yes") {
        return { currentIndex, completedIndexes };
      }

      completedIndexes.add(5);
      currentIndex = 6;

      // STEP 6 - Deposit
      if (loan.depositStatus !== "Paid") {
        return { currentIndex, completedIndexes };
      }

      completedIndexes.add(6);
      currentIndex = 7;

      // STEP 7 - IHS
      if (visa?.ihsPaidStatus !== "PAID") {
        return { currentIndex, completedIndexes };
      }

      completedIndexes.add(7);
      currentIndex = 8;

      // STEP 8 - CAS
      if (visa?.casStatus !== "RECEIVED") {
        return { currentIndex, completedIndexes };
      }

      completedIndexes.add(8);
      currentIndex = 9;
      // STEP 9 - Visa
      if (visa?.visaStatus !== "APPROVED") {
        return {
          currentIndex,
          completedIndexes,
        };
      }

      completedIndexes.add(9);

      // Workflow finished
      currentIndex = 10;

      return {
        currentIndex,
        completedIndexes,
      };
    }

    // ------------------------------
    // NON LOAN STUDENT
    // ------------------------------

    // STEP 4 - IHS
    if (visa?.ihsPaidStatus !== "PAID") {
      return { currentIndex, completedIndexes };
    }

    completedIndexes.add(4);
    currentIndex = 5;

    // STEP 5 - CAS
    if (visa?.casStatus !== "RECEIVED") {
      return { currentIndex, completedIndexes };
    }

    completedIndexes.add(5);
    currentIndex = 6;

    // STEP 6 - Visa
    if (visa?.visaStatus !== "APPROVED") {
      return {
        currentIndex,
        completedIndexes,
      };
    }

    completedIndexes.add(6);

    // Workflow finished
    currentIndex = 7;

    return {
      currentIndex,
      completedIndexes,
    };
  }, [selectedStudent]);
  useEffect(() => {
    if (selectedStudent?.studentName) {
      setTitle(selectedStudent.studentName);
    }

    return () => clearTitle();
  }, [selectedStudent?.studentName, setTitle, clearTitle]);

  const handleDeleteStudent = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to permanently delete this student's folders and case records? This is irreversible.",
      )
    ) {
      try {
        await api.delete(`/students/${id}`);
        toast.success("Student records deleted successfully.");
        queryClient.invalidateQueries({ queryKey: STUDENTKEY.all });

        if (selectedStudentId === id) {
          router.push("/student-profiles");
        }
      } catch (caughtError) {
        toast.error(
          getErrorMessage(caughtError, "Failed to delete student records."),
        );
      }
    }
  };

  const togglePassword = (studentId: string) => {
    setVisiblePasswords((previous) => ({
      ...previous,
      [studentId]: !previous[studentId],
    }));
  };

  const handleAddRemark = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newRemarkText.trim() || !selectedStudentId) return;

    try {
      await createRemarkMutation.mutateAsync({
        studentId: selectedStudentId,
        note: newRemarkText.trim(),
      });

      setNewRemarkText("");
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError, "Failed to add remark"));
    }
  };

  const getTabProgress = (tabKey: StudentDetailTab) => {
    const moduleKey = tabProgressMap[tabKey];

    if (!moduleKey) return null;

    return (
      safeModuleProgress.find((item) => item.module === moduleKey)?.progress ??
      0
    );
  };

  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!followupDate) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      await createTimelineMutation.mutateAsync({
        type: timelineType,
        description: description.trim() || undefined,
        followupDate: followupDate || undefined,
      });

      setDescription("");
      setFollowupDate("");
      setTimelineType("note");
    } catch (error) {
      toast.error("Failed to add timeline.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm font-semibold text-slate-500">
        Loading students...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <h2 className="text-base font-black text-rose-700">
            Unable to load students
          </h2>

          <p className="mt-2 text-sm text-rose-600">
            {getErrorMessage(error, "Please refresh the page and try again.")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${isDarkMode ? "dark" : ""} flex min-h-screen bg-background text-foreground transition-colors duration-200`}
    >
      <div className="grow flex flex-col min-w-0 min-h-screen">
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedStudentId && selectedStudent && (
              <motion.div
                key="student-detail-profile"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => router.push("/student-profiles")}
                      className="inline-flex items-center gap-1.5 text-xs font-black text-red-600 hover:underline"
                    >
                      ← Back
                    </button>

                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />

                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white">
                          {selectedStudent?.studentName ?? "Unnamed Student"}
                        </h2>

                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                            selectedStudent?.status === "active"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : selectedStudent?.status === "inactive"
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                          }`}
                        >
                          {selectedStudent?.status}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1">
                        Assigned User:{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {selectedStudent.counselor?.name ?? "Not Assigned"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {canUpdate(MODULES.STUDENT_PROFILES) && (
                    <button
                      onClick={() => setStatusDialogOpen(true)}
                      className="rounded-xl border border-red-600 bg-white px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 dark:bg-slate-900 dark:hover:bg-red-950"
                    >
                      Update Status
                    </button>
                  )}
                </div>
                <StudentComplianceStepper
                  currentIndex={complianceProgress.currentIndex}
                  completedIndexes={complianceProgress.completedIndexes}
                  loanRequired={!!selectedStudent?.lead?.loanRequirement}
                />
                <div className="space-y-6">
                  <div className="overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                      {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isSelected = detailTab === tab.key;
                        const progress = getTabProgress(tab.key);

                        return (
                          <button
                            key={tab.key}
                            onClick={() => setDetailTab(tab.key)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold transition-all ${
                              isSelected
                                ? "bg-red-600 text-white border-red-600"
                                : "bg-white text-slate-600 border-slate-200"
                            }`}
                          >
                            <Icon className="h-4 w-4" />
                            {tab.label}

                            {progress !== null && (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                  isSelected
                                    ? "bg-white/20 text-white"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {progress}%
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div
                    className={`p-6 rounded-3xl border shadow-xl min-h-125 ${
                      isDarkMode
                        ? "bg-slate-900 border-slate-800"
                        : "bg-white border-slate-100"
                    }`}
                  >
                    {activeModule && (
                      <div className="mb-6 flex flex-col gap-3 border-b border-inherit pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                Module Progress
                              </p>

                              <p className="text-xs font-bold capitalize text-slate-700 dark:text-slate-200">
                                {isModuleProgressLoading
                                  ? "Loading..."
                                  : (
                                      activeModuleProgress?.status ??
                                      "Not Started"
                                    ).replaceAll("_", " ")}
                              </p>
                            </div>

                            <span className="text-sm font-black text-red-600">
                              {activeProgressValue}%
                            </span>
                          </div>

                          <Progress
                            value={activeProgressValue}
                            className="h-2"
                          />
                        </div>

                        {canUpdate(MODULES.STUDENT_PROFILES) && (
                          <button
                            type="button"
                            onClick={() => setProgressDialogOpen(true)}
                            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700"
                          >
                            Update Progress
                          </button>
                        )}
                      </div>
                    )}

                    {detailTab === "info" && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b pb-3 border-inherit">
                          <div>
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                              Basic Information
                            </h4>
                          </div>

                          <div className="flex items-center gap-2">
                            {canUpdate(MODULES.STUDENT_PROFILES) && (
                              <button
                                onClick={() => setBasicInfoOpen(true)}
                                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white"
                              >
                                Edit Basic Info
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[
                            {
                              label: "Student Name",
                              val: selectedStudent?.studentName,
                              icon: User,
                            },
                            {
                              label: "Assigned User",
                              val: selectedStudent?.counselor?.name ?? "-",
                              icon: Briefcase,
                            },
                            {
                              label: "Mobile Number",
                              val: selectedStudent?.mobileNumber,
                              icon: Globe2,
                            },
                            {
                              label: "Primary Email",
                              val: selectedStudent?.lead?.emailId,
                              icon: FileText,
                            },
                            {
                              label: "Visa Email",
                              val: selectedStudent?.emailId,
                              icon: FileText,
                            },
                            {
                              label: "Password",
                              val: selectedStudent?.password,
                              icon: FileText,
                              isPassword: true,
                            },
                            {
                              label: "Course",
                              val: selectedStudent?.lead?.bachelorsCourse,
                              icon: FileText,
                            },
                            {
                              label: "Date Of Birth",
                              val: formatDateForDisplay(selectedStudent?.dob),
                              icon: Calendar,
                            },
                            {
                              label: "Gender",
                              val: selectedStudent?.gender ?? "-",
                              icon: User,
                            },
                            {
                              label: "Date of Admission",
                              val: formatDateForDisplay(
                                selectedStudent?.applicationDate,
                              ),
                              icon: Calendar,
                            },
                            {
                              label: "MOI",
                              val: selectedStudent?.moi ?? "-",
                              icon: GraduationCap,
                            },
                            {
                              label: "Branch",
                              val: selectedStudent?.branch?.name ?? "-",
                              icon: MapPin,
                            },
                          ].map((item, index) => {
                            const ItemIcon = item.icon;

                            return (
                              <div
                                key={index}
                                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center gap-3 border border-slate-100 dark:border-slate-850"
                              >
                                <div className="p-2 bg-red-600/10 text-red-600 rounded-xl">
                                  <ItemIcon className="h-4.5 w-4.5" />
                                </div>

                                <div>
                                  <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-0.5">
                                    {item.label}
                                  </span>

                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-extrabold text-slate-850 dark:text-slate-150 font-mono">
                                      {item.isPassword
                                        ? visiblePasswords[
                                            selectedStudent?.id ?? ""
                                          ]
                                          ? item.val || "Not set"
                                          : item.val
                                            ? "••••••••"
                                            : "Not set"
                                        : item.val || "Not provided"}
                                    </span>

                                    {item.isPassword && item.val && (
                                      <button
                                        type="button"
                                        onClick={(event) => {
                                          event.stopPropagation();

                                          if (selectedStudent?.id) {
                                            togglePassword(selectedStudent.id);
                                          }
                                        }}
                                        className="rounded p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
                                        aria-label={
                                          visiblePasswords[
                                            selectedStudent?.id ?? ""
                                          ]
                                            ? "Hide password"
                                            : "Show password"
                                        }
                                      >
                                        {visiblePasswords[
                                          selectedStudent?.id ?? ""
                                        ] ? (
                                          <ShieldOff className="h-3.5 w-3.5" />
                                        ) : (
                                          <Shield className="h-3.5 w-3.5" />
                                        )}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {detailTab === "documents" && (
                      <div className="space-y-4">
                        {selectedStudent && (
                          <DMSSection
                            studentId={selectedStudent.id}
                            studentName={
                              selectedStudent?.studentName ?? "Unnamed Student"
                            }
                            isDarkMode={isDarkMode}
                          />
                        )}
                      </div>
                    )}

                    {detailTab === "applications" && (
                      <StudentApplicationsSection
                        student={selectedStudent}
                        isDarkMode={isDarkMode}
                        onCreate={async (payload) => {
                          await createApplicationMutation.mutateAsync({
                            studentId: selectedStudent.id,
                            payload,
                          });
                        }}
                        onUpdate={async (applicationId, payload) => {
                          await updateApplicationMutation.mutateAsync({
                            applicationId,
                            payload,
                          });
                        }}
                        onDelete={async (applicationId) => {
                          await deleteApplicationMutation.mutateAsync(
                            applicationId,
                          );
                        }}
                      />
                    )}

                    {detailTab === "visa" && (
                      <StudentVisaProfileSection
                        key={`${selectedStudent.id}-visa`}
                        studentId={selectedStudent.id}
                        isDarkMode={isDarkMode}
                      />
                    )}

                    {detailTab === "loan" && (
                      <StudentLoanProfileSection
                        key={`${selectedStudent.id}-loan`}
                        leadId={selectedStudent.leadId}
                        isDarkMode={isDarkMode}
                      />
                    )}

                    {detailTab === "remarks" && (
                      <StudentRemarksTimelineTab
                        studentId={selectedStudent.id}
                        remarks={remarks}
                        timeline={timeline}
                        isDarkMode={isDarkMode}
                        canCreate={canCreate(MODULES.STUDENT_PROFILES)}
                        isRemarkSubmitting={createRemarkMutation.isPending}
                        isTimelineSubmitting={createTimelineMutation.isPending}
                        formatDate={formatDateForDisplay}
                        onAddRemark={async (note) => {
                          try {
                            await createRemarkMutation.mutateAsync({
                              studentId: selectedStudent.id,
                              note,
                            });
                          } catch (caughtError) {
                            toast.error(
                              getErrorMessage(
                                caughtError,
                                "Failed to add remark",
                              ),
                            );
                          }
                        }}
                        onAddTimeline={async (payload) => {
                          try {
                            await createTimelineMutation.mutateAsync(payload);
                          } catch {
                            toast.error("Failed to add timeline.");
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {selectedStudent && activeModule && (
        <StudentModuleProgressDialog
          open={progressDialogOpen}
          onOpenChange={setProgressDialogOpen}
          studentId={selectedStudent.id}
          module={activeModule}
          moduleLabel={activeTabLabel}
          currentProgress={activeModuleProgress}
        />
      )}

      {selectedStudent && (
        <StudentBasicInfoDialog
          open={basicInfoOpen}
          onClose={() => setBasicInfoOpen(false)}
          student={selectedStudent}
        />
      )}

      {selectedStudent && (
        <StudentStatusDialog
          open={statusDialogOpen}
          onClose={() => setStatusDialogOpen(false)}
          student={selectedStudent}
        />
      )}
    </div>
  );
}
