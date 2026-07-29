/**
 * lib\schemas.ts
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
const LeadStatusEnum = z.enum(["NEW", "VISA_APPLICATION", "DROP"]);
const LeadTypeEnum = z.enum(["study_abroad", "mbbs"]);
const EnglishTestTypeEnum = z.enum(["IELTS", "TOEFL", "DUOLINGO", "PTE"]);

export const LeadEnglishTestSchema = z.object({
  testType: EnglishTestTypeEnum,

  totalScore: optFloat,
  listeningScore: optFloat,
  readingScore: optFloat,
  writingScore: optFloat,
  speakingScore: optFloat,
});
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

  englishTests: z
    .array(LeadEnglishTestSchema)
    .max(4, "Maximum 4 English proficiency tests are allowed")
    .refine(
      (tests) => {
        const testTypes = tests.map((test) => test.testType);

        return new Set(testTypes).size === testTypes.length;
      },
      {
        message: "Duplicate English proficiency tests are not allowed",
      },
    )
    .optional()
    .default([]),
  gapsIfAny: optStr,

  status: LeadStatusEnum.default("NEW"),

  nextFollowup: optDate,

  remarks: optStr,

  graduationStatus: z.preprocess(
    (value) => {
      if (value === "" || value === null || value === undefined) {
        return null;
      }

      return value;
    },
    z.enum(["completed", "pursuing"]).nullable().optional(),
  ),

  loanRequirement: z.boolean().default(false),

  counselorIds: z.array(z.string().uuid()).optional(),
  fintechAssigneeId: z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return null;
    }
    return value;
  }, z.string().uuid().nullable().optional()),
});

export const LeadUpdateSchema = LeadCreateSchema.partial()
  .omit({
    leadNumber: true,
  })
  .extend({
    // Remove defaults for updates
    leadType: LeadTypeEnum.optional(),
    preferredTiers: z.array(z.enum(["T1", "T2", "T3", "T4"])).optional(),
    englishTests: z.array(LeadEnglishTestSchema).optional(),
    status: LeadStatusEnum.optional(),
    loanRequirement: z.boolean().optional(),

    counselorIds: z.array(z.string().uuid()).optional(),
    followupDate: z.string().trim().optional(),
    followupNote: z.string().trim().optional(),
  });

export const LeadTimelineCreateSchema = z.object({
  description: z.string().min(1),
  nextFollowup: optDate,
  createdById: optUuid,
});
export const BankCreateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Bank name is required")
    .max(150, "Bank name must be less than 150 characters"),
  status: z.boolean().optional().default(true),
});

export const BankUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Bank name is required")
    .max(150, "Bank name must be less than 150 characters")
    .optional(),
  status: z.boolean().optional(),
});
// ---------------------------------------------------------------------------
// MBBS Lead
// ---------------------------------------------------------------------------
const MbbsLeadStatusEnum = z.enum(["NEW", "VISA_APPLICATION", "DROP"]);

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
  status: MbbsLeadStatusEnum.default("NEW"),
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
  id: z.string().optional(),
  name: z.string().trim().min(1, "Course name is required"),
  degree: DegreeTypeEnum.optional(),
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
