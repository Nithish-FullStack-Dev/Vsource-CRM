import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  STUDENT_LOAN_PROFILE_QUERY_KEY,
  StudentLoanProfile,
} from "@/hooks/student/loan/useStudentLoanProfile";
import { toast } from "sonner";

export type StudentLoanProfilePayload = {
  fintechAssigneeId: string | null;
  nbfc: string | null;
  loanStatus: string | null;
  pfStatus: string | null;
  appliedAmount: number | null;
  sanctionedAmount: number | null;
  disbursed: boolean;
  disbursedAmount: number | null;
};

type SaveStudentLoanProfileVariables = {
  studentId: string;
  payload: StudentLoanProfilePayload;
};

export function useSaveStudentLoanProfile() {
  const queryClient = useQueryClient();

  return useMutation<
    StudentLoanProfile,
    Error,
    SaveStudentLoanProfileVariables
  >({
    mutationFn: async ({ studentId, payload }) => {
      const response = await api.put(
        `/students/${studentId}/loan-profile`,
        payload,
      );

      return response.data?.data ?? response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: STUDENT_LOAN_PROFILE_QUERY_KEY(variables.studentId),
      });

      toast.success("Loan profile saved successfully.");
    },
    onError: () => {
      toast.error("Unable to save loan profile.");
    },
  });
}
