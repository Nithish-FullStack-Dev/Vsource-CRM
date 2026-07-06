import { api } from "@/lib/api";
import type { CreateTimelinePayload, StudentTimeline } from "@/types/student";

export const studentTimelineService = {
  async getTimeline(studentId: string): Promise<StudentTimeline[]> {
    const { data } = await api.get(`/students/${studentId}/timeline`);

    return data.data;
  },

  async createTimeline(
    studentId: string,
    payload: CreateTimelinePayload,
  ): Promise<StudentTimeline> {
    const { data } = await api.post(`/students/${studentId}/timeline`, payload);

    return data.data;
  },
};
