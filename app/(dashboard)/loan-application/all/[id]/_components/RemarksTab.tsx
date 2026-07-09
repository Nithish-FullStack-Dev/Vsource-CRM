"use client";

import { Send } from "lucide-react";
import { useMemo, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import StudentRemarksSection from "@/app/components/student/StudentRemarksSection";
import type { LoanApplication } from "./types";

type Remark = {
  id: string;
  note: string;
  createdAt: string;
  createdBy?: { name?: string } | string | null;
};

export function RemarksTab({ applicant }: { applicant: LoanApplication }) {
  const applicationId = applicant.id;
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["loan-application-remarks", applicationId],
    queryFn: async () => {
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL ?? "/api"}/loan-applications/${applicationId}`,
        { withCredentials: true },
      );
      return data?.data;
    },
  });

  const activities = data?.activities ?? applicant.activities ?? [];
  const followUps = data?.followUps ?? applicant.followUps ?? [];

  const remarks = useMemo(() => {
    const a = activities.map((it: any) => ({
      id: it.id,
      note: it.description || it.title || "",
      createdAt: it.createdAt,
      createdBy: it.createdBy ? { name: it.createdBy } : null,
    }));

    const f = followUps.map((it: any) => ({
      id: it.id,
      note: it.note || "",
      createdAt: it.createdAt,
      createdBy: it.createdBy ? { name: it.createdBy } : null,
    }));

    return [...a, ...f].sort(
      (x, y) =>
        new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime(),
    );
  }, [activities, followUps]);

  const addMutation = useMutation({
    mutationFn: async (note: { text: string }) => {
      // create an activity record with type remark
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL ?? "/api"}/loan-applications/${applicationId}/activities`,
        {
          title: "Remark",
          description: note.text,
        },
        { withCredentials: true },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["loan-application-remarks", applicationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["loan-application", applicationId],
      });
    },
  });

  const onSubmit = async (text: string) => {
    await addMutation.mutateAsync({ text });
  };

  return (
    <div className="space-y-6">
      <StudentRemarksSection
        remarks={remarks}
        onSubmit={onSubmit}
        isSubmitting={addMutation.isPending}
        canCreate={true}
        isDarkMode={false}
        formatDate={(v) => (v ? new Date(v).toLocaleString() : "-")}
      />
    </div>
  );
}
