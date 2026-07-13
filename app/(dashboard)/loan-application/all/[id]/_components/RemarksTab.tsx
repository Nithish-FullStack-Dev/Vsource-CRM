"use client";

import { useMemo } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import StudentRemarksSection from "@/app/components/student/StudentRemarksSection";
import StudentTimelineSection, {
  type TimelineItem,
  type TimelineType,
} from "@/app/components/student/StudentTimelineSection";
import { authService } from "@/services/auth.service";

import type { LoanApplication } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

interface RemarksTabProps {
  applicant: LoanApplication;
}

interface CreatedByUser {
  id?: string;
  name?: string | null;
  email?: string | null;
}

interface ActivityItem {
  id: string;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  createdAt?: string | null;
  createdBy?: CreatedByUser | string | null;
}

interface FollowUpItem {
  id: string;
  type?: string | null;
  note?: string | null;
  followUpDate?: string | null;
  nextFollowUp?: string | null;
  createdAt?: string | null;
  createdBy?: CreatedByUser | string | null;
}

interface RemarkItem {
  id: string;
  note: string;
  createdAt: string | Date;
  createdBy?: CreatedByUser | null;
}

interface LoanApplicationDetails {
  activities?: ActivityItem[];
  followUps?: FollowUpItem[];
}

interface CreateTimelinePayload {
  type: TimelineType;
  description?: string;
  followupDate: string;
}

function getCreatedBy(
  value?: CreatedByUser | string | null,
): CreatedByUser | null {
  if (!value) return null;

  if (typeof value === "string") {
    return {
      name: value,
    };
  }

  return {
    id: value.id,
    name: value.name ?? "Unknown",
    email: value.email,
  };
}

function normalizeTimelineType(value?: string | null): TimelineType {
  const allowedTypes: TimelineType[] = [
    "note",
    "followup",
    "call",
    "meeting",
    "status_change",
    "document",
    "application",
    "offer_letter",
    "loan",
    "visa",
    "payment",
    "info",
  ];

  if (value && allowedTypes.includes(value as TimelineType)) {
    return value as TimelineType;
  }

  return "info";
}

function formatDate(value?: string | Date | null): string {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RemarksTab({ applicant }: RemarksTabProps) {
  const applicationId = applicant.id;

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery<LoanApplicationDetails>({
    queryKey: ["loan-application-remarks-timeline", applicationId],

    queryFn: async () => {
      const response = await axios.get(
        `${API_URL}/loan-applications/${applicationId}`,
        {
          withCredentials: true,
        },
      );

      return response.data?.data ?? response.data;
    },

    enabled: Boolean(applicationId),
  });

  const { data: currentUser } = useQuery({
    queryKey: ["auth-me"],
    queryFn: authService.me,
  });

  const currentUserId =
    currentUser?.data?.id ?? currentUser?.user?.id ?? currentUser?.id ?? null;

  const activities = useMemo<ActivityItem[]>(() => {
    return (
      data?.activities ??
      (applicant.activities as ActivityItem[] | undefined) ??
      []
    );
  }, [data?.activities, applicant.activities]);

  const followUps = useMemo<FollowUpItem[]>(() => {
    return (
      data?.followUps ??
      (applicant.followUps as FollowUpItem[] | undefined) ??
      []
    );
  }, [data?.followUps, applicant.followUps]);

  const remarks = useMemo<RemarkItem[]>(() => {
    return activities
      .filter((activity) => activity.title?.trim().toLowerCase() === "remark")
      .map((activity) => ({
        id: activity.id,
        note: activity.description ?? "",
        createdAt: activity.createdAt ?? "",
        createdBy: getCreatedBy(activity.createdBy),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  }, [activities]);

  const timeline = useMemo<TimelineItem[]>(() => {
    const activityTimeline: TimelineItem[] = activities
      .filter((activity) => activity.title?.trim().toLowerCase() !== "remark")
      .map((activity) => ({
        id: `activity-${activity.id}`,
        type: normalizeTimelineType(activity.type),
        description:
          activity.description ?? activity.title ?? "Activity updated",
        createdAt: activity.createdAt,
        createdBy: getCreatedBy(activity.createdBy),
      }));

    const followUpTimeline: TimelineItem[] = followUps.map((followUp) => ({
      id: `followup-${followUp.id}`,
      type: "followup",
      description: followUp.note ?? "Follow up scheduled",
      createdAt: followUp.createdAt,
      followupDate: followUp.followUpDate ?? followUp.nextFollowUp ?? null,
      createdBy: getCreatedBy(followUp.createdBy),
    }));

    return [...activityTimeline, ...followUpTimeline].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );
  }, [activities, followUps]);

  const refreshQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["loan-application-remarks-timeline", applicationId],
      }),

      queryClient.invalidateQueries({
        queryKey: ["loan-application", applicationId],
      }),

      queryClient.invalidateQueries({
        queryKey: ["loan-applications"],
      }),
    ]);
  };

  const addRemarkMutation = useMutation({
    mutationFn: async (note: string) => {
      if (!currentUserId) {
        throw new Error("Logged-in user not found");
      }

      await axios.post(
        `${API_URL}/loan-applications/${applicationId}/activities`,
        {
          title: "Remark",
          description: note,
          type: "note",
          createdById: currentUserId,
        },
        {
          withCredentials: true,
        },
      );
    },

    onSuccess: refreshQueries,
  });

  const addTimelineMutation = useMutation({
    mutationFn: async (payload: CreateTimelinePayload) => {
      if (payload.type === "followup") {
        await axios.post(
          `${API_URL}/loan-applications/${applicationId}/follow-ups`,
          {
            type: payload.type,
            note: payload.description?.trim() || "Follow up scheduled",
            followUpDate: new Date(payload.followupDate).toISOString(),
          },
          {
            withCredentials: true,
          },
        );

        return;
      }

      if (!currentUserId) {
        throw new Error("Logged-in user not found");
      }

      const title = payload.type
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      await axios.post(
        `${API_URL}/loan-applications/${applicationId}/activities`,
        {
          type: payload.type,
          title,
          description: payload.description?.trim() || title,
          createdById: currentUserId,
        },
        {
          withCredentials: true,
        },
      );
    },

    onSuccess: refreshQueries,
  });

  const handleRemarkSubmit = async (note: string) => {
    await addRemarkMutation.mutateAsync(note);
  };

  const handleTimelineSubmit = async (payload: CreateTimelinePayload) => {
    await addTimelineMutation.mutateAsync(payload);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />

        <div className="h-96 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/20">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400">
          Unable to load remarks and timeline.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <StudentRemarksSection
        remarks={remarks}
        onSubmit={handleRemarkSubmit}
        isSubmitting={addRemarkMutation.isPending}
        canCreate
        formatDate={formatDate}
      />

      <StudentTimelineSection
        timeline={timeline}
        onSubmit={handleTimelineSubmit}
        isSubmitting={addTimelineMutation.isPending}
        canCreate
        formatDate={formatDate}
      />
    </div>
  );
}
