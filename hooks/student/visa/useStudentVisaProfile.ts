import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export type StudentVisaProfile = {
  id: string;
  studentId: string;
  depositDeadlineDate?: string | null;
  depositStatus?: string | null;
  ihsPaidStatus?: string | null;
  visaPaidStatus?: string | null;
  casDeadlineDate?: string | null;
  casStatus?: string | null;
  visaStatus?: string | null;
  universityStartDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export const STUDENT_VISA_PROFILE_QUERY_KEY = (studentId: string) =>
  ["student", studentId, "visa-profile"] as const;

export function useStudentVisaProfile(studentId: string) {
  return useQuery<StudentVisaProfile | null>({
    queryKey: STUDENT_VISA_PROFILE_QUERY_KEY(studentId),
    enabled: Boolean(studentId),
    queryFn: async () => {
      const response = await api.get(`/students/${studentId}/visa-profile`);
      return response.data?.data ?? response.data ?? null;
    },
  });
}
