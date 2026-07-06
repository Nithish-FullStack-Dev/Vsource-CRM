import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { saveStudentVisaLoanProfile } from "@/services/student/visa-loan-profile";
import { STUDENT_VISA_LOAN_PROFILE_KEY } from "@/services/student/visa-loan-profile-query-key";
import { StudentVisaLoanProfilePayload } from "@/types/student";
import { STUDENTKEY } from "@/services/student/query-key";

type SaveProfileVariables = {
  studentId: string;
  payload: StudentVisaLoanProfilePayload;
};

export const useSaveStudentVisaLoanProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ studentId, payload }: SaveProfileVariables) =>
      saveStudentVisaLoanProfile(studentId, payload),

    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: STUDENT_VISA_LOAN_PROFILE_KEY.detail(variables.studentId),
        }),
        queryClient.invalidateQueries({
          queryKey: STUDENTKEY.all,
        }),
      ]);

      toast.success("Visa and loan profile saved successfully");
    },

    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to save visa and loan profile";

      toast.error(message);
    },
  });
};
