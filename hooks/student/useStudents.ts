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

export const useStudent = (id?: string) => {
  return useQuery({
    queryKey: id ? STUDENTKEY.detail(id) : ["students", "detail", "empty"],
    queryFn: () => studentService.getStudent(id!),
    enabled: Boolean(id),
    staleTime: 60 * 60,
  });
};
