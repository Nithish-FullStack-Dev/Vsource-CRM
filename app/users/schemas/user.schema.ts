import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8, "Minimum 8 characters"),
  branchIds: z.array(z.string()).optional(),
  roleId: z.string().min(1, "Role is required"),
});

export const updateUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  branchIds: z.array(z.string()).optional(),
  roleId: z.string().optional(),
  password: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val))
    .refine(
      (val) => val === undefined || val.length >= 8,
      "Minimum 8 characters",
    ),
});

export type UserFormValues = {
  name: string;
  email: string;
  password?: string;
  branchIds?: string[];
  roleId?: string;
};

export type CreateUserFormValues = z.infer<typeof createUserSchema>;

export type UpdateUserFormValues = z.infer<typeof updateUserSchema>;
