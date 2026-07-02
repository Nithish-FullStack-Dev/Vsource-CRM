// app\(dashboard)\student-profiles\page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FileText,
  CreditCard,
  FileCheck2,
  Plus,
  User,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Globe2,
  FileSignature,
  FolderOpen,
  LayoutGrid,
  TableProperties,
} from "lucide-react";
import { DMSSection } from "./DMSSection";
import { StudentTable } from "./StudentTable";
import { motion, AnimatePresence } from "framer-motion";
import { useStudents } from "@/hooks/student/useStudents";
import { Remarks, StudentRecord } from "@/types/student";
import { useCreateStudentApplication } from "@/hooks/student/useCreateStudentApplication";
import { useUpdateStudentApplication } from "@/hooks/student/useUpdateStudentApplication";
import { useDeleteStudentApplication } from "@/hooks/student/useDeleteStudentApplication";
import { useCreateStudentRemark } from "@/hooks/student/useCreateStudentRemark";
import { api } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { STUDENTKEY } from "@/services/student/query-key";
import { toast } from "sonner";
import {
  useCourseDropdown,
  useUniversityDropdown,
} from "@/hooks/student/applications/useUniversityDropdown";
import { StudentBasicInfoDialog } from "@/components/student/StudentBasicInfoDialog";
import { StudentVisaLoanProfileSection } from "@/components/student/StudentVisaLoanProfileForm";
import { StudentModuleProgressDialog } from "@/components/student/StudentModuleProgressDialog";
import {
  StudentModuleKey,
  useStudentModuleProgress,
} from "@/hooks/student/useStudentModuleProgress";
import { Progress } from "@/components/ui/progress";
import StudentApplicationsSection from "@/components/student/StudentApplicationsSection";
import { useParams, useRouter } from "next/navigation";

const tabs = [
  {
    key: "info",
    label: "Basic Information",
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
    label: "University Applications",
    icon: FileText,
    color: "text-emerald-500",
  },
  {
    key: "visaLoan",
    label: "Visa Process",
    icon: CreditCard,
    color: "text-amber-500",
  },
  {
    key: "remarks",
    label: "Remarks",
    icon: FileSignature,
    color: "text-rose-500",
  },
];

export default function Home() {
  const queryClient = useQueryClient();

  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const { data, isLoading, isError, error } = useStudents();
  const [basicInfoOpen, setBasicInfoOpen] = useState(false);
  const [progressDialogOpen, setProgressDialogOpen] = useState(false);
  const [currentView, setCurrentView] = useState<"students">("students");
  const selectedStudentId = studentId;
  const [appOfferStatus, setAppOfferStatus] = useState("not_received");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [detailTab, setDetailTab] = useState<
    "info" | "documents" | "applications" | "visaLoan" | "remarks"
  >("info");

  const [appLayout, setAppLayout] = useState<"cards" | "table">("cards");
  const [showAddAppForm, setShowAddAppForm] = useState<boolean>(false);
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [appPortal, setAppPortal] = useState<string>("GVOC");
  const [appDate, setAppDate] = useState<string>("");
  const [appStatus, setAppStatus] = useState<string>("Pending");

  const [newRemarkText, setNewRemarkText] = useState<string>("");
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const { data: universities, isLoading: isUniversitiesLoad } =
    useUniversityDropdown(selectedStudentId ? selectedStudentId : "");
  const { data: courses = [] } = useCourseDropdown(selectedStudentId || "");

  const universityOptions = Array.isArray(universities) ? universities : [];
  const courseOptions = Array.isArray(courses) ? courses : [];

  const { data: moduleProgress = [], isLoading: isModuleProgressLoading } =
    useStudentModuleProgress(selectedStudentId || "");

  const tabModuleMap: Partial<Record<typeof detailTab, StudentModuleKey>> = {
    info: "basic_information",
    documents: "documents",
    applications: "university_applications",
    visaLoan: "visa_process",
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

  const activeTabLabel =
    tabs.find((tab) => tab.key === detailTab)?.label ?? "Module";

  const students = useMemo<StudentRecord[]>(() => {
    return Array.isArray(data?.data) ? data.data : [];
  }, [data]);

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

  const formatDateForInput = (value?: string | Date | null) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getErrorMessage = (caughtError: unknown, fallback: string) => {
    if (caughtError instanceof Error && caughtError.message) {
      return caughtError.message;
    }
    return fallback;
  };

  const selectedStudent = useMemo<StudentRecord | null>(() => {
    return (
      students.find((s: StudentRecord) => s.id === selectedStudentId) ?? null
    );
  }, [students, selectedStudentId]);
  const handleSelectStudent = (id: string) => {
    router.push(`/student-profiles/${id}`);
  };
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

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault();

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

  const tabProgressMap: Record<string, StudentModuleKey> = {
    info: "basic_information",
    documents: "documents",
    applications: "university_applications",
    visaLoan: "visa_process",
  };

  const getTabProgress = (tabKey: string) => {
    const moduleKey = tabProgressMap[tabKey];

    if (!moduleKey) return null;

    return (
      moduleProgress.find((item) => item.module === moduleKey)?.progress ?? 0
    );
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
            {selectedStudentId && selectedStudent ? (
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
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {selectedStudent?.studentName ?? "Unnamed Student"}
                      </h2>

                      <p className="text-xs text-slate-500">
                        Counselor:{" "}
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {selectedStudent.counselor?.name ?? "Not Assigned"}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Horizontal Tabs */}

                  <div className="overflow-x-auto">
                    <div className="flex gap-2 min-w-max">
                      {tabs.map((tab: any) => {
                        const Icon = tab.icon;
                        const isSelected = detailTab === tab.key;

                        const progress = getTabProgress(tab.key);
                        return (
                          <button
                            key={tab.key}
                            onClick={() => setDetailTab(tab.key as any)}
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
                    className={`p-6 rounded-3xl border shadow-xl min-h-[500px] ${
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
                                      activeModuleProgress?.status ?? "pending"
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

                        <button
                          type="button"
                          onClick={() => setProgressDialogOpen(true)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-xs font-black text-white hover:bg-red-700"
                        >
                          Update Progress
                        </button>
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
                          <div className="flex justify-end">
                            <button
                              onClick={() => setBasicInfoOpen(true)}
                              className="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold"
                            >
                              Edit Basic Info
                            </button>
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
                              label: "Assigned Counsellor",
                              val: selectedStudent?.counselor?.name ?? "-",
                              icon: Briefcase,
                            },
                            {
                              label: "Mobile Number",
                              val: selectedStudent?.mobileNumber,
                              icon: Globe2,
                            },
                            {
                              label: "VSTU Email",
                              val: selectedStudent?.emailId,
                              icon: FileText,
                            },
                            {
                              label: "Password",
                              val: selectedStudent?.password,
                              icon: FileText,
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
                              label: "Application Date",
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
                              label: "Student Status",
                              val: selectedStudent?.status ?? "-",
                              icon: FileCheck2,
                            },
                            {
                              label: "Branch",
                              val: selectedStudent?.branch?.name ?? "-",
                              icon: MapPin,
                            },
                          ].map((v, i) => {
                            const ItemIcon = v.icon;

                            return (
                              <div
                                key={i}
                                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 flex items-center gap-3 border border-slate-100 dark:border-slate-850"
                              >
                                <div className="p-2 bg-red-600/10 text-red-600 rounded-xl">
                                  <ItemIcon className="h-4.5 w-4.5" />
                                </div>

                                <div>
                                  <span className="text-[9px] uppercase font-black tracking-wider text-slate-400 block mb-0.5">
                                    {v.label}
                                  </span>

                                  <span className="text-xs font-extrabold text-slate-850 dark:text-slate-150">
                                    {v.val || "Not provided"}
                                  </span>
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

                    {detailTab === "visaLoan" && (
                      <StudentVisaLoanProfileSection
                        key={selectedStudent.id}
                        studentId={selectedStudent.id}
                        isDarkMode={isDarkMode}
                      />
                    )}

                    {detailTab === "remarks" && (
                      <div className="space-y-6">
                        <form
                          onSubmit={handleAddRemark}
                          className="flex gap-2.5"
                        >
                          <input
                            type="text"
                            value={newRemarkText}
                            onChange={(e) => setNewRemarkText(e.target.value)}
                            placeholder="Type a new compliance note, advisory update..."
                            className={`flex-1 px-4 py-2.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-red-600 ${isDarkMode ? "bg-slate-950 border-slate-800 text-slate-200" : "bg-slate-50 border-slate-202"}`}
                            required
                          />
                          <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wide cursor-pointer"
                            disabled={createRemarkMutation.isPending}
                          >
                            Append Remark
                          </button>
                        </form>

                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-3">
                          {(Array.isArray(selectedStudent?.remarks)
                            ? selectedStudent.remarks
                            : []
                          )
                            .slice()
                            .reverse()
                            .map((rem: Remarks, i: number) => (
                              <div
                                key={i}
                                className="relative pl-6 border-l-2 border-red-600/30 pb-3 last:pb-0"
                              >
                                <span className="absolute left-[-5px] top-1.5 h-2 w-2 rounded-full bg-red-600" />
                                <div className="text-[10px] flex items-center justify-between text-slate-400 mb-1 font-bold">
                                  <span className="font-mono bg-slate-50 dark:bg-slate-950 px-2 py-0.5 rounded">
                                    {formatDateForDisplay(rem?.createdAt)}
                                  </span>
                                  <span>Logged by Agent</span>
                                </div>
                                <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                                  {rem?.note ?? "No remark provided"}
                                </p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <>
                {currentView === "students" && (
                  <motion.div
                    key="students-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6 animate-fadeIn"
                  >
                    <StudentTable
                      isDarkMode={isDarkMode}
                      onSelectStudent={handleSelectStudent}
                      onDeleteStudent={handleDeleteStudent}
                    />
                  </motion.div>
                )}
              </>
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
    </div>
  );
}
