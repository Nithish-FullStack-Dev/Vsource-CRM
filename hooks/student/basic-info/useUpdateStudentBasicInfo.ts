// hooks/student/useUpdateStudentBasicInfo.ts

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { STUDENTKEY } from "@/services/student/query-key";
import { api } from "@/lib/api";

export const useUpdateStudentBasicInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const { data } = await api.patch(`/students/${id}/basic-info`, payload);

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: STUDENTKEY.all,
      });

      toast.success("Student profile updated");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? "Failed to update student profile",
      );
    },
  });
};

export const useUpdateStudentStatus = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      status,
    }: {
      status: "active" | "inactive" | "drop";
    }) => {
      const { data } = await api.patch(`/students/${id}/status`, {
        status,
      });

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: STUDENTKEY.all,
      });
      queryClient.invalidateQueries({
        queryKey: [...STUDENTKEY.all, id],
      });

      toast.success("Student status updated");
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ?? "Failed to update student status",
      );
    },
  });
};
