import { studentTimelineService } from "@/services/student/studentTimelineService";
import { CreateTimelinePayload } from "@/types/student";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateStudentTimeline(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTimelinePayload) =>
      studentTimelineService.createTimeline(studentId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["student-timeline", studentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });

      toast.success("Timeline added successfully.");
    },

    onError: () => {
      toast.error("Failed to add timeline.");
    },
  });
}

