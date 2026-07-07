// services/student.service.ts

import { api } from "@/lib/api";

export interface StudentFilters {
  page?: number;
  limit?: number;
  search?: string;
  branchId?: string;
  counselorId?: string;
  visaStatus?: string;
  loanStatus?: string;
  casStatus?: string;
}

export const studentService = {
  async getStudents(params?: StudentFilters) {
    const { data } = await api.get("/students", {
      params,
    });

    return data;
  },

  async getStudent(id: string) {
    const { data } = await api.get(`/students/${id}`);

    return data;
  },
};
