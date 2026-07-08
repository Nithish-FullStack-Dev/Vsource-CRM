import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  STUDENT_VISA_PROFILE_QUERY_KEY,
  StudentVisaProfile,
} from "@/hooks/student/visa/useStudentVisaProfile";
import { toast } from "sonner";

export type StudentVisaProfilePayload = {
  depositDeadlineDate: string | null;
  depositStatus: "PENDING" | "PAID" | null;

  ihsPaidStatus: "PENDING" | "PAID" | "PAID_PARTIALLY" | null;

  visaPaidStatus: string | null;

  casDeadlineDate: string | null;
  casStatus: "PENDING" | "APPLIED" | "RECEIVED" | null;

  visaStatus: "DECISION_PENDING" | "APPROVED" | "REJECTED" | null;

  universityStartDate: string | null;
};

type SaveStudentVisaProfileVariables = {
  studentId: string;
  payload: StudentVisaProfilePayload;
};

export function useSaveStudentVisaProfile() {
  const queryClient = useQueryClient();

  return useMutation<
    StudentVisaProfile,
    Error,
    SaveStudentVisaProfileVariables
  >({
    mutationFn: async ({ studentId, payload }) => {
      const response = await api.put(
        `/students/${studentId}/visa-profile`,
        payload,
      );

      return response.data?.data ?? response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: STUDENT_VISA_PROFILE_QUERY_KEY(variables.studentId),
      });

      toast.success("Visa profile saved successfully.");
    },
    onError: () => {
      toast.error("Unable to save visa profile.");
    },
  });
}
