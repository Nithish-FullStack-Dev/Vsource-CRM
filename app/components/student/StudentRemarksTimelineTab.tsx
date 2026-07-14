"use client";

import { Remarks } from "@/types/student";
import StudentTimelineSection, {
  TimelineItem,
  TimelineType,
} from "./StudentTimelineSection";
import StudentRemarksSection from "./StudentRemarksSection";
import { Card } from "../ui/card";
import { MODULES } from "@/lib/module-codes";

interface StudentRemarksTimelineTabProps {
  studentId: string;
  remarks: Remarks[];
  timeline: TimelineItem[];
  isDarkMode: boolean;
  canCreate: boolean;
  isRemarkSubmitting: boolean;
  isTimelineSubmitting: boolean;
  onAddRemark: (note: string) => Promise<void> | void;
  onAddTimeline: (payload: {
    type: TimelineType;
    description?: string;
    followupDate: string;
  }) => Promise<void> | void;
  formatDate: (value?: string | Date | null) => string;
}

export default function StudentRemarksTimelineTab({
  remarks,
  timeline,
  isDarkMode,
  canCreate,
  isRemarkSubmitting,
  isTimelineSubmitting,
  onAddRemark,
  onAddTimeline,
  formatDate,
}: StudentRemarksTimelineTabProps) {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Card className="p-6 rounded-3xl border shadow-xl min-h-125">
        <StudentRemarksSection
          remarks={remarks}
          onSubmit={onAddRemark}
          isSubmitting={isRemarkSubmitting}
          canCreate={canCreate}
          formatDate={formatDate}
        />
      </Card>

      <Card className="p-6 rounded-3xl border shadow-xl min-h-125">
        <StudentTimelineSection
          timeline={timeline}
          onSubmit={onAddTimeline}
          isSubmitting={isTimelineSubmitting}
          canCreate={canCreate}
          formatDate={formatDate}
        />
      </Card>
    </div>
  );
}
