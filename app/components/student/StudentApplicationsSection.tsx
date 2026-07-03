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
  useCourseDropdown,
  useUniversityDropdown,
} from "@/hooks/student/applications/useUniversityDropdown";
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

interface CourseDropdownItem {
  id: string;
  name: string;
  intakeId?: string;
}
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
  const [showForm, setShowForm] = useState(false);
  const { canCreate, canDelete, canUpdate } = useAuth();
  const canApply = student.applications.length < 5;

  const handleUniversityChange = (universityId: string) => {
    setSelectedUniversityId(universityId);
    setSelectedCourseId("");
  };
  const [portal, setPortal] = useState("");
  const [applicationDate, setApplicationDate] = useState("");
  const [status, setStatus] = useState("draft");
  const [offerStatus, setOfferStatus] = useState("not_received");
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

      setSelectedUniversityId("");
      setSelectedCourseId("");
      setPortal("");
      setApplicationDate("");
      setStatus("draft");
      setOfferStatus("not_received");
      setEditingId(null);
      setShowForm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
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

    setStatus(app.status || "draft");
    setOfferStatus(app.offerStatus || "not_received");

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

                <Select
                  value={selectedCourseId}
                  onValueChange={setSelectedCourseId}
                  disabled={!selectedUniversityId}
                >
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue placeholder="Select Course" />
                  </SelectTrigger>

                  <SelectContent>
                    {courses.map((course: CourseDropdownItem) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <label className="text-xs font-semibold mb-2 block">
                  Application Status
                </label>

                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="conditional">
                      Conditional Offer
                    </SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold mb-2 block">
                  Offer Status
                </label>

                <Select value={offerStatus} onValueChange={setOfferStatus}>
                  <SelectTrigger className="h-11 rounded-2xl">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="not_received">Not Received</SelectItem>

                    <SelectItem value="conditional_offer">
                      Conditional Offer
                    </SelectItem>

                    <SelectItem value="unconditional_offer">
                      Unconditional Offer
                    </SelectItem>

                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button
                onClick={handleSaveApplication}
                disabled={isSaving}
                className="rounded-2xl px-8 bg-red-600 hover:bg-red-700"
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
                    <div className="col-span-2">
                      <p className="text-slate-400 text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Applied Date
                      </p>

                      <p className="font-semibold mt-1">
                        {new Date(app.applicationDate).toLocaleDateString()}
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
