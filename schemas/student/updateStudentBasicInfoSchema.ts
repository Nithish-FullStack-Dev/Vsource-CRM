import { z } from "zod";

export const updateStudentStatusSchema = z.object({
  status: z.enum(["active", "inactive", "drop"]),
});

export type UpdateStudentStatusForm = z.infer<typeof updateStudentStatusSchema>;
