/**
 * api/_lib/schemas.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Zod validation schemas for every entity.  These are imported by the route
 * handlers to parse / validate incoming request bodies.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------
const uuid = z.string().uuid();
const optUuid = uuid.optional();
const optStr = z.string().nullable().optional();
const optFloat = z.number().nullable().optional();
const optInt = z.number().int().nullable().optional();
const optBool = z.boolean().optional();
const optDate = z.preprocess((arg) => {
  if (arg === "" || arg === null || arg === undefined) return undefined;
  return new Date(arg as string | number);
}, z.date().nullable().optional());

// ---------------------------------------------------------------------------
// Branch
// ---------------------------------------------------------------------------
export const BranchCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  email: optStr,
  phone: optStr,
  city: optStr,
  state: optStr,
  country: optStr,
  pincode: optStr,
  address: optStr,
  status: optBool,
});

export const BranchUpdateSchema = BranchCreateSchema.partial();

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------
export const UserCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  roleId: uuid,
  branchIds: z.array(uuid).optional(),
  target: z.number().int().min(0).optional(),
});

export const UserUpdateSchema = z.object({
  name: optStr,
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  roleId: optUuid,
  branchIds: z.array(uuid).optional(),
  target: z.number().int().min(0).optional(),
});

// ---------------------------------------------------------------------------
// Role
// ---------------------------------------------------------------------------
export const RoleCreateSchema = z.object({
  name: z.string().min(1),
  description: optStr,
  isSystem: optBool,
});

export const RoleUpdateSchema = RoleCreateSchema.partial();

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------
export const ModuleCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  icon: optStr,
  sortOrder: optInt,
  isActive: optBool,
});

export const ModuleUpdateSchema = ModuleCreateSchema.partial();

// ---------------------------------------------------------------------------
// RBAC — RoleModulePermission
// ---------------------------------------------------------------------------
export const PermissionUpsertSchema = z.object({
  roleId: uuid,
  moduleId: uuid,
  canCreate: z.boolean().default(false),
  canRead: z.boolean().default(false),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

export const BulkPermissionUpsertSchema = z.object({
  permissions: z.array(PermissionUpsertSchema).min(1),
});

// ---------------------------------------------------------------------------
// Lead
// ---------------------------------------------------------------------------
const LeadStatusEnum = z.enum([
  "draft",
  "new",
  "contacted",
  "qualified",
  "converted",
  "lost",
]);
const LeadTypeEnum = z.enum(["study_abroad", "mbbs"]);

export const LeadCreateSchema = z.object({
  leadNumber: optStr,
  leadType: LeadTypeEnum.default("study_abroad"),
  counsellingDate: optDate,
  studentName: optStr,
  fatherName: optStr,
  mobileNumber: optStr,
  emailId: optStr,
  place: optStr,
  passport: optStr,
  passportExpireDate: optDate,
  source: optStr,
  branchId: uuid,
  assignedCounselorId: optUuid,
  tenthPercentage: optFloat,
  tenthYearOfPassing: optInt,
  twelfthPercentage: optFloat,
  twelfthYearOfPassing: optInt,
  bachelorsCourse: optStr,
  bachelorsUniversityName: optStr,
  bachelorsPercentage: optFloat,
  bachelorsYearOfPassing: optInt,
  backlogs: optInt,
  workExperience: optStr,
  preferredCountry: optStr,
  preferredIntake: optStr,
  preferredCourse: optStr,
  preferredTiers: z
    .array(z.enum(["T1", "T2", "T3", "T4"]))
    .optional()
    .default([]),
  greGmatScore: optFloat,
  quantitativeScore: optFloat,
  verbalScore: optFloat,
  analyticalWritingScore: optFloat,
  englishTestType: optStr,
  listeningScore: optFloat,
  writingScore: optFloat,
  readingScore: optFloat,
  speakingScore: optFloat,
  gapsIfAny: optStr,
  status: LeadStatusEnum.default("new"),
  nextFollowup: optDate,
  remarks: optStr,
});

export const LeadUpdateSchema = LeadCreateSchema.partial()
  .omit({
    leadNumber: true,
  })
  .extend({
    counselorIds: z.array(z.string().uuid()).optional(),
  });

export const LeadTimelineCreateSchema = z.object({
  description: z.string().min(1),
  nextFollowup: optDate,
  createdById: optUuid,
});

// ---------------------------------------------------------------------------
// MBBS Lead
// ---------------------------------------------------------------------------
const MbbsLeadStatusEnum = z.enum([
  "new",
  "contacted",
  "qualified",
  "admitted",
  "enrolled",
  "lost",
]);

export const MbbsLeadCreateSchema = z.object({
  leadNumber: optStr,
  counsellingDate: optDate,
  studentName: optStr,
  fatherName: optStr,
  mobileNumber: optStr,
  emailId: optStr,
  address: optStr,
  state: optStr,
  city: optStr,
  passport: optStr,
  passportExpireDate: optDate,
  source: optStr,
  branchId: uuid,
  twelfthCollegeName: optStr,
  twelfthMarks: optFloat,
  neetMarks: optFloat,
  ept: optStr,
  listeningScore: optFloat,
  readingScore: optFloat,
  writingScore: optFloat,
  speakingScore: optFloat,
  preferredCountry: optStr,
  preferredIntake: optStr,
  preferredUniversity: optStr,
  preferredCourse: optStr,
  preferredTiers: z
    .array(z.enum(["T1", "T2", "T3", "T4"]))
    .optional()
    .default([]),
  remarks: optStr,
  assignedCounselorId: optUuid,
  status: MbbsLeadStatusEnum.default("new"),
  nextFollowup: optDate,
});

export const MbbsLeadUpdateSchema = MbbsLeadCreateSchema.partial()
  .omit({
    leadNumber: true,
  })
  .extend({
    counselorIds: z.array(z.string().uuid()).optional(),
  });

export const MbbsLeadTimelineCreateSchema = z.object({
  description: z.string().min(1),
  nextFollowup: optDate,
  createdById: optUuid,
});

// ---------------------------------------------------------------------------
// University
// ---------------------------------------------------------------------------
const UniversityStatusEnum = z.enum(["active", "inactive", "archived"]);
const DegreeTypeEnum = z.enum([
  "diploma",
  "bachelors",
  "masters",
  "phd",
  "mba",
  "certificate",
]);

export const UniversityCourseCreateSchema = z.object({
  name: z.string().min(1),
  degree: DegreeTypeEnum,
  durationMonths: optInt,
  annualTuitionFee: z.number().optional(),
  totalTuitionFee: z.number().optional(),
  currency: optStr,
  intakeId: optUuid,
  minimumPercentage: optFloat,
  backlogLimit: optInt,
  englishRequirement: optStr,
  ieltsOverall: optFloat,
  ieltsListening: optFloat,
  ieltsReading: optFloat,
  ieltsWriting: optFloat,
  ieltsSpeaking: optFloat,
  greRequired: optBool,
  gmatRequired: optBool,
  courseCode: optStr,
  description: optStr,
  applicationDeadline: optDate,
  status: optBool,
});

export const UniversityCourseUpdateSchema =
  UniversityCourseCreateSchema.partial();

export const UniversityScholarshipCreateSchema = z.object({
  name: z.string().min(1),
  amount: z.number().optional(),
  percentage: optFloat,
  description: optStr,
  status: UniversityStatusEnum.default("active"),
  courseId: optUuid,
});

export const UniversityScholarshipUpdateSchema =
  UniversityScholarshipCreateSchema.partial();

export const UniversityCreateSchema = z.object({
  name: z.string().min(1),
  countryId: uuid,
  tier: z.enum(["T1", "T2", "T3", "T4"]).default("T4"),
  logo: optStr,
  website: optStr,
  address: optStr,
  city: optStr,
  state: optStr,
  postalCode: optStr,
  ranking: optInt,
  establishedYear: optInt,
  applicationFee: z.number().optional(),
  currency: optStr,
  description: optStr,
  status: UniversityStatusEnum.default("active"),
  contactPerson: optStr,
  contactEmail: optStr,
  contactPhone: optStr,
  intakeNotes: optStr,
  courses: z.array(UniversityCourseCreateSchema).optional(),
  scholarships: z.array(UniversityScholarshipCreateSchema).optional(),
});

export const UniversityUpdateSchema = UniversityCreateSchema.partial();

// ---------------------------------------------------------------------------
// Country
// ---------------------------------------------------------------------------
export const CountryCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(2).max(4),
  currency: optStr,
  status: optBool,
});

export const CountryUpdateSchema = CountryCreateSchema.partial();

// ---------------------------------------------------------------------------
// Intake
// ---------------------------------------------------------------------------
export const IntakeCreateSchema = z.object({
  name: z.string().min(1),
  status: optBool,
});

export const IntakeUpdateSchema = IntakeCreateSchema.partial();
// ---------------------------------------------------------------------------
// Lead Sources, Degrees, Universities
// ---------------------------------------------------------------------------
export const LeadSourceCreateSchema = z.object({
  name: z.string().min(1),
  status: optBool,
});

export const LeadDegreeCreateSchema = z.object({
  name: z.string().min(1),
  status: optBool,
});

export const LeadUniversityCreateSchema = z.object({
  name: z.string().min(1),
  status: optBool,
});
