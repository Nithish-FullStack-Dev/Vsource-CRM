import { z } from "zod";

export const updateStudentBasicInfoSchema = z.object({
  studentName: z.string().min(1, "Student name is required"),

  mobileNumber: z.string().min(10),

  emailId: z.string().email(),

  password: z.string().min(6).optional().or(z.literal("")),

  dob: z.string().optional(),

  undergraduate: z.enum(["pursuing", "graduate"]).optional(),
  moi: z.string().optional(),

  gender: z.enum(["male", "female", "others"]).optional(),

  applicationDate: z.string().optional(),

  counselorId: z.string().optional(),

  currentStage: z.string().optional(),

  status: z.enum(["active", "inactive", "drop"]).optional(),
});

export type UpdateStudentBasicInfoForm = z.infer<
  typeof updateStudentBasicInfoSchema
>;
