"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useUniversityDropdown } from "@/hooks/student/applications/useUniversityDropdown";
import { useCourseDropdown } from "@/hooks/student/applications/useUniversityDropdown";

interface Props {
  studentId: string;
  application?: any;
  isDarkMode?: boolean;

  onSave: (payload: any) => Promise<void>;
  onCancel: () => void;
}

export function StudentUniversityApplicationForm({
  studentId,
  application,
  isDarkMode,
  onSave,
  onCancel,
}: Props) {
  const [selectedUniversityId, setSelectedUniversityId] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [portal, setPortal] = useState("");
  const [applicationDate, setApplicationDate] = useState("");

  const [status, setStatus] = useState("draft");
  const [offerStatus, setOfferStatus] = useState("not_received");

  const [saving, setSaving] = useState(false);

  const { data: universities, isLoading: universityLoading } =
    useUniversityDropdown(studentId);

  const { data: courses, isLoading: courseLoading } =
    useCourseDropdown(selectedUniversityId);

  useEffect(() => {
    if (!application) return;

    setSelectedUniversityId(application.universityId ?? "");
    setSelectedCourseId(application.courseId ?? "");
    setPortal(application.portal ?? "");

    setStatus(application.status ?? "draft");
    setOfferStatus(application.offerStatus ?? "not_received");

    if (application.applicationDate) {
      setApplicationDate(
        new Date(application.applicationDate).toISOString().split("T")[0],
      );
    }
  }, [application]);

  const selectedUniversity = useMemo(() => {
    return universities?.find((item: any) => item.id === selectedUniversityId);
  }, [universities, selectedUniversityId]);

  const selectedCourse = useMemo(() => {
    return courses?.find((item: any) => item.id === selectedCourseId);
  }, [courses, selectedCourseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUniversityId) {
      toast.error("Select university");
      return;
    }

    if (!selectedCourseId) {
      toast.error("Select course");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        universityId: selectedUniversityId,
        courseId: selectedCourseId,

        countryId: selectedUniversity?.country?.id,

        intakeId: selectedCourse?.intakeId ?? null,

        portal,

        applicationDate: applicationDate
          ? new Date(applicationDate).toISOString()
          : null,

        status,
        offerStatus,

        countryName: selectedUniversity?.country?.name,
        universityName: selectedUniversity?.name,
        courseName: selectedCourse?.name,
        intakeName: selectedCourse?.intakeName ?? null,
      });

      toast.success(application ? "Application updated" : "Application added");
    } catch (error) {
      toast.error("Failed to save application");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border bg-white dark:bg-slate-950 p-6 space-y-6"
    >
      <div>
        <h3 className="text-lg font-bold">
          {application
            ? "Update University Application"
            : "Add University Application"}
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* University */}
        <div>
          <label className="text-xs font-semibold mb-2 block">University</label>

          <select
            value={selectedUniversityId}
            onChange={(e) => {
              setSelectedUniversityId(e.target.value);
              setSelectedCourseId("");
            }}
            className="w-full h-11 rounded-xl border px-3"
            required
          >
            <option value="">
              {universityLoading ? "Loading..." : "Select University"}
            </option>

            {universities?.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Country */}
        <div>
          <label className="text-xs font-semibold mb-2 block">Country</label>

          <input
            value={selectedUniversity?.country?.name ?? ""}
            disabled
            className="w-full h-11 rounded-xl border px-3 bg-slate-50"
          />
        </div>

        {/* Tier */}
        <div>
          <label className="text-xs font-semibold mb-2 block">Tier</label>

          <input
            value={selectedUniversity?.tier ?? ""}
            disabled
            className="w-full h-11 rounded-xl border px-3 bg-slate-50"
          />
        </div>

        {/* Course */}
        <div>
          <label className="text-xs font-semibold mb-2 block">Course</label>

          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
            required
          >
            <option value="">
              {courseLoading ? "Loading..." : "Select Course"}
            </option>

            {courses?.map((item: any) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </div>

        {/* Intake */}
        <div>
          <label className="text-xs font-semibold mb-2 block">Intake</label>

          <input
            value={selectedCourse?.intakeName ?? ""}
            disabled
            className="w-full h-11 rounded-xl border px-3 bg-slate-50"
          />
        </div>

        {/* Portal */}
        <div>
          <label className="text-xs font-semibold mb-2 block">Portal</label>

          <input
            value={portal}
            onChange={(e) => setPortal(e.target.value)}
            placeholder="GVOC / Direct / Centurus"
            className="w-full h-11 rounded-xl border px-3"
            required
          />
        </div>

        {/* Date */}
        <div>
          <label className="text-xs font-semibold mb-2 block">
            Application Date
          </label>

          <input
            type="datetime-local"
            value={applicationDate}
            onChange={(e) => setApplicationDate(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
          />
        </div>

        {/* Application Status */}
        <div>
          <label className="text-xs font-semibold mb-2 block">
            Application Status
          </label>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
          >
            <option value="draft">Draft</option>
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="conditional_offer">Conditional Offer</option>
            <option value="unconditional_offer">Unconditional Offer</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>

        {/* Offer Status */}
        <div>
          <label className="text-xs font-semibold mb-2 block">
            Offer Status
          </label>

          <select
            value={offerStatus}
            onChange={(e) => setOfferStatus(e.target.value)}
            className="w-full h-11 rounded-xl border px-3"
          >
            <option value="not_received">Not Received</option>
            <option value="conditional_offer">Conditional Offer</option>
            <option value="unconditional_offer">Unconditional Offer</option>
            <option value="rejected">Rejected</option>
            <option value="deferred">Deferred</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="h-11 px-5 rounded-xl border font-medium"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="h-11 px-5 rounded-xl bg-red-600 text-white font-medium"
        >
          {saving ? "Saving..." : "Save Application"}
        </button>
      </div>
    </form>
  );
}
