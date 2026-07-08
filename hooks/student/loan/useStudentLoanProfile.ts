import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type StudentLoanProfile = {
  id: string;
  studentId: string;

  fintechAssigneeId?: string | null;
  fintechAssignee?: {
    id: string;
    name: string;
  } | null;

  nbfc?: string | null;

  loanStatus?: string | null;
  pfStatus?: string | null;

  depositDate?: string | null;

  disbursed: boolean;
  disbursedDate?: string | null;

  createdAt?: string;
  updatedAt?: string;
};

export const STUDENT_LOAN_PROFILE_QUERY_KEY = (studentId: string) =>
  ["student", studentId, "loan-profile"] as const;

export function useStudentLoanProfile(studentId: string) {
  return useQuery<StudentLoanProfile | null>({
    queryKey: STUDENT_LOAN_PROFILE_QUERY_KEY(studentId),
    enabled: Boolean(studentId),
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/loan-profile`);
      return response.data?.data ?? response.data ?? null;
    },
  });
}
