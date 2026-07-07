// hooks/useStudents.ts

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import {
  StudentFilters,
  studentService,
} from "@/services/student/student.service";
import { STUDENTKEY } from "@/services/student/query-key";

export const useStudents = (filters?: StudentFilters) => {
  return useQuery({
    queryKey: [...STUDENTKEY.all, filters],

    queryFn: () => studentService.getStudents(filters),

    staleTime: 0,
    placeholderData: keepPreviousData,
  });
};
