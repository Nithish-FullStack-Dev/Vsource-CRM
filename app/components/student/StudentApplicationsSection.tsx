// app/components/student/StudentApplicationsSection.tsx

"use client";

import { StudentRecord } from "@/types/student";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Calendar, Globe, GraduationCap } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/store";
import { MODULES } from "@/lib/module-codes";
import {
  CourseDropdownItem,
  useCourseDropdown,
  useCreateUniversityCourse,
  useUniversityDropdown,
} from "@/hooks/student/applications/useUniversityDropdown";
import {
  CreatableCourseCombobox,
  CourseOption,
} from "@/components/student/CreatableCourseCombobox";
import { toast } from "sonner";

interface Props {
  student: StudentRecord;
  isDarkMode: boolean;

  onCreate: (payload: any) => Promise<void>;
  onUpdate: (id: string, payload: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
interface UniversityDropdownItem {
  id: string;
  name: string;
  countryId: string;
  tier?: string;
}

type Status = "on_hold" | "applied" | "drop";
type OfferStatus =
  | "PENDING"
  | "PRIORITY_UCOL"
  | "PRIORITY_COL"
  | "COL"
  | "UCOL";

export default function StudentApplicationsSection({
  student,
  isDarkMode,
  onCreate,
  onUpdate,
  onDelete,
}: Props) {
  const { data: universities = [] } = useUniversityDropdown(student.id);
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const { data: courses = [] } = useCourseDropdown(selectedUniversityId);
  const createCourseMutation = useCreateUniversityCourse(selectedUniversityId);
  const [showForm, setShowForm] = useState(false);
  const { canCreate, canDelete, canUpdate } = useAuth();
  const canApply = student.applications.length < 5;

  const handleUniversityChange = (universityId: string) => {
    setSelectedUniversityId(universityId);
    setSelectedCourseId("");
  };
  const [portal, setPortal] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [status, setStatus] = useState<Status>("on_hold");

  const [offerStatus, setOfferStatus] = useState<OfferStatus>("PENDING");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const handleSaveApplication = async () => {
    if (!selectedUniversityId) {
      alert("Please select university");
      return;
    }

    if (!selectedCourseId) {
      alert("Please select course");
      return;
    }

    const selectedUniversity = universities.find(
      (u: UniversityDropdownItem) => u.id === selectedUniversityId,
    );

    const selectedCourse = courses.find(
      (c: CourseDropdownItem) => c.id === selectedCourseId,
    );

    const payload = {
      countryId: selectedUniversity?.countryId,
      universityId: selectedUniversityId,
      courseId: selectedCourseId,
      intakeId: selectedCourse?.intakeId ?? null,
      portal,
      applicationDate: applicationDate || null,
      followUpDate: followUpDate || null,
      status,
      offerStatus,
    };

    try {
      setIsSaving(true);

      if (editingId) {
        await onUpdate(editingId, payload);
      } else {
        await onCreate(payload);
      }
      resetForm();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };
  const handleCreateCourse = async (
    courseName: string,
  ): Promise<CourseOption> => {
    try {
      const createdCourse = await createCourseMutation.mutateAsync(courseName);

      toast.success(`Course "${createdCourse.name}" added successfully`);

      return createdCourse;
    } catch (error) {
      console.error("Failed to create course:", error);

      toast.error("Failed to add course");

      throw error;
    }
  };
  const handleEdit = (app: any) => {
    setEditingId(app.id);

    setSelectedUniversityId(app.universityId || "");
    setSelectedCourseId(app.courseId || "");
    setPortal(app.portal || "");
    setApplicationDate(
      app.applicationDate
        ? new Date(app.applicationDate).toISOString().slice(0, 16)
        : "",
    );

    setFollowUpDate(
      app.followUpDate
        ? new Date(app.followUpDate).toISOString().slice(0, 10)
        : "",
    );

    setStatus(app.status || "on_hold");
    setOfferStatus(app.offerStatus || "PENDING");

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id);
      await onDelete(id);
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };
  const resetForm = () => {
    setSelectedUniversityId("");
    setSelectedCourseId("");
    setPortal("");
    setApplicationDate("");
    setFollowUpDate("");
    setStatus("on_hold");
    setOfferStatus("PENDING");
    setEditingId(null);
    setShowForm(false);
  };
  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-black text-red-600">
            University Applications
          </h3>

          <p className="text-sm text-slate-500">
            {student.applications.length}/5 Applications Used
          </p>
        </div>
        {canApply && canCreate(MODULES.STUDENT_PROFILES) ? (
          <Button
            onClick={() => setShowForm(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            Apply University
          </Button>
        ) : (
          <div className="rounded-xl bg-green-100 text-green-700 px-4 py-2 text-sm font-bold">
            Maximum 5 University Applications Reached
          </div>
        )}
      </div>

      {/* Form */}

      {showForm && (
        <Card className="rounded-3xl border shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5">
              <h4 className="font-black text-lg">Add New Application</h4>

              <p className="text-sm text-slate-500">
                Create university application entry
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-semibold mb-2 block">
                  Country
                </label>

                <input
                  disabled
                  value={student.lead?.preferredCountry ?? ""}
                  className="w-full h-11 px-4 rounded-2xl border bg-muted"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block">
                  Intake
                </label>

                <input
                  disabled
                  value={student.lead?.preferredIntake ?? ""}
                  className="w-full h-11 px-4 rounded-2xl border bg-muted"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block">Tier</label>

                <input
                  disabled
                  value={student.lead?.preferredTiers?.join(", ") ?? ""}
                  className="w-full h-11 px-4 rounded-2xl border bg-muted"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block">
                  University
                </label>

                <Select
                  value={selectedUniversityId}
                  onValueChange={handleUniversityChange}
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue placeholder="Select University" />
                  </SelectTrigger>

                  <SelectContent>
                    {universities.map((university: UniversityDropdownItem) => (
                      <SelectItem key={university.id} value={university.id}>
                        {university.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block">
                  Course
                </label>

                <CreatableCourseCombobox
                  universityId={selectedUniversityId}
                  courses={courses}
                  value={selectedCourseId}
                  onValueChange={setSelectedCourseId}
                  onCreateCourse={handleCreateCourse}
                  disabled={
                    !selectedUniversityId || createCourseMutation.isPending
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block">
                  Portal
                </label>

                <input
                  value={portal}
                  onChange={(e) => setPortal(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl border"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block">
                  University Applying Date
                </label>

                <input
                  type="datetime-local"
                  value={applicationDate}
                  onChange={(e) => setApplicationDate(e.target.value)}
                  className="w-full h-11 px-4 rounded-2xl border"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold">
                  University Follow-Up Date
                </label>

                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="h-11 w-full rounded-2xl border px-4"
                />
              </div>
              <div>
                <label className="text-xs font-semibold mb-2 block">
                  Application Status
                </label>

                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as Status)}
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectContent>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="drop">Drop</SelectItem>
                    </SelectContent>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block">
                  Offer Status
                </label>

                <Select
                  value={offerStatus}
                  onValueChange={(val) => setOfferStatus(val as OfferStatus)}
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>

                    <SelectItem value="PRIORITY_UCOL">Priority UCOL</SelectItem>

                    <SelectItem value="PRIORITY_COL">Priority COL</SelectItem>

                    <SelectItem value="COL">COL</SelectItem>

                    <SelectItem value="UCOL">UCOL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={isSaving}
                className="rounded-2xl px-8"
              >
                Cancel
              </Button>

              <Button
                type="button"
                onClick={handleSaveApplication}
                disabled={isSaving}
                className="rounded-2xl bg-red-600 px-8 hover:bg-red-700"
              >
                {isSaving
                  ? "Saving..."
                  : editingId
                    ? "Update Application"
                    : "Save Application"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Applications List */}

      {student.applications?.length === 0 ? (
        <Card className="rounded-3xl">
          <CardContent className="py-16 text-center">
            <GraduationCap className="h-14 w-14 mx-auto mb-4 text-slate-300" />

            <h4 className="font-bold text-lg">No Applications Found</h4>

            <p className="text-slate-500 text-sm">
              This student has not applied to any university yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {student.applications.map((app) => (
            <Card
              key={app.id}
              className="group rounded-[30px] border border-slate-200 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="text-xl text-slate-900">
                      {app.university?.name ?? "-"}
                    </h4>

                    <p className="text-slate-500 mt-1">
                      {app.course?.name ?? "-"}
                    </p>
                  </div>

                  <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-red-100 text-red-700 capitalize">
                    {app.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-6">
                  <div>
                    <p className="text-slate-400 text-sm flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      Portal
                    </p>

                    <p className="font-bold text-base mt-1">
                      {app.portal || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-slate-400 text-sm">Offer Status</p>

                    <p className="font-bold text-base mt-1 capitalize">
                      {app.offerStatus}
                    </p>
                  </div>
                  {app.applicationDate && (
                    <div>
                      <p className="text-slate-400 text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Applied Date
                      </p>

                      <p className="font-semibold mt-1">
                        {new Date(app.applicationDate).toLocaleDateString(
                          "en-IN",
                        )}
                      </p>
                    </div>
                  )}

                  {app.followUpDate && (
                    <div>
                      <p className="text-slate-400 text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Next Follow-Up
                      </p>

                      <p className="font-semibold mt-1">
                        {new Date(app.followUpDate).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 mt-6 pt-5 border-t">
                  {canUpdate(MODULES.STUDENT_PROFILES) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(app)}
                      className="rounded-2xl h-10 px-4 border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      {canDelete(MODULES.STUDENT_PROFILES) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="rounded-2xl h-10 px-4"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </AlertDialogTrigger>

                    <AlertDialogContent className="rounded-3xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl">
                          Delete Application?
                        </AlertDialogTitle>

                        <AlertDialogDescription>
                          This action cannot be undone. The university
                          application will be permanently removed.
                        </AlertDialogDescription>
                      </AlertDialogHeader>

                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">
                          Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                          onClick={() => handleDelete(app.id)}
                          className="bg-red-600 hover:bg-red-700 rounded-xl"
                        >
                          {deletingId === app.id
                            ? "Deleting..."
                            : "Delete Application"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
