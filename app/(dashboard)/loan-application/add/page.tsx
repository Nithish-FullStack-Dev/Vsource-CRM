// app\(dashboard)\loan-application\add\page.tsx
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  Controller,
  type FieldErrors,
  type FieldPath,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { toast } from "sonner";
import { PageHeader, PageTransition } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/store";
import { Branch } from "@/lib/branches";
import {
  Country,
  Intake,
  LeadSource,
  getCountries,
  getIntakes,
  getLeadSources,
} from "@/lib/master-settings";
import {
  Briefcase,
  Building2,
  Check,
  CreditCard,
  GraduationCap,
  Home,
  IndianRupee,
  Loader2,
  MapPin,
  Plus,
  RotateCcw,
  Send,
  UserRound,
  Users,
  ChevronsUpDown,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { cn } from "@/lib/utils";

import { useQuery, useQueryClient } from "@tanstack/react-query";
/* -------------------------------------------------------------------------- */
/*                                   CONSTANTS                                */
/* -------------------------------------------------------------------------- */
type AbroadUniversity = {
  id: string;
  name: string;
  countryId: string;
  city: string | null;
  state: string | null;
  country: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    courses: number;
    scholarships: number;
  };
};

type UniversityCourse = {
  id: string;
  name: string;
  degree?: string | null;
  duration?: string | null;
  status: boolean;
  intake?: {
    id: string;
    name: string;
  } | null;
};
const APPLICANT_CATEGORIES = ["Student", "Salaried", "Self Employed"] as const;

const LOAN_CATEGORIES = [
  "Study Abroad Loan",
  "Domestic Education Loan",
  "Personal Loan",
  "Home Loan",
  "Business Loan",
] as const;

const EDUCATION_LOANS = [
  "Study Abroad Loan",
  "Domestic Education Loan",
] as const;

const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;

const MARITAL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Divorced",
  "Widowed",
] as const;

const PRIORITY_OPTIONS = ["Low", "Medium", "High", "Urgent"] as const;

const RELATIONSHIP_OPTIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Brother",
  "Sister",
  "Guardian",
  "Other",
] as const;

const EMPLOYMENT_TYPE_OPTIONS = ["Permanent", "Contract", "Probation"] as const;

const REGISTRATION_TYPE_OPTIONS = [
  "Proprietorship",
  "Partnership",
  "LLP",
  "Private Limited",
  "Public Limited",
] as const;

const GRADUATION_STATUS_OPTIONS = [
  "Pursuing",
  "Completed",
  "Discontinued",
] as const;

const STUDY_DESTINATION_OPTIONS = ["Abroad", "Domestic"] as const;

const COURSE_LEVEL_OPTIONS = [
  "Undergraduate",
  "Postgraduate",
  "PhD",
  "Diploma",
  "MBBS",
] as const;

const ADMISSION_STATUS_OPTIONS = ["On Hold", "Applied", "Drop"] as const;

const OFFER_LETTER_OPTIONS = [
  "Pending",
  "Priority UCOL",
  "Priority COL",
  "COL",
  "UCOL",
] as const;

const LOAN_PREFERENCE_OPTIONS = ["Secured", "Unsecured", "Either"] as const;

const YES_NO_OPTIONS = ["Yes", "No"] as const;

/* -------------------------------------------------------------------------- */
/*                                     TYPES                                  */
/* -------------------------------------------------------------------------- */

type Option = {
  value: string;
  label: string;
};

type UserOption = {
  id: string;
  name: string;
  email?: string;
};

type MasterItem = {
  id: string;
  name: string;
};

/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

const isEducationLoan = (loan?: string) =>
  Boolean(
    loan && EDUCATION_LOANS.includes(loan as (typeof EDUCATION_LOANS)[number]),
  );

const isSalariedCategory = (category?: string) => category === "Salaried";

const isBusinessCategory = (category?: string) => category === "Self Employed";

const toOptions = (items: readonly string[] | MasterItem[]): Option[] =>
  items.map((item) =>
    typeof item === "string"
      ? {
          value: item,
          label: item,
        }
      : {
          value: item.name,
          label: item.name,
        },
  );

const normalizeOptionalString = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();

  return trimmed === "" ? undefined : trimmed;
};

const optionalString = z.preprocess(
  normalizeOptionalString,
  z.string().optional(),
);

const optionalNumber = z.preprocess(
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
    .nonnegative("Negative values are not allowed")
    .optional(),
);

const optionalPositiveNumber = z.preprocess(
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

const optionalInteger = z.preprocess(
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

const optionalCibil = z.preprocess(
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

const optionalPattern = (regex: RegExp, message: string) =>
  z.preprocess(
    normalizeOptionalString,
    z.string().regex(regex, message).optional(),
  );

const optionalPercentageOrCgpa = z.preprocess(
  normalizeOptionalString,
  z
    .string()
    .max(20, "Percentage / CGPA is too long")
    .refine((value) => {
      const normalized = value
        .toLowerCase()
        .replace(/\s/g, "")
        .replace("%", "")
        .replace("cgpa", "");

      const number = Number(normalized);

      if (Number.isNaN(number)) {
        return false;
      }

      return number >= 0 && number <= 100;
    }, "Enter a valid percentage or CGPA")
    .optional(),
);

const isValidDateString = (value?: string) => {
  if (!value) {
    return true;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
};

const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getCurrentYear = () => new Date().getFullYear();

/* -------------------------------------------------------------------------- */
/*                              VALIDATION SCHEMA                             */
/* -------------------------------------------------------------------------- */

const loanFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, "Full name must contain at least 2 characters")
      .max(100, "Full name cannot exceed 100 characters")
      .regex(
        /^[A-Za-z\s.'-]+$/,
        "Full name can contain only letters and valid name characters",
      ),

    mobile: z
      .string()
      .trim()
      .regex(/^[6-9][0-9]{9}$/, "Enter a valid 10-digit Indian mobile number"),

    altMobile: optionalPattern(
      /^[6-9][0-9]{9}$/,
      "Enter a valid 10-digit alternate mobile number",
    ),

    email: z
      .string()
      .trim()
      .min(1, "Email address is required")
      .email("Enter a valid email address")
      .max(150, "Email address is too long"),

    dob: optionalString.refine(
      isValidDateString,
      "Enter a valid date of birth",
    ),

    gender: optionalString,

    maritalStatus: optionalString,

    aadhaar: optionalPattern(
      /^[2-9][0-9]{11}$/,
      "Enter a valid 12-digit Aadhaar number",
    ),

    pan: optionalPattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN number"),

    passport: optionalPattern(
      /^[A-Z][0-9]{7}$/,
      "Enter a valid passport number",
    ),

    passportExpireDate: optionalString.refine(
      isValidDateString,
      "Enter a valid passport expiry date",
    ),

    currentAddress: optionalString,

    permanentAddress: optionalString,

    city: optionalString,

    state: optionalString,

    pin: optionalPattern(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit PIN code"),

    enquiryDate: optionalString.refine(
      isValidDateString,
      "Enter a valid application date",
    ),

    leadSource: optionalString,

    branchId: z.string().trim().min(1, "Branch is required"),

    counselorIds: z.array(z.string()).optional(),

    fintechAssigneeId: optionalString,

    priority: optionalString,

    nextFollowUp: optionalString.refine(
      isValidDateString,
      "Enter a valid follow-up date",
    ),

    remarks: z
      .string()
      .trim()
      .max(1000, "Remarks cannot exceed 1000 characters")
      .optional(),

    relationship: optionalString,

    coApplicantName: optionalString,

    coApplicantMobile: optionalPattern(
      /^[6-9][0-9]{9}$/,
      "Enter a valid 10-digit co-applicant mobile number",
    ),

    applicantCategory: z
      .string()
      .trim()
      .min(1, "Applicant category is required"),

    loanCategory: z.string().trim().min(1, "Loan category is required"),

    qualification: optionalString,

    graduationStatus: optionalString,

    percentage: optionalPercentageOrCgpa,

    yearOfPassing: optionalPattern(/^[0-9]{4}$/, "Enter a valid 4-digit year"),

    currentInstitution: optionalString,

    workExperience: optionalString,

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

    businessName: optionalString,

    businessType: optionalString,

    registrationType: optionalString,

    registrationNumber: optionalString,

    yearsInBusiness: optionalString,

    annualTurnover: optionalNumber,

    businessAddress: optionalString,

    studyDestination: optionalString,

    country: optionalString,

    university: optionalString,

    courseName: optionalString,

    courseLevel: optionalString,

    courseDuration: optionalString,

    intake: optionalString,

    admissionStatus: optionalString,

    offerLetterReceived: optionalString,

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

      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
        addIssue(path, message);
      }
    };

    /* ----------------------------- DATE CHECKS ----------------------------- */

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (data.dob) {
      const dob = new Date(data.dob);

      if (dob > today) {
        addIssue("dob", "Date of birth cannot be in the future");
      }
    }

    if (data.passportExpireDate) {
      const expiryDate = new Date(data.passportExpireDate);
      const currentDate = new Date();

      currentDate.setHours(0, 0, 0, 0);

      if (expiryDate < currentDate) {
        addIssue(
          "passportExpireDate",
          "Passport expiry date cannot be in the past",
        );
      }
    }

    if (data.nextFollowUp) {
      const followUp = new Date(data.nextFollowUp);
      const currentDate = new Date();

      currentDate.setHours(0, 0, 0, 0);

      if (followUp < currentDate) {
        addIssue("nextFollowUp", "Next follow-up date cannot be in the past");
      }
    }

    /* --------------------------- MOBILE VALIDATION ------------------------- */

    if (data.altMobile && data.mobile === data.altMobile) {
      addIssue(
        "altMobile",
        "Alternate mobile number must be different from mobile number",
      );
    }

    /* ----------------------- YEAR OF PASSING CHECK ------------------------- */

    if (data.yearOfPassing) {
      const year = Number(data.yearOfPassing);
      const maximumYear = getCurrentYear() + 10;

      if (year < 1950 || year > maximumYear) {
        addIssue(
          "yearOfPassing",
          `Year must be between 1950 and ${maximumYear}`,
        );
      }
    }

    /* -------------------------- STUDENT VALIDATION ------------------------- */

    if (data.applicantCategory === "Student") {
      requireField("qualification", "Highest qualification is required");

      requireField("graduationStatus", "Graduation status is required");
    }

    /* ------------------------- SALARIED VALIDATION ------------------------- */

    if (isSalariedCategory(data.applicantCategory)) {
      requireField("company", "Company name is required");

      requireField("designation", "Designation is required");

      requirePositiveAmount(
        "monthlySalary",
        "Monthly salary must be greater than 0",
      );
    }

    /* ------------------------- BUSINESS VALIDATION ------------------------- */

    if (isBusinessCategory(data.applicantCategory)) {
      requireField("businessName", "Business name is required");

      requireField("businessType", "Business type is required");

      requirePositiveAmount(
        "annualTurnover",
        "Annual turnover must be greater than 0",
      );
    }

    /* ---------------------- EDUCATION LOAN VALIDATION ---------------------- */

    if (isEducationLoan(data.loanCategory)) {
      requireField("studyDestination", "Study destination is required");

      requireField("country", "Destination country is required");

      requireField("university", "University / college is required");

      requireField("courseName", "Course name is required");

      requireField("intake", "Intake is required");

      requirePositiveAmount(
        "requiredLoanAmount",
        "Required loan amount must be greater than 0",
      );

      if (
        typeof data.totalCourseCost === "number" &&
        typeof data.ownContribution === "number" &&
        data.ownContribution > data.totalCourseCost
      ) {
        addIssue(
          "ownContribution",
          "Own contribution cannot exceed total course cost",
        );
      }

      if (
        typeof data.totalCourseCost === "number" &&
        typeof data.requiredLoanAmount === "number" &&
        data.requiredLoanAmount > data.totalCourseCost
      ) {
        addIssue(
          "requiredLoanAmount",
          "Required loan amount cannot exceed total course cost",
        );
      }
    }

    /* ----------------------- PERSONAL LOAN VALIDATION ---------------------- */

    if (data.loanCategory === "Personal Loan") {
      requireField("loanPurpose", "Loan purpose is required");

      requirePositiveAmount(
        "requiredLoanAmount",
        "Required loan amount must be greater than 0",
      );

      requirePositiveAmount(
        "monthlySalary",
        "Monthly income must be greater than 0",
      );
    }

    /* ------------------------- HOME LOAN VALIDATION ------------------------ */

    if (data.loanCategory === "Home Loan") {
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

      if (
        typeof data.propertyValue === "number" &&
        typeof data.requiredLoanAmount === "number" &&
        data.requiredLoanAmount > data.propertyValue
      ) {
        addIssue(
          "requiredLoanAmount",
          "Required loan amount cannot exceed property value",
        );
      }

      if (
        typeof data.propertyValue === "number" &&
        typeof data.downPayment === "number" &&
        data.downPayment > data.propertyValue
      ) {
        addIssue("downPayment", "Down payment cannot exceed property value");
      }
    }

    /* ----------------------- BUSINESS LOAN VALIDATION ---------------------- */

    if (data.loanCategory === "Business Loan") {
      requireField("businessName", "Business name is required");

      requireField("loanPurpose", "Loan purpose is required");

      requirePositiveAmount(
        "requiredLoanAmount",
        "Required loan amount must be greater than 0",
      );
    }

    /* ------------------------ CO-APPLICANT CHECKS -------------------------- */

    if (data.coApplicantName || data.coApplicantMobile || data.relationship) {
      requireField("coApplicantName", "Co-applicant name is required");

      requireField("relationship", "Relationship is required");

      requireField(
        "coApplicantMobile",
        "Co-applicant mobile number is required",
      );

      if (data.coApplicantMobile && data.coApplicantMobile === data.mobile) {
        addIssue(
          "coApplicantMobile",
          "Co-applicant mobile must be different from applicant mobile",
        );
      }
    }
  });

type LoanFormValues = z.input<typeof loanFormSchema>;
type LoanFormOutput = z.output<typeof loanFormSchema>;

/* -------------------------------------------------------------------------- */
/*                                  DEFAULTS                                  */
/* -------------------------------------------------------------------------- */

const getCurrentDateTimeLocal = () => {
  const now = new Date();

  const pad = (number: number) => String(number).padStart(2, "0");

  return `${now.getFullYear()}-${pad(
    now.getMonth() + 1,
  )}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const getDefaults = (): LoanFormValues => ({
  fullName: "",
  mobile: "",
  altMobile: "",
  email: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  aadhaar: "",
  pan: "",
  passport: "",
  passportExpireDate: "",
  currentAddress: "",
  permanentAddress: "",
  city: "",
  state: "",
  pin: "",
  enquiryDate: getCurrentDateTimeLocal(),
  leadSource: "",
  branchId: "",
  counselorIds: [],
  fintechAssigneeId: "",
  priority: "Medium",
  nextFollowUp: "",
  remarks: "",
  relationship: "",
  coApplicantName: "",
  coApplicantMobile: "",
  applicantCategory: "Student",
  loanCategory: "Study Abroad Loan",
  qualification: "",
  graduationStatus: "",
  percentage: "",
  yearOfPassing: "",
  currentInstitution: "",
  workExperience: "",
  company: "",
  designation: "",
  employmentType: "",
  employeeId: "",
  totalExperience: "",
  currentCompanyExperience: "",
  monthlySalary: undefined,
  annualIncome: undefined,
  existingEmi: undefined,
  employerAddress: "",
  businessName: "",
  businessType: "",
  registrationType: "",
  registrationNumber: "",
  yearsInBusiness: "",
  annualTurnover: undefined,
  businessAddress: "",
  studyDestination: "",
  country: "",
  university: "",
  courseName: "",
  courseLevel: "",
  courseDuration: "",
  intake: "",
  admissionStatus: "",
  offerLetterReceived: "",
  tuitionFee: undefined,
  livingExpenses: undefined,
  otherExpenses: undefined,
  totalCourseCost: undefined,
  ownContribution: undefined,
  requiredLoanAmount: undefined,
  loanPreference: "",
  collateralAvailable: "",
  loanPurpose: "",
  preferredTenure: undefined,
  cibilScore: undefined,
  propertyType: "",
  propertyLocation: "",
  propertyValue: undefined,
  downPayment: undefined,
});

/* -------------------------------------------------------------------------- */
/*                              SHARED COMPONENTS                             */
/* -------------------------------------------------------------------------- */

function sectionValue(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AccordionItem
      value={sectionValue(title)}
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <AccordionTrigger className="rounded-2xl border-t-4 border-t-primary px-6 py-4 text-left hover:no-underline">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 text-base font-semibold text-foreground sm:text-lg">
            {icon}
            <span>{title}</span>
          </h3>

          {description && (
            <p className="mt-1 text-sm font-normal text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      </AccordionTrigger>

      <AccordionContent className="px-6 pb-6 pt-2">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function Field({
  label,
  required,
  error,
  full,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={full ? "space-y-2 md:col-span-2 lg:col-span-3" : "space-y-2"}
    >
      <Label
        className={
          required
            ? "after:ml-0.5 after:text-destructive after:content-['*']"
            : undefined
        }
      >
        {label}
      </Label>

      {children}

      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  MAIN PAGE                                 */
/* -------------------------------------------------------------------------- */

export default function AddLoanApplicationPage() {
  const router = useRouter();

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [universityOpen, setUniversityOpen] = useState(false);
  const [universitySearch, setUniversitySearch] = useState("");
  const [isCreatingUniversity, setIsCreatingUniversity] = useState(false);
  const branches = user?.branches ?? [];

  const [countries, setCountries] = useState<Country[]>([]);
  const [intakes, setIntakes] = useState<Intake[]>([]);
  const [leadSources, setLeadSources] = useState<LeadSource[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: getDefaults(),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const selectedBranchId = watch("branchId");
  const applicantCategory = watch("applicantCategory");
  const loanCategory = watch("loanCategory");
  const selectedCountryName = watch("country");
  const selectedUniversityName = watch("university");
  const showStudent = applicantCategory === "Student";

  const showSalaried = isSalariedCategory(applicantCategory);

  const showBusiness = isBusinessCategory(applicantCategory);

  const showEducationLoan = isEducationLoan(loanCategory);

  const showCoApplicant =
    showEducationLoan ||
    loanCategory === "Home Loan" ||
    loanCategory === "Business Loan";

  /* ------------------------------------------------------------------------ */
  /*                                  QUERIES                                 */
  /* ------------------------------------------------------------------------ */

  const { data: fintechUsers = [], isLoading: fintechLoading } = useQuery<
    UserOption[]
  >({
    queryKey: ["loan-fintech-users", selectedBranchId],

    enabled: Boolean(selectedBranchId),

    queryFn: async () => {
      const { data } = await axios.get("/api/users", {
        params: {
          branchId: selectedBranchId,
          role: "fintech",
        },
        withCredentials: true,
      });

      return data?.data ?? [];
    },
  });
  const selectedCountry = useMemo(
    () => countries.find((country) => country.name === selectedCountryName),
    [countries, selectedCountryName],
  );

  const { data: universities = [], isLoading: universitiesLoading } = useQuery<
    MasterItem[]
  >({
    queryKey: ["loan-universities"],

    queryFn: async () => {
      const { data } = await axios.get("/api/lead-universities?status=true", {
        withCredentials: true,
      });

      return data?.data ?? [];
    },
  });
  const {
    data: abroadUniversities = [],
    isLoading: abroadUniversitiesLoading,
    isFetching: abroadUniversitiesFetching,
  } = useQuery<AbroadUniversity[]>({
    queryKey: ["abroad-universities", selectedCountry?.id],

    enabled: Boolean(selectedCountry?.id),

    queryFn: async () => {
      const { data } = await axios.get("/api/universities", {
        params: {
          page: 1,
          limit: 100,
          countryId: selectedCountry!.id,
          status: "active",
        },
        withCredentials: true,
      });

      return data?.data ?? [];
    },
  });

  const selectedAbroadUniversity = useMemo(
    () =>
      abroadUniversities.find(
        (university) => university.name === selectedUniversityName,
      ),
    [abroadUniversities, selectedUniversityName],
  );
  const {
    data: universityCourses = [],
    isLoading: universityCoursesLoading,
    isFetching: universityCoursesFetching,
  } = useQuery<UniversityCourse[]>({
    queryKey: ["university-courses", selectedAbroadUniversity?.id],

    enabled: Boolean(selectedAbroadUniversity?.id),

    queryFn: async () => {
      if (!selectedAbroadUniversity?.id) {
        return [];
      }

      const { data } = await axios.get(
        `/api/universities/${selectedAbroadUniversity.id}/courses`,
        {
          params: {
            page: 1,
            limit: 100,
            status: true,
          },
          withCredentials: true,
        },
      );

      return data?.data ?? [];
    },
  });
  const createUniversity = async (name: string) => {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new Error("University name is required");
    }

    const existingUniversity = universities.find(
      (university) =>
        university.name.trim().toLowerCase() === normalizedName.toLowerCase(),
    );

    if (existingUniversity) {
      return existingUniversity;
    }

    const { data } = await axios.post(
      "/api/lead-universities",
      {
        name: normalizedName,
      },
      {
        withCredentials: true,
      },
    );

    await queryClient.invalidateQueries({
      queryKey: ["loan-universities"],
    });

    return data?.data ?? data;
  };
  const { data: courses = [], isLoading: coursesLoading } = useQuery<
    MasterItem[]
  >({
    queryKey: ["loan-courses"],

    queryFn: async () => {
      const { data } = await axios.get("/api/lead-degrees?status=true", {
        withCredentials: true,
      });

      return data?.data ?? [];
    },
  });

  /* ------------------------------------------------------------------------ */
  /*                                  EFFECTS                                 */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    let mounted = true;

    Promise.all([getCountries(), getIntakes(), getLeadSources()])
      .then(([countryData, intakeData, sourceData]) => {
        if (!mounted) {
          return;
        }

        setCountries(countryData);
        setIntakes(intakeData);
        setLeadSources(sourceData);
      })
      .catch(() => {
        if (mounted) {
          toast.error("Failed to load master data");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setValue("counselorIds", []);
    setValue("fintechAssigneeId", "");
  }, [selectedBranchId, setValue]);

  useEffect(() => {
    if (applicantCategory !== "Student") {
      clearErrors(["qualification", "graduationStatus"]);
    }

    if (applicantCategory !== "Salaried") {
      clearErrors(["company", "designation", "monthlySalary"]);
    }

    if (applicantCategory !== "Self Employed") {
      clearErrors(["businessName", "businessType", "annualTurnover"]);
    }
  }, [applicantCategory, clearErrors]);

  useEffect(() => {
    clearErrors([
      "studyDestination",
      "country",
      "university",
      "courseName",
      "intake",
      "loanPurpose",
      "propertyType",
      "propertyLocation",
      "propertyValue",
      "requiredLoanAmount",
    ]);
  }, [loanCategory, clearErrors]);

  /* ------------------------------------------------------------------------ */
  /*                              INPUT HELPERS                               */
  /* ------------------------------------------------------------------------ */

  const getError = useCallback(
    (name: FieldPath<LoanFormValues>) => {
      const fieldError = errors[name as keyof FieldErrors<LoanFormValues>];

      return fieldError?.message?.toString();
    },
    [errors],
  );

  const digitsOnly = useCallback(
    (maxLength?: number) => (event: FormEvent<HTMLInputElement>) => {
      let value = event.currentTarget.value.replace(/\D/g, "");

      if (maxLength) {
        value = value.slice(0, maxLength);
      }

      event.currentTarget.value = value;
    },
    [],
  );

  const decimalOnly = useCallback((event: FormEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value;

    value = value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

    if (value.startsWith(".")) {
      value = `0${value}`;
    }

    event.currentTarget.value = value;
  }, []);

  const preventInvalidNumberKeys = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (["-", "+", "e", "E"].includes(event.key)) {
        event.preventDefault();
      }
    },
    [],
  );

  const panInput = useCallback((event: FormEvent<HTMLInputElement>) => {
    event.currentTarget.value = event.currentTarget.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 10);
  }, []);

  const passportInput = useCallback((event: FormEvent<HTMLInputElement>) => {
    event.currentTarget.value = event.currentTarget.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 8);
  }, []);

  const handleReset = useCallback(() => {
    reset(getDefaults());
    clearErrors();
  }, [reset, clearErrors]);

  /* ------------------------------------------------------------------------ */
  /*                              FIELD COMPONENTS                            */
  /* ------------------------------------------------------------------------ */

  const Text = ({
    name,
    label,
    required,
    type = "text",
    placeholder,
    full,
    maxLength,
    min,
    max,
    step,
    inputMode,
    onInput,
  }: {
    name: FieldPath<LoanFormValues>;
    label: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
    full?: boolean;
    maxLength?: number;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    inputMode?:
      | "text"
      | "numeric"
      | "decimal"
      | "tel"
      | "email"
      | "url"
      | "search";
    onInput?: (event: FormEvent<HTMLInputElement>) => void;
  }) => {
    const isNumberInput = type === "number";

    return (
      <Field
        label={label}
        required={required}
        full={full}
        error={getError(name)}
      >
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={inputMode}
          min={isNumberInput ? (min ?? 0) : min}
          max={max}
          step={step}
          {...register(name)}
          onInput={isNumberInput ? (onInput ?? decimalOnly) : onInput}
          onKeyDown={isNumberInput ? preventInvalidNumberKeys : undefined}
          aria-invalid={Boolean(getError(name))}
          className={
            getError(name)
              ? "border-destructive focus-visible:ring-destructive"
              : undefined
          }
        />
      </Field>
    );
  };

  const Area = ({
    name,
    label,
    required,
    placeholder,
    rows = 3,
    full = true,
  }: {
    name: FieldPath<LoanFormValues>;
    label: string;
    required?: boolean;
    placeholder?: string;
    rows?: number;
    full?: boolean;
  }) => (
    <Field label={label} required={required} full={full} error={getError(name)}>
      <Textarea
        rows={rows}
        placeholder={placeholder}
        {...register(name)}
        aria-invalid={Boolean(getError(name))}
        className={
          getError(name)
            ? "border-destructive focus-visible:ring-destructive"
            : undefined
        }
      />
    </Field>
  );

  const SelectField = ({
    name,
    label,
    options,
    required,
    placeholder = "Select",
    disabled,
    emptyText = "No options found",
  }: {
    name: FieldPath<LoanFormValues>;
    label: string;
    options: Option[];
    required?: boolean;
    placeholder?: string;
    disabled?: boolean;
    emptyText?: string;
  }) => (
    <Field label={label} required={required} error={getError(name)}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            disabled={disabled}
            value={typeof field.value === "string" ? field.value : ""}
            onValueChange={field.onChange}
          >
            <SelectTrigger
              aria-invalid={Boolean(getError(name))}
              className={
                getError(name)
                  ? "border-destructive focus:ring-destructive"
                  : undefined
              }
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent>
              {options.length > 0 ? (
                options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={`empty-${name}`} disabled>
                  {emptyText}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );

  /* ------------------------------------------------------------------------ */
  /*                                  SUBMIT                                  */
  /* ------------------------------------------------------------------------ */

  const onSubmit = async (values: LoanFormValues) => {
    setIsSaving(true);

    try {
      const parsedValues = loanFormSchema.parse(values) as LoanFormOutput;

      const response = await fetch("/api/loan-applications", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedValues),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(
          data?.message || data?.error || "Failed to create loan enquiry",
        );
        return;
      }

      toast.success("Loan enquiry created successfully");

      router.push("/loan-application/all");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error("Please correct the validation errors");
        return;
      }

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create loan enquiry",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* ------------------------------------------------------------------------ */
  /*                                    UI                                    */
  /* ------------------------------------------------------------------------ */

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        <PageHeader
          title="New Loan Enquiry"
          description="Complete the applicant profile. Fields adapt to applicant category and loan type."
        />

        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8"
            noValidate
          >
            <Accordion
              type="multiple"
              defaultValue={[
                "basic-information",
                "applicant-category-loan-category",
                "student-education-background",
                "study-information",
                "financial-requirement",
              ]}
              className="space-y-4"
            >
              {/* BASIC INFORMATION */}

              <Section
                title="Basic Information"
                description="Applicant personal and contact details"
                icon={<MapPin className="h-5 w-5 shrink-0 text-primary" />}
              >
                <SelectField
                  name="branchId"
                  label="Branch"
                  required
                  placeholder="Select Branch"
                  options={branches.map((branch: Branch) => ({
                    value: branch.id,
                    label: branch.name,
                  }))}
                />

                <Text
                  name="enquiryDate"
                  label="Application Date"
                  type="datetime-local"
                />

                <Text
                  name="fullName"
                  label="Full Name"
                  required
                  placeholder="Ramesh Kumar"
                  maxLength={100}
                />

                <Text
                  name="mobile"
                  label="Mobile Number"
                  required
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  inputMode="numeric"
                  onInput={digitsOnly(10)}
                />

                <Text
                  name="altMobile"
                  label="Alternate Mobile"
                  type="tel"
                  placeholder="Optional"
                  maxLength={10}
                  inputMode="numeric"
                  onInput={digitsOnly(10)}
                />

                <Text
                  name="email"
                  label="Email Address"
                  required
                  type="email"
                  placeholder="applicant@example.com"
                />

                <Text
                  name="dob"
                  label="Date of Birth"
                  type="date"
                  max={getTodayString()}
                />

                <SelectField
                  name="gender"
                  label="Gender"
                  options={toOptions(GENDER_OPTIONS)}
                  placeholder="Select Gender"
                />

                <SelectField
                  name="maritalStatus"
                  label="Marital Status"
                  options={toOptions(MARITAL_STATUS_OPTIONS)}
                  placeholder="Select Marital Status"
                />

                <Text
                  name="aadhaar"
                  label="Aadhaar Number"
                  placeholder="12 digit Aadhaar"
                  maxLength={12}
                  inputMode="numeric"
                  onInput={digitsOnly(12)}
                />

                <Text
                  name="pan"
                  label="PAN Number"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  onInput={panInput}
                />

                <Text
                  name="passport"
                  label="Passport Number"
                  placeholder="U1234567"
                  maxLength={8}
                  onInput={passportInput}
                />

                <Text
                  name="passportExpireDate"
                  label="Passport Expiry Date"
                  type="date"
                  min={getTodayString()}
                />

                <Area
                  name="permanentAddress"
                  label="Address"
                  placeholder="Enter complete address"
                />

                <Text name="city" label="City" placeholder="Hyderabad" />

                <Text name="state" label="State" placeholder="Telangana" />

                <Text
                  name="pin"
                  label="PIN Code"
                  placeholder="500001"
                  maxLength={6}
                  inputMode="numeric"
                  onInput={digitsOnly(6)}
                />

                <SelectField
                  name="leadSource"
                  label="Lead Source"
                  options={toOptions(leadSources)}
                  placeholder="Select Source"
                />

                <SelectField
                  name="fintechAssigneeId"
                  label="Fintech Assignee"
                  disabled={!selectedBranchId || fintechLoading}
                  placeholder={
                    !selectedBranchId
                      ? "Select Branch First"
                      : fintechLoading
                        ? "Loading Fintech Users..."
                        : "Assign Fintech"
                  }
                  options={fintechUsers.map((fintechUser) => ({
                    value: fintechUser.id,
                    label: fintechUser.name,
                  }))}
                  emptyText="No fintech users found"
                />

                <Text
                  name="nextFollowUp"
                  label="Next Follow-Up Date"
                  type="date"
                  min={getTodayString()}
                />

                <Area
                  name="remarks"
                  label="Remarks"
                  placeholder="Add remarks or follow-up notes"
                />
              </Section>

              {/* APPLICANT / LOAN CATEGORY */}

              <Section
                title="Applicant Category & Loan Category"
                description="Selecting these dynamically reveals the relevant fields below."
                icon={<UserRound className="h-5 w-5 shrink-0 text-primary" />}
              >
                <SelectField
                  name="applicantCategory"
                  label="Applicant Category"
                  required
                  options={toOptions(APPLICANT_CATEGORIES)}
                  placeholder="Select Applicant Category"
                />

                <SelectField
                  name="loanCategory"
                  label="Loan Category"
                  required
                  options={toOptions(LOAN_CATEGORIES)}
                  placeholder="Select Loan Category"
                />
              </Section>

              {/* SALARIED */}

              {showSalaried && (
                <Section
                  title="Employment Details"
                  icon={<Briefcase className="h-5 w-5 text-blue-500" />}
                >
                  <Text name="company" label="Company Name" required />

                  <Text name="designation" label="Designation" required />

                  <SelectField
                    name="employmentType"
                    label="Employment Type"
                    options={toOptions(EMPLOYMENT_TYPE_OPTIONS)}
                  />

                  <Text name="employeeId" label="Employee ID" />

                  <Text
                    name="totalExperience"
                    label="Total Work Experience"
                    placeholder="e.g. 5 years"
                  />

                  <Text
                    name="currentCompanyExperience"
                    label="Current Company Experience"
                    placeholder="e.g. 2 years"
                  />

                  <Text
                    name="monthlySalary"
                    label="Monthly Salary (₹)"
                    required
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="annualIncome"
                    label="Annual Income (₹)"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="existingEmi"
                    label="Existing EMI (₹)"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                  />

                  <Area name="employerAddress" label="Employer Address" />
                </Section>
              )}

              {/* SELF EMPLOYED */}

              {showBusiness && (
                <Section
                  title="Business Details"
                  icon={<Building2 className="h-5 w-5 text-blue-500" />}
                >
                  <Text name="businessName" label="Business Name" required />

                  <Text name="businessType" label="Business Type" required />

                  <SelectField
                    name="registrationType"
                    label="Registration Type"
                    options={toOptions(REGISTRATION_TYPE_OPTIONS)}
                  />

                  <Text name="registrationNumber" label="Registration Number" />

                  <Text name="yearsInBusiness" label="Years in Business" />

                  <Text
                    name="annualTurnover"
                    label="Annual Turnover (₹)"
                    required
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="annualIncome"
                    label="Annual Income (₹)"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="existingEmi"
                    label="Existing EMI (₹)"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                  />

                  <Area name="businessAddress" label="Business Address" />
                </Section>
              )}

              {/* STUDENT */}

              {showStudent && (
                <Section
                  title="Student / Education Background"
                  icon={<GraduationCap className="h-5 w-5 text-blue-500" />}
                >
                  <SelectField
                    name="qualification"
                    label="Highest Qualification"
                    required
                    disabled={coursesLoading}
                    options={toOptions(courses)}
                    placeholder={
                      coursesLoading ? "Loading Courses..." : "Select Course"
                    }
                  />

                  <Field
                    label="University / College Name"
                    required
                    error={getError("university")}
                  >
                    <Controller
                      control={control}
                      name="university"
                      render={({ field }) => {
                        const normalizedSearch = universitySearch
                          .trim()
                          .toLowerCase();

                        const exactUniversityExists = universities.some(
                          (university) =>
                            university.name.trim().toLowerCase() ===
                            normalizedSearch,
                        );

                        const handleCreateUniversity = async () => {
                          const value = universitySearch.trim();

                          if (
                            !value ||
                            exactUniversityExists ||
                            isCreatingUniversity
                          ) {
                            return;
                          }

                          try {
                            setIsCreatingUniversity(true);

                            await createUniversity(value);

                            field.onChange(value);

                            setUniversitySearch("");
                            setUniversityOpen(false);

                            toast.success("University added successfully");
                          } catch (error) {
                            toast.error(
                              axios.isAxiosError(error)
                                ? error.response?.data?.message ||
                                    error.response?.data?.error ||
                                    "Failed to create university"
                                : error instanceof Error
                                  ? error.message
                                  : "Failed to create university",
                            );
                          } finally {
                            setIsCreatingUniversity(false);
                          }
                        };

                        return (
                          <Popover
                            open={universityOpen}
                            onOpenChange={(open) => {
                              setUniversityOpen(open);

                              if (!open) {
                                setUniversitySearch("");
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                role="combobox"
                                aria-expanded={universityOpen}
                                disabled={
                                  universitiesLoading || isCreatingUniversity
                                }
                                className={cn(
                                  "w-full justify-between font-normal",
                                  !field.value && "text-muted-foreground",
                                  getError("university") &&
                                    "border-destructive focus-visible:ring-destructive",
                                )}
                              >
                                <span className="truncate">
                                  {universitiesLoading
                                    ? "Loading Universities..."
                                    : typeof field.value === "string" &&
                                        field.value
                                      ? field.value
                                      : "Select or Type University"}
                                </span>

                                {universitiesLoading || isCreatingUniversity ? (
                                  <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                                ) : (
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                )}
                              </Button>
                            </PopoverTrigger>

                            <PopoverContent
                              align="start"
                              className="w-[var(--radix-popover-trigger-width)] p-0"
                            >
                              <Command shouldFilter>
                                <CommandInput
                                  placeholder="Search or type university..."
                                  value={universitySearch}
                                  onValueChange={setUniversitySearch}
                                />

                                <CommandList>
                                  <CommandEmpty>
                                    {universitySearch.trim() ? (
                                      exactUniversityExists ? (
                                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                          University already exists
                                        </div>
                                      ) : (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          disabled={isCreatingUniversity}
                                          className="h-auto w-full justify-start rounded-none px-3 py-3"
                                          onClick={handleCreateUniversity}
                                        >
                                          {isCreatingUniversity ? (
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                          ) : (
                                            <Plus className="mr-2 h-4 w-4" />
                                          )}

                                          <span className="min-w-0 truncate">
                                            Add &quot;{universitySearch.trim()}
                                            &quot;
                                          </span>
                                        </Button>
                                      )
                                    ) : (
                                      <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                        Type a university name to search
                                      </div>
                                    )}
                                  </CommandEmpty>

                                  <CommandGroup>
                                    {universities.map((university) => (
                                      <CommandItem
                                        key={university.id}
                                        value={university.name}
                                        onSelect={() => {
                                          field.onChange(university.name);

                                          setUniversitySearch("");
                                          setUniversityOpen(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4 shrink-0",
                                            field.value === university.name
                                              ? "opacity-100"
                                              : "opacity-0",
                                          )}
                                        />

                                        <span className="truncate">
                                          {university.name}
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        );
                      }}
                    />
                  </Field>

                  <SelectField
                    name="graduationStatus"
                    label="Graduation Status"
                    required
                    options={toOptions(GRADUATION_STATUS_OPTIONS)}
                    placeholder="Select Graduation Status"
                  />

                  <Text
                    name="percentage"
                    label="Percentage / CGPA"
                    placeholder="75% / 8.2 CGPA"
                    maxLength={20}
                  />

                  <Text
                    name="yearOfPassing"
                    label="Year of Passing"
                    placeholder="2026"
                    maxLength={4}
                    inputMode="numeric"
                    onInput={digitsOnly(4)}
                  />

                  <Text
                    name="workExperience"
                    label="Work Experience"
                    placeholder="e.g. 2 years"
                  />
                </Section>
              )}

              {/* EDUCATION LOAN */}
              {showEducationLoan && (
                <>
                  <Section
                    title="Study Information"
                    icon={<GraduationCap className="h-5 w-5 text-blue-500" />}
                  >
                    <SelectField
                      name="studyDestination"
                      label="Study Destination"
                      required
                      options={toOptions(STUDY_DESTINATION_OPTIONS)}
                    />

                    <SelectField
                      name="country"
                      label="Destination Country"
                      required
                      options={toOptions(countries)}
                      placeholder="Select Country"
                    />

                    <SelectField
                      name="university"
                      label="Abroad University Name"
                      required
                      disabled={
                        !selectedCountry?.id ||
                        abroadUniversitiesLoading ||
                        abroadUniversitiesFetching
                      }
                      options={abroadUniversities.map((university) => ({
                        value: university.name,
                        label: university.name,
                      }))}
                      placeholder={
                        !selectedCountry?.id
                          ? "Select Destination Country First"
                          : abroadUniversitiesLoading ||
                              abroadUniversitiesFetching
                            ? "Loading Universities..."
                            : abroadUniversities.length === 0
                              ? "No Universities Found"
                              : "Select University"
                      }
                      emptyText="No universities available for selected country"
                    />

                    <SelectField
                      name="courseName"
                      label="Course Name"
                      required
                      disabled={
                        !selectedAbroadUniversity?.id ||
                        universityCoursesLoading ||
                        universityCoursesFetching
                      }
                      options={universityCourses.map((course) => ({
                        value: course.name,
                        label: course.name,
                      }))}
                      placeholder={
                        !selectedAbroadUniversity?.id
                          ? "Select University First"
                          : universityCoursesLoading ||
                              universityCoursesFetching
                            ? "Loading Courses..."
                            : universityCourses.length === 0
                              ? "No Courses Found"
                              : "Select Course"
                      }
                      emptyText="No courses available for selected university"
                    />

                    <SelectField
                      name="courseLevel"
                      label="Course Level"
                      options={toOptions(COURSE_LEVEL_OPTIONS)}
                    />

                    <Text
                      name="courseDuration"
                      label="Course Duration"
                      placeholder="e.g. 2 years"
                    />

                    <SelectField
                      name="intake"
                      label="Intake"
                      required
                      options={toOptions(intakes)}
                      placeholder="Select Intake"
                    />

                    <SelectField
                      name="admissionStatus"
                      label="Admission Status"
                      options={toOptions(ADMISSION_STATUS_OPTIONS)}
                    />

                    <SelectField
                      name="offerLetterReceived"
                      label="Offer Status"
                      options={toOptions(OFFER_LETTER_OPTIONS)}
                    />
                  </Section>

                  <Section
                    title="Financial Requirement"
                    icon={<IndianRupee className="h-5 w-5 text-emerald-500" />}
                  >
                    <Text
                      name="tuitionFee"
                      label="Tuition Fee (₹)"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                    />

                    <Text
                      name="livingExpenses"
                      label="Living Expenses (₹)"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                    />

                    <Text
                      name="otherExpenses"
                      label="Other Expenses (₹)"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                    />

                    <Text
                      name="totalCourseCost"
                      label="Total Course Cost (₹)"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                    />

                    <Text
                      name="ownContribution"
                      label="Own Contribution (₹)"
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                    />

                    <Text
                      name="requiredLoanAmount"
                      label="Required Loan Amount (₹)"
                      required
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="0.01"
                    />

                    <SelectField
                      name="loanPreference"
                      label="Loan Preference"
                      options={toOptions(LOAN_PREFERENCE_OPTIONS)}
                    />

                    <SelectField
                      name="collateralAvailable"
                      label="Collateral Available"
                      options={toOptions(YES_NO_OPTIONS)}
                    />
                  </Section>
                </>
              )}
              {/* PERSONAL LOAN */}

              {loanCategory === "Personal Loan" && (
                <Section
                  title="Personal Loan Requirement"
                  icon={<CreditCard className="h-5 w-5 text-purple-500" />}
                >
                  <Text name="loanPurpose" label="Loan Purpose" required />

                  <Text
                    name="requiredLoanAmount"
                    label="Required Loan Amount (₹)"
                    required
                    type="number"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="monthlySalary"
                    label="Monthly Income (₹)"
                    required
                    type="number"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="existingEmi"
                    label="Existing EMI (₹)"
                    type="number"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="preferredTenure"
                    label="Preferred Tenure (months)"
                    type="number"
                    min={0}
                    step={1}
                  />

                  <Text
                    name="cibilScore"
                    label="CIBIL Score"
                    type="number"
                    min={300}
                    max={900}
                    step={1}
                  />
                </Section>
              )}

              {/* HOME LOAN */}

              {loanCategory === "Home Loan" && (
                <Section
                  title="Home Loan Requirement"
                  icon={<Home className="h-5 w-5 text-emerald-500" />}
                >
                  <Text name="propertyType" label="Property Type" required />

                  <Text
                    name="propertyLocation"
                    label="Property Location"
                    required
                  />

                  <Text
                    name="propertyValue"
                    label="Property Value (₹)"
                    required
                    type="number"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="requiredLoanAmount"
                    label="Required Loan Amount (₹)"
                    required
                    type="number"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="downPayment"
                    label="Down Payment (₹)"
                    type="number"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="existingEmi"
                    label="Existing EMI (₹)"
                    type="number"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="preferredTenure"
                    label="Preferred Tenure (months)"
                    type="number"
                    min={0}
                    step={1}
                  />

                  <Text
                    name="cibilScore"
                    label="CIBIL Score"
                    type="number"
                    min={300}
                    max={900}
                    step={1}
                  />
                </Section>
              )}

              {/* BUSINESS LOAN */}

              {loanCategory === "Business Loan" && (
                <Section
                  title="Business Loan Requirement"
                  icon={<Building2 className="h-5 w-5 text-blue-500" />}
                >
                  <Text name="businessName" label="Business Name" required />

                  <Text name="businessType" label="Business Type" />

                  <Text name="yearsInBusiness" label="Years in Business" />

                  <Text
                    name="annualTurnover"
                    label="Annual Turnover (₹)"
                    type="number"
                    min={0}
                    step="0.01"
                  />

                  <Text
                    name="requiredLoanAmount"
                    label="Required Loan Amount (₹)"
                    required
                    type="number"
                    min={0}
                    step="0.01"
                  />

                  <Text name="loanPurpose" label="Loan Purpose" required />

                  <Text
                    name="cibilScore"
                    label="CIBIL Score"
                    type="number"
                    min={300}
                    max={900}
                    step={1}
                  />
                </Section>
              )}

              {/* CO APPLICANT */}

              {showCoApplicant && (
                <Section
                  title="Co-Applicant (Optional at enquiry stage)"
                  description="If you enter any co-applicant information, all required co-applicant details must be completed."
                  icon={<Users className="h-5 w-5 text-primary" />}
                >
                  <Text
                    name="coApplicantName"
                    label="Co-Applicant Name"
                    placeholder="Enter co-applicant name"
                  />

                  <SelectField
                    name="relationship"
                    label="Relationship"
                    options={toOptions(RELATIONSHIP_OPTIONS)}
                    placeholder="Select Relationship"
                  />

                  <Text
                    name="coApplicantMobile"
                    label="Mobile Number"
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    inputMode="numeric"
                    onInput={digitsOnly(10)}
                  />
                </Section>
              )}

              {/* ACTIONS */}

              <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl border bg-background/90 p-4 shadow-lg backdrop-blur-md sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving || isSubmitting}
                  onClick={handleReset}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset Form
                </Button>

                <Button type="submit" disabled={isSaving || isSubmitting}>
                  {isSaving || isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Enquiry...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit Enquiry
                    </>
                  )}
                </Button>
              </div>
            </Accordion>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
