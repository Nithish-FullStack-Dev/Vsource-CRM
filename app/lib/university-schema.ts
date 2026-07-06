import { z } from "zod";

// Helper — empty string / null / undefined → undefined (for numbers)
const emptyToUndefinedNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return undefined;
  const num = Number(val);
  return isNaN(num) ? undefined : num;
}, z.number().nonnegative("Value cannot be negative").optional());

// Helper — empty string / null / undefined → undefined (for strings)
const emptyToUndefinedString = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? undefined : val),
  z.string().optional(),
);

export const courseSchema = z.object({
  id: z.string(),

  name: z.string().trim().min(1, "Course name is required"),

  courseCode: emptyToUndefinedString,

  degree: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : val,
    z
      .enum(["diploma", "bachelors", "masters", "phd", "mba", "certificate"])
      .optional(),
  ),

  durationMonths: emptyToUndefinedNumber,

  annualTuitionFee: emptyToUndefinedNumber,

  totalTuitionFee: emptyToUndefinedNumber,

  currency: emptyToUndefinedString,

  intakeId: emptyToUndefinedString,

  minimumPercentage: emptyToUndefinedNumber,

  backlogLimit: emptyToUndefinedNumber,

  ieltsOverall: emptyToUndefinedNumber,

  applicationDeadline: emptyToUndefinedString,

  description: emptyToUndefinedString,
});

export const scholarshipSchema = z.object({
  id: z.string(),

  name: z.string().min(1, "Scholarship name is required"),

  amount: emptyToUndefinedNumber,

  percentage: emptyToUndefinedNumber,

  description: emptyToUndefinedString,
});

export const universitySchema = z.object({
  id: z.string().optional(),

  name: z.string().min(2, "University name must be at least 2 characters"),

  countryId: z.string().min(1, "Country is required"),

  tier: z.enum(["T1", "T2", "T3", "T4"]).default("T4"),

  city: emptyToUndefinedString,

  state: emptyToUndefinedString,

  postalCode: emptyToUndefinedString,

  website: emptyToUndefinedString,

  logo: emptyToUndefinedString,

  ranking: emptyToUndefinedNumber,

  establishedYear: emptyToUndefinedNumber,

  applicationFee: emptyToUndefinedNumber,

  currency: emptyToUndefinedString,

  description: emptyToUndefinedString,

  contactPerson: emptyToUndefinedString,

  // Allow empty or null email gracefully
  contactEmail: z.preprocess(
    (val) =>
      val === "" || val === null || val === undefined ? undefined : val,
    z.string().email("Invalid email format").optional(),
  ),

  contactPhone: emptyToUndefinedString,

  intakeNotes: emptyToUndefinedString,

  status: z.enum(["active", "inactive", "archived"]),

  courses: z.array(courseSchema).optional().default([]),

  scholarships: z.array(scholarshipSchema).optional().default([]),
});

export type UniversityFormValues = z.infer<typeof universitySchema>;
