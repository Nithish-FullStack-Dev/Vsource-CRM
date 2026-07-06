import { useQuery } from "@tanstack/react-query";
import { studentTimelineService } from "@/services/student/studentTimelineService";

export function useStudentTimeline(studentId?: string) {
  return useQuery({
    queryKey: ["student-timeline", studentId],

    queryFn: () => studentTimelineService.getTimeline(studentId!),

    enabled: !!studentId,
  });
}
