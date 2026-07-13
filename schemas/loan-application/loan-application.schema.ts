// schemas\loan-application\loan-application.schema.ts
import { z } from "zod";

import {
  isBusinessCategory,
  isEducationLoan,
  isSalariedCategory,
} from "@/lib/loan-application/constants";

/**
 * Convert empty form values to undefined.
 */
const empty = (v: unknown) =>
  v === "" || v === null || v === undefined || Number.isNaN(v) ? undefined : v;

/**
 * Reusable optional schemas.
 */
export const optionalString = z.preprocess(empty, z.string().trim().optional());

export const optionalDate = optionalString;

export const optionalNumber = z.preprocess((v) => {
  const x = empty(v);

  return x === undefined ? undefined : Number(x);
}, z.number().finite("Enter a valid number").nonnegative("Cannot be negative").optional());

const optionalPattern = (r: RegExp, m: string) =>
  z.preprocess(empty, z.string().regex(r, m).optional());

/**
 * ============================================================
 * BASE LOAN APPLICATION SCHEMA
 * ============================================================
 *
 * IMPORTANT:
 * This schema contains only fields.
 *
 * Do not add superRefine/refine here because PATCH requires
 * .partial(), and Zod cannot call .partial() on a refined schema.
 */
export const loanApplicationBaseSchema = z.object({
  /**
   * BASIC INFORMATION
   */
  fullName: z.string().trim().min(2, "Full name is required"),

  mobile: z
    .string()
    .regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),

  altMobile: optionalPattern(
    /^[0-9]{10}$/,
    "Enter a valid 10-digit alternate mobile number",
  ),

  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Invalid email address"),

  dob: optionalDate,

  gender: optionalString,

  maritalStatus: optionalString,

  aadhaar: optionalPattern(/^[0-9]{12}$/, "Aadhaar must be 12 digits"),

  pan: optionalPattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN number"),

  passport: optionalString,

  passportExpireDate: optionalDate,

  /**
   * ADDRESS INFORMATION
   */
  currentAddress: optionalString,

  permanentAddress: optionalString,

  city: optionalString,

  state: optionalString,

  pin: optionalPattern(/^[0-9]{6}$/, "PIN code must be 6 digits"),

  /**
   * ENQUIRY INFORMATION
   */
  enquiryDate: optionalDate,

  leadSource: optionalString,

  branchId: z.string().min(1, "Branch is required"),

  counselorId: optionalString,

  fintechAssigneeId: optionalString,

  priority: optionalString,

  nextFollowUp: optionalDate,

  remarks: optionalString,

  /**
   * APPLICATION / LOAN CATEGORY
   */
  applicantCategory: z.string().min(1, "Applicant category is required"),

  loanCategory: z.string().min(1, "Loan category is required"),

  loanStatus: optionalString,

  /**
   * EDUCATION INFORMATION
   */
  qualification: optionalString,

  graduationStatus: optionalString,

  percentage: optionalString,

  yearOfPassing: optionalPattern(/^[0-9]{4}$/, "Enter a valid 4-digit year"),

  currentInstitution: optionalString,

  workExperience: optionalString,

  /**
   * EMPLOYMENT INFORMATION
   */
  company: optionalString,

  designation: optionalString,

  employmentType: optionalString,

  employeeId: optionalString,

  totalExperience: optionalString,

  currentCompanyExperience: optionalString,

  monthlySalary: optionalNumber,

  annualIncome: optionalNumber,

  existingEmi: optionalNumber,

  employerAddress: optionalString,

  /**
   * BUSINESS INFORMATION
   */
  businessName: optionalString,

  businessType: optionalString,

  registrationType: optionalString,

  registrationNumber: optionalString,

  yearsInBusiness: optionalString,

  annualTurnover: optionalNumber,

  businessAddress: optionalString,

  /**
   * EDUCATION LOAN INFORMATION
   */
  studyDestination: optionalString,

  country: optionalString,

  university: optionalString,

  courseName: optionalString,

  courseLevel: optionalString,

  courseDuration: optionalString,

  intake: optionalString,

  admissionStatus: optionalString,

  offerLetterReceived: optionalString,

  /**
   * FINANCIAL INFORMATION
   */
  tuitionFee: optionalNumber,

  livingExpenses: optionalNumber,

  otherExpenses: optionalNumber,

  totalCourseCost: optionalNumber,

  ownContribution: optionalNumber,

  requiredLoanAmount: optionalNumber,

  loanPreference: optionalString,

  collateralAvailable: optionalString,

  /**
   * GENERAL LOAN INFORMATION
   */
  loanPurpose: optionalString,

  preferredTenure: optionalNumber,

  /**
   * CIBIL INFORMATION
   */
  cibilScore: z.preprocess((v) => {
    const x = empty(v);

    return x === undefined ? undefined : Number(x);
  }, z.number().int("Enter a valid CIBIL score").min(300, "CIBIL must be at least 300").max(900, "CIBIL cannot exceed 900").optional()),

  /**
   * PROPERTY INFORMATION
   */
  propertyType: optionalString,

  propertyLocation: optionalString,

  propertyValue: optionalNumber,

  downPayment: optionalNumber,

  /**
   * SANCTION / DISBURSEMENT
   */
  sanctionedAmount: optionalNumber,

  disbursedAmount: optionalNumber,

  /**
   * DEPOSIT INFORMATION
   */
  depositAmount: optionalNumber,

  depositDate: optionalDate,

  depositReference: optionalString,

  depositBank: optionalString,

  depositRemarks: optionalString,
});

/**
 * ============================================================
 * CREATE / FORM SCHEMA
 * ============================================================
 *
 * Conditional validations are applied here.
 */
export const loanApplicationFormSchema = loanApplicationBaseSchema.superRefine(
  (d, ctx) => {
    const blank = (v: unknown) =>
      v === undefined || v === null || (typeof v === "string" && !v.trim());

    const add = (p: keyof typeof d, m: string) =>
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [p],
        message: m,
      });

    const need = (p: keyof typeof d, m: string) => {
      if (blank(d[p])) {
        add(p, m);
      }
    };

    const needAmt = (p: keyof typeof d, m: string) => {
      const v = d[p];

      if (typeof v !== "number" || v <= 0) {
        add(p, m);
      }
    };

    /**
     * STUDENT VALIDATION
     */
    if (d.applicantCategory === "Student") {
      need("qualification", "Highest qualification is required");

      need("graduationStatus", "Graduation status is required");
    }

    /**
     * SALARIED APPLICANT VALIDATION
     */
    if (isSalariedCategory(d.applicantCategory)) {
      need("company", "Company name is required");

      need("designation", "Designation is required");

      needAmt("monthlySalary", "Monthly salary is required");
    }

    /**
     * BUSINESS APPLICANT VALIDATION
     */
    if (isBusinessCategory(d.applicantCategory)) {
      need("businessName", "Business name is required");

      need("businessType", "Business type is required");

      needAmt("annualTurnover", "Annual turnover is required");
    }

    /**
     * EDUCATION LOAN VALIDATION
     */
    if (isEducationLoan(d.loanCategory)) {
      need("studyDestination", "Study destination is required");

      need("country", "Country is required");

      need("university", "University / college name is required");

      need("courseName", "Course name is required");

      need("intake", "Intake is required");

      needAmt("requiredLoanAmount", "Required loan amount is required");
    }

    /**
     * PERSONAL LOAN VALIDATION
     */
    if (d.loanCategory === "Personal Loan") {
      need("loanPurpose", "Loan purpose is required");

      needAmt("requiredLoanAmount", "Required loan amount is required");

      needAmt("monthlySalary", "Monthly income is required");
    }

    /**
     * HOME LOAN / LAP VALIDATION
     */
    if (
      d.loanCategory === "Home Loan" ||
      d.loanCategory === "Loan Against Property"
    ) {
      need("propertyType", "Property type is required");

      need("propertyLocation", "Property location is required");

      needAmt("propertyValue", "Property value is required");

      needAmt("requiredLoanAmount", "Required loan amount is required");
    }

    /**
     * BUSINESS LOAN VALIDATION
     */
    if (d.loanCategory === "Business Loan") {
      need("businessName", "Business name is required");

      need("loanPurpose", "Loan purpose is required");

      needAmt("requiredLoanAmount", "Required loan amount is required");
    }

    /**
     * CIBIL CONSULTATION VALIDATION
     */

    /**
     * OTHER LOAN VALIDATION
     */
  },
);

/**
 * ============================================================
 * TYPES
 * ============================================================
 */
export type LoanApplicationFormValues = z.input<
  typeof loanApplicationFormSchema
>;

export type LoanApplicationPayload = z.output<typeof loanApplicationFormSchema>;

/**
 * ============================================================
 * CREATE SCHEMA
 * ============================================================
 */
export const createLoanApplicationSchema = loanApplicationFormSchema;

/**
 * ============================================================
 * UPDATE SCHEMA
 * ============================================================
 *
 * IMPORTANT FIX:
 *
 * Use partial() on the unrefined base object.
 *
 * DO NOT use:
 *
 * loanApplicationFormSchema.partial()
 */
export const updateLoanApplicationSchema = loanApplicationBaseSchema.partial();
export type UpdateLoanApplicationValues = z.input<
  typeof updateLoanApplicationSchema
>;
/**
 * ============================================================
 * BANK APPLICATION SCHEMA
 * ============================================================
 */
export const bankApplicationSchema = z.object({
  bank: z.string().trim().min(1, "Bank / NBFC name is required"),

  branch: optionalString,

  applicationNo: optionalString,

  loginDate: optionalDate,

  appliedAmount: optionalNumber,

  sanctionedAmount: optionalNumber,

  sanctionDate: optionalDate,

  disbursedAmount: optionalNumber,

  disbursementDate: optionalDate,

  roi: optionalNumber,

  tenure: optionalNumber,

  status: optionalString,

  remarks: optionalString,
});

/**
/**
 * ============================================================
 * CO-APPLICANT SCHEMA
 * ============================================================
 */

export const coApplicantSchema = z.object({
  /**
   * PERSONAL INFORMATION
   */
  name: z.string().trim().min(2, "Co-applicant name is required"),

  relationship: z.string().trim().min(1, "Relationship is required"),

  dob: optionalDate,

  gender: optionalString,

  /**
   * CONTACT INFORMATION
   */
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),

  altMobile: optionalPattern(
    /^[6-9]\d{9}$/,
    "Enter a valid 10-digit alternate mobile number",
  ),

  email: z.preprocess(
    empty,
    z.string().trim().email("Enter a valid email address").optional(),
  ),

  /**
   * IDENTITY INFORMATION
   */
  pan: z.preprocess(
    (value) => {
      const normalized = empty(value);

      return typeof normalized === "string"
        ? normalized.trim().toUpperCase()
        : normalized;
    },
    z
      .string()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN number")
      .optional(),
  ),

  aadhaar: optionalPattern(
    /^[0-9]{12}$/,
    "Enter a valid 12-digit Aadhaar number",
  ),

  /**
   * ADDRESS INFORMATION
   */
  address: optionalString,

  city: optionalString,

  state: optionalString,

  pin: optionalPattern(/^[0-9]{6}$/, "Enter a valid 6-digit PIN code"),

  /**
   * EMPLOYMENT INFORMATION
   */
  employmentType: optionalString,

  occupation: optionalString,

  employerName: optionalString,

  designation: optionalString,

  /**
   * FINANCIAL INFORMATION
   */
  monthlyIncome: optionalNumber,

  annualIncome: optionalNumber,

  existingEmi: optionalNumber,

  /**
   * CREDIT INFORMATION
   */
  cibilScore: z.preprocess((value) => {
    const normalized = empty(value);

    return normalized === undefined ? undefined : Number(normalized);
  }, z.number().int("Enter a valid CIBIL score").min(300, "CIBIL score must be at least 300").max(900, "CIBIL score cannot exceed 900").optional()),
});

export type CoApplicantFormValues = z.input<typeof coApplicantSchema>;

export type CoApplicantPayload = z.output<typeof coApplicantSchema>;
/**
 * ============================================================
 * FOLLOW-UP SCHEMA
 * ============================================================
 */
export const followUpSchema = z.object({
  type: optionalString,

  note: z.string().trim().min(1, "Follow-up note is required"),

  followUpDate: optionalDate,

  nextFollowUp: optionalDate,
});

/**
 * ============================================================
 * ACTIVITY SCHEMA
 * ============================================================
 */
export const activitySchema = z.object({
  type: z.string().optional(),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional().nullable(),
  createdById: z.string().uuid().optional().nullable(),
});

export const optionalPositiveNumber = z.preprocess(
  (value) => {
    if (
      value === "" ||
      value === null ||
      value === undefined ||
      Number.isNaN(value)
    ) {
      return undefined;
    }

    return Number(value);
  },
  z
    .number({
      error: "Enter a valid number",
    })
    .finite("Enter a valid number")
    .positive("Value must be greater than 0")
    .optional(),
);

export const optionalInteger = z.preprocess(
  (value) => {
    if (
      value === "" ||
      value === null ||
      value === undefined ||
      Number.isNaN(value)
    ) {
      return undefined;
    }

    return Number(value);
  },
  z
    .number({
      error: "Enter a valid number",
    })
    .int("Only whole numbers are allowed")
    .nonnegative("Negative values are not allowed")
    .optional(),
);

export const optionalCibil = z.preprocess(
  (value) => {
    if (
      value === "" ||
      value === null ||
      value === undefined ||
      Number.isNaN(value)
    ) {
      return undefined;
    }

    return Number(value);
  },
  z
    .number({
      error: "Enter a valid CIBIL score",
    })
    .int("CIBIL score must be a whole number")
    .min(300, "CIBIL score must be at least 300")
    .max(900, "CIBIL score cannot exceed 900")
    .optional(),
);

export const createFinancialEditSchema = (loanCategory?: string | null) =>
  z
    .object({
      tuitionFee: optionalNumber,
      livingExpenses: optionalNumber,
      otherExpenses: optionalNumber,
      totalCourseCost: optionalNumber,
      ownContribution: optionalNumber,
      requiredLoanAmount: optionalPositiveNumber,
      loanPreference: optionalString,
      collateralAvailable: optionalString,
      loanPurpose: optionalString,
      preferredTenure: optionalInteger,
      cibilScore: optionalCibil,
      propertyType: optionalString,
      propertyLocation: optionalString,
      propertyValue: optionalPositiveNumber,
      downPayment: optionalNumber,
    })
    .superRefine((data, ctx) => {
      const blank = (value: unknown) =>
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "");

      const addIssue = (path: keyof typeof data, message: string) => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [path],
          message,
        });
      };

      const requireField = (path: keyof typeof data, message: string) => {
        if (blank(data[path])) {
          addIssue(path, message);
        }
      };

      const requirePositiveAmount = (
        path: keyof typeof data,
        message: string,
      ) => {
        const value = data[path];

        if (value === undefined || value === null || value === "") {
          addIssue(path, message);
          return;
        }

        const numericValue = typeof value === "number" ? value : Number(value);

        if (!Number.isFinite(numericValue) || numericValue <= 0) {
          addIssue(path, message);
        }
      };

      if (isEducationLoan(loanCategory)) {
        requirePositiveAmount(
          "requiredLoanAmount",
          "Required loan amount must be greater than 0",
        );

        const totalCourseCost =
          data.totalCourseCost === undefined
            ? undefined
            : Number(data.totalCourseCost);

        const ownContribution =
          data.ownContribution === undefined
            ? undefined
            : Number(data.ownContribution);

        const requiredLoanAmount =
          data.requiredLoanAmount === undefined
            ? undefined
            : Number(data.requiredLoanAmount);

        if (
          Number.isFinite(totalCourseCost) &&
          Number.isFinite(ownContribution) &&
          ownContribution! > totalCourseCost!
        ) {
          addIssue(
            "ownContribution",
            "Own contribution cannot exceed total course cost",
          );
        }

        if (
          Number.isFinite(totalCourseCost) &&
          Number.isFinite(requiredLoanAmount) &&
          requiredLoanAmount! > totalCourseCost!
        ) {
          addIssue(
            "requiredLoanAmount",
            "Required loan amount cannot exceed total course cost",
          );
        }
      }

      if (loanCategory === "Personal Loan") {
        requireField("loanPurpose", "Loan purpose is required");

        requirePositiveAmount(
          "requiredLoanAmount",
          "Required loan amount must be greater than 0",
        );
      }

      if (loanCategory === "Home Loan") {
        requireField("propertyType", "Property type is required");

        requireField("propertyLocation", "Property location is required");

        requirePositiveAmount(
          "propertyValue",
          "Property value must be greater than 0",
        );

        requirePositiveAmount(
          "requiredLoanAmount",
          "Required loan amount must be greater than 0",
        );

        const propertyValue =
          data.propertyValue === undefined
            ? undefined
            : Number(data.propertyValue);

        const requiredLoanAmount =
          data.requiredLoanAmount === undefined
            ? undefined
            : Number(data.requiredLoanAmount);

        const downPayment =
          data.downPayment === undefined ? undefined : Number(data.downPayment);

        if (
          Number.isFinite(propertyValue) &&
          Number.isFinite(requiredLoanAmount) &&
          requiredLoanAmount! > propertyValue!
        ) {
          addIssue(
            "requiredLoanAmount",
            "Required loan amount cannot exceed property value",
          );
        }

        if (
          Number.isFinite(propertyValue) &&
          Number.isFinite(downPayment) &&
          downPayment! > propertyValue!
        ) {
          addIssue("downPayment", "Down payment cannot exceed property value");
        }
      }

      if (loanCategory === "Business Loan") {
        requireField("loanPurpose", "Loan purpose is required");

        requirePositiveAmount(
          "requiredLoanAmount",
          "Required loan amount must be greater than 0",
        );
      }
    });

export type FinancialEditInput = z.input<
  ReturnType<typeof createFinancialEditSchema>
>;

export type FinancialEditValues = z.output<
  ReturnType<typeof createFinancialEditSchema>
>;
