// hooks\student\applications\useUniversityDropdown.ts
import { api } from "@/lib/api";
import { APPLICATION } from "@/services/student/query-key";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface CourseDropdownItem {
  id: string;
  name: string;
  intakeId?: string | null;
  intakeName?: string | null;
}

export const useUniversityDropdown = (studentId?: string) => {
  return useQuery({
    queryKey: [...APPLICATION.universityDropDown, studentId],
    queryFn: async () => {
      const { data } = await api.get(
        `/universities/dropdown?studentId=${studentId}`,
      );

      return data?.data || [];
    },
    enabled: !!studentId,
  });
};

export const useCourseDropdown = (universityId?: string) => {
  return useQuery<CourseDropdownItem[]>({
    queryKey: [...APPLICATION.courseDropDown, universityId],

    queryFn: async () => {
      const { data } = await api.get(
        `/universities/${universityId}/courses/dropdown`,
      );

      return data?.data || [];
    },

    enabled: Boolean(universityId),
  });
};

export const useCreateUniversityCourse = (universityId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseName: string) => {
      if (!universityId) {
        throw new Error("University is required");
      }

      const { data } = await api.post(`/universities/${universityId}/courses`, {
        name: courseName.trim(),
      });

      return data.data as CourseDropdownItem;
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: [...APPLICATION.courseDropDown, universityId],
      });
    },
  });
};
