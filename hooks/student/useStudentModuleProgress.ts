import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";

export type StudentModuleKey =
  | "basic_information"
  | "documents"
  | "university_applications"
  | "visa_process"
  | "loan_process";

export type StudentModuleStatus =
  | "not_started"
  | "started"
  | "in_progress"
  | "need_corrections"
  | "completed"
  | "rejected";

export type StudentModuleProgress = {
  id: string | null;
  studentId: string;
  module: StudentModuleKey;
  status: StudentModuleStatus;
  progress: number;
  createdAt: string | null;
  updatedAt: string | null;
};

const moduleProgressKey = (studentId: string) => [
  "student-module-progress",
  studentId,
];

export function useStudentModuleProgress(studentId: string) {
  return useQuery({
    queryKey: moduleProgressKey(studentId),
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/module-progress`);
      return response.data.data as StudentModuleProgress[];
    },
    enabled: Boolean(studentId),
  });
}

export function useUpdateStudentModuleProgress(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      module: StudentModuleKey;
      status: StudentModuleStatus;
      progress: number;
    }) => {
      const response = await api.put(
        `/students/${studentId}/module-progress`,
        payload,
      );
      return response.data.data as StudentModuleProgress;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: moduleProgressKey(studentId),
      });
      toast.success("Module progress updated successfully");
    },
    onError: () => {
      toast.error("Failed to update module progress");
    },
  });
}
