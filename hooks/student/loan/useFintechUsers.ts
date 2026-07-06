// hooks/student/loan/useFintechUsers.ts

import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export const useFintechUsers = (studentId?: string) => {
  return useQuery({
    queryKey: ["fintech-users", studentId],
    enabled: !!studentId,
    queryFn: async () => {
      const { data } = await api.get(`/students/${studentId}/fintech-users`);

      return data.data;
    },
  });
};
