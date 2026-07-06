import { useQuery } from "@tanstack/react-query";
import { getStudentVisaLoanProfile } from "@/services/student/visa-loan-profile";
import { STUDENT_VISA_LOAN_PROFILE_KEY } from "@/services/student/visa-loan-profile-query-key";

export const useStudentVisaLoanProfile = (studentId: string) => {
  return useQuery({
    queryKey: STUDENT_VISA_LOAN_PROFILE_KEY.detail(studentId),
    queryFn: () => getStudentVisaLoanProfile(studentId),
    enabled: Boolean(studentId),
    retry: 1,
    staleTime: 30_000,
  });
};
