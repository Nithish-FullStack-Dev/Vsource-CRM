// app/(dashboard)/loan-application/add/page.tsx
"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { z } from "zod";
import { Controller, type FieldPath, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { Briefcase, Building2, CreditCard, GraduationCap, Home, IndianRupee, Loader2, MapPin, RotateCcw, Send, UserRound, Users,} from "lucide-react";

import { PageHeader, PageTransition } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger,} from "@/components/ui/accordion";
import { useAuth } from "@/store";
import { Branch } from "@/lib/branches";
import { Country, Intake, LeadSource, getCountries, getIntakes, getLeadSources,} from "@/lib/master-settings";

const APPLICANT_CATEGORIES = ["Student", "Salaried", "Self Employed"] as const;

const LOAN_CATEGORIES = [
  "Study Abroad Loan",
  "Domestic Education Loan",
  "Personal Loan",
  "Home Loan",
  "Business Loan",
  "CIBIL Issue / Financial Consultation",
  "Loan Against Property",
  "Other",
] as const;


const CIBIL_CONCERN_TYPES = [
  "Home Loan",
  "Personal Loan",
  "Consumer Loan",
  "Auto Loan",
  "Education Loan",
  "Business Loan",
  "Credit Card",
  "Loan Settlement",
  "Written-Off Account",
  "Overdue Account",
  "Incorrect CIBIL Entry",
  "Multiple Loan Enquiries",
  "Other",
] as const;

const EDUCATION_LOANS = ["Study Abroad Loan", "Domestic Education Loan"];
const SALARIED_CATEGORIES = ["Salaried"];
const BUSINESS_CATEGORIES = ["Self Employed"];

type Option = { value: string; label: string };
type UserOption = { id: string; name: string; email?: string };
type MasterItem = { id: string; name: string };

const isEducationLoan = (loan?: string) => Boolean(loan && EDUCATION_LOANS.includes(loan));
const isSalariedCategory = (cat?: string) => Boolean(cat && SALARIED_CATEGORIES.includes(cat));
const isBusinessCategory = (cat?: string) => Boolean(cat && BUSINESS_CATEGORIES.includes(cat));

const toOptions = (items: readonly string[] | MasterItem[]): Option[] =>
  items.map((item) =>
    typeof item === "string"
      ? { value: item, label: item }
      : { value: item.name, label: item.name },
  );

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined || Number.isNaN(value)) return undefined;
  return Number(value);
}, z.number().finite("Enter a valid number").nonnegative("Cannot be negative").optional());

const optionalCibil = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined || Number.isNaN(value)) return undefined;
  return Number(value);
}, z.number().int("Enter a valid CIBIL score").min(300, "CIBIL must be at least 300").max(900, "CIBIL cannot exceed 900").optional());

const optionalPattern = (regex: RegExp, message: string) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.string().regex(regex, message).optional(),
  );

const loanFormSchema = z
  .object({
    fullName: z.string().trim().min(2, "Full name is required"),
    mobile: z.string().regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
    altMobile: optionalPattern(/^[0-9]{10}$/, "Enter a valid 10-digit alternate mobile number"),
    email: z.string().trim().min(1, "Email is required").email("Invalid email address"),
    dob: z.string().optional(),
    gender: z.string().optional(),
    maritalStatus: z.string().optional(),
    aadhaar: optionalPattern(/^[0-9]{12}$/, "Aadhaar must be 12 digits"),
    pan: optionalPattern(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Enter a valid PAN number"),
    passport: z.string().trim().optional(),
    passportExpireDate: z.string().optional(),
    currentAddress: z.string().trim().optional(),
    permanentAddress: z.string().trim().optional(),
    city: z.string().trim().optional(),
    state: z.string().trim().optional(),
    pin: optionalPattern(/^[0-9]{6}$/, "PIN code must be 6 digits"),
    enquiryDate: z.string().optional(),
    leadSource: z.string().optional(),
    branchId: z.string().min(1, "Branch is required"),
    counselorIds: z.array(z.string()).optional(),
    fintechAssigneeId: z.string().optional(),
    priority: z.string().optional(),
    nextFollowUp: z.string().optional(),
    remarks: z.string().trim().optional(),

    applicantCategory: z.string().min(1, "Applicant category is required"),
    loanCategory: z.string().min(1, "Loan category is required"),

    qualification: z.string().trim().optional(),
    graduationStatus: z.string().optional(),
    percentage: z.string().trim().optional(),
    yearOfPassing: optionalPattern(/^[0-9]{4}$/, "Enter a valid 4-digit year"),
    currentInstitution: z.string().trim().optional(),
    workExperience: z.string().trim().optional(),

    company: z.string().trim().optional(),
    designation: z.string().trim().optional(),
    employmentType: z.string().optional(),
    employeeId: z.string().trim().optional(),
    totalExperience: z.string().trim().optional(),
    currentCompanyExperience: z.string().trim().optional(),
    monthlySalary: optionalNumber,
    annualIncome: optionalNumber,
    existingEmi: optionalNumber,
    employerAddress: z.string().trim().optional(),

    businessName: z.string().trim().optional(),
    businessType: z.string().trim().optional(),
    registrationType: z.string().optional(),
    registrationNumber: z.string().trim().optional(),
    yearsInBusiness: z.string().trim().optional(),
    annualTurnover: optionalNumber,
    businessAddress: z.string().trim().optional(),

    studyDestination: z.string().optional(),
    country: z.string().trim().optional(),
    university: z.string().trim().optional(),
    courseName: z.string().trim().optional(),
    courseLevel: z.string().optional(),
    courseDuration: z.string().trim().optional(),
    intake: z.string().trim().optional(),
    admissionStatus: z.string().optional(),
    offerLetterReceived: z.string().optional(),

    tuitionFee: optionalNumber,
    livingExpenses: optionalNumber,
    otherExpenses: optionalNumber,
    totalCourseCost: optionalNumber,
    ownContribution: optionalNumber,
    requiredLoanAmount: optionalNumber,
    loanPreference: z.string().optional(),
    collateralAvailable: z.string().optional(),

    loanPurpose: z.string().trim().optional(),
    preferredTenure: optionalNumber,
    cibilScore: optionalCibil,
    propertyType: z.string().trim().optional(),
    propertyLocation: z.string().trim().optional(),
    propertyValue: optionalNumber,
    downPayment: optionalNumber,
  })
  .superRefine((data, ctx) => {
    const blank = (value: unknown) =>
      value === undefined || value === null || (typeof value === "string" && !value.trim());

    const add = (path: keyof typeof data, message: string) =>
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });

    const need = (path: keyof typeof data, message: string) => {
      if (blank(data[path])) add(path, message);
    };

    const needAmount = (path: keyof typeof data, message: string) => {
      const value = data[path];
      if (typeof value !== "number" || value <= 0) add(path, message);
    };

    if (data.applicantCategory === "Student") {
      need("qualification", "Highest qualification is required");
      need("graduationStatus", "Graduation status is required");
    }

    if (isSalariedCategory(data.applicantCategory)) {
      need("company", "Company name is required");
      need("designation", "Designation is required");
      needAmount("monthlySalary", "Monthly salary is required");
    }

    if (isBusinessCategory(data.applicantCategory)) {
      need("businessName", "Business name is required");
      need("businessType", "Business type is required");
      needAmount("annualTurnover", "Annual turnover is required");
    }

    if (isEducationLoan(data.loanCategory)) {
      need("studyDestination", "Study destination is required");
      need("country", "Country is required");
      need("university", "University / college name is required");
      need("courseName", "Course name is required");
      need("intake", "Intake is required");
      needAmount("requiredLoanAmount", "Required loan amount is required");
    }

    if (data.loanCategory === "Personal Loan") {
      need("loanPurpose", "Loan purpose is required");
      needAmount("requiredLoanAmount", "Required loan amount is required");
      needAmount("monthlySalary", "Monthly income is required");
    }

    if (data.loanCategory === "Home Loan") {
      need("propertyType", "Property type is required");
      need("propertyLocation", "Property location is required");
      needAmount("propertyValue", "Property value is required");
      needAmount("requiredLoanAmount", "Required loan amount is required");
    }

    if (data.loanCategory === "Business Loan") {
      need("businessName", "Business name is required");
      need("loanPurpose", "Loan purpose is required");
      needAmount("requiredLoanAmount", "Required loan amount is required");
    }

    if (data.loanCategory === "Loan Against Property") {
      need("propertyType", "Property type is required");
      need("propertyLocation", "Property location is required");
      needAmount("propertyValue", "Property value is required");
      needAmount("requiredLoanAmount", "Required loan amount is required");
    }

    if (data.loanCategory === "CIBIL Issue / Financial Consultation") {
      need("loanPurpose", "CIBIL concern type is required");
      if (typeof data.cibilScore !== "number") add("cibilScore", "Current CIBIL score is required");
      need("remarks", "Issue description is required");
    }

    if (data.loanCategory === "Other") {
      need("loanPurpose", "Loan purpose is required");
      needAmount("requiredLoanAmount", "Required loan amount is required");
    }
  });

type LoanFormValues = z.input<typeof loanFormSchema>;

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}`;
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

function sectionValue(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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
    <AccordionItem value={sectionValue(title)} className="rounded-2xl border bg-card">
      <AccordionTrigger className="overflow-hidden border-t-4 border-t-primary rounded-2xl shadow-sm hover:no-underline">
        <div className="px-6 py-4 text-left">
          <h3 className="flex items-center text-lg font-semibold text-foreground">
            {icon && <span className="mr-2 flex h-5 w-5 items-center justify-center">{icon}</span>}
            {title}
          </h3>
          {description && <p className="mt-1 text-sm font-normal text-muted-foreground">{description}</p>}
        </div>
      </AccordionTrigger>
      <AccordionContent className="p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">{children}</div>
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
    <div className={full ? "space-y-2 md:col-span-2 lg:col-span-3" : "space-y-2"}>
      <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : undefined}>
        {label}
      </Label>
      {children}
      {error && <p className="text-sm font-medium text-destructive">{error}</p>}
    </div>
  );
}

export default function AddLoanApplicationPage() {
  const { user } = useAuth();
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
    formState: { errors, isSubmitting },
  } = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: getDefaults(),
  });

  const selectedBranchId = watch("branchId");
  const applicantCategory = watch("applicantCategory");
  const loanCategory = watch("loanCategory");

  const showStudent = applicantCategory === "Student";
  const showSalaried = isSalariedCategory(applicantCategory);
  const showBusiness = isBusinessCategory(applicantCategory);
  const showEducationLoan = isEducationLoan(loanCategory);
  const showCoApplicant =
    showEducationLoan ||
    loanCategory === "Home Loan" ||
    loanCategory === "Business Loan" ||
    loanCategory === "Loan Against Property";

  const { data: counselors = [], isLoading: counselorsLoading } = useQuery<UserOption[]>({
    queryKey: ["loan-counselors", selectedBranchId],
    enabled: Boolean(selectedBranchId),
    queryFn: async () => {
      const { data } = await axios.get(`/api/users`, {
        params: { branchId: selectedBranchId, role: "counsellor" },
        withCredentials: true,
      });
      return data?.data ?? [];
    },
  });

  const { data: fintechUsers = [], isLoading: fintechLoading } = useQuery<UserOption[]>({
    queryKey: ["loan-fintech-users", selectedBranchId],
    enabled: Boolean(selectedBranchId),
    queryFn: async () => {
      const { data } = await axios.get(`/api/users`, {
        params: { branchId: selectedBranchId, role: "fintech" },
        withCredentials: true,
      });
      return data?.data ?? [];
    },
  });

  const { data: universities = [], isLoading: universitiesLoading } = useQuery<MasterItem[]>({
    queryKey: ["loan-universities"],
    queryFn: async () => {
      const { data } = await axios.get(`/api/lead-universities?status=true`, {
        withCredentials: true,
      });
      return data?.data ?? [];
    },
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery<MasterItem[]>({
    queryKey: ["loan-courses"],
    queryFn: async () => {
      const { data } = await axios.get(`/api/lead-degrees?status=true`, {
        withCredentials: true,
      });
      return data?.data ?? [];
    },
  });

  useEffect(() => {
    Promise.all([getCountries(), getIntakes(), getLeadSources()])
      .then(([countryData, intakeData, sourceData]) => {
        setCountries(countryData);
        setIntakes(intakeData);
        setLeadSources(sourceData);
      })
      .catch(() => toast.error("Failed to load master data"));
  }, []);

  useEffect(() => {
    setValue("counselorIds", []);
    setValue("fintechAssigneeId", "");
  }, [selectedBranchId, setValue]);

  const error = (name: FieldPath<LoanFormValues>) =>
    errors[name as keyof typeof errors]?.message?.toString();

  const digitsOnly =
    (max?: number) =>
    (event: FormEvent<HTMLInputElement>) => {
      event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, max);
    };

  const panInput = (event: FormEvent<HTMLInputElement>) => {
    event.currentTarget.value = event.currentTarget.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  };

  const Text = ({
    name,
    label,
    required,
    type = "text",
    placeholder,
    full,
    maxLength,
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
    inputMode?: "text" | "numeric" | "decimal" | "tel" | "email" | "url" | "search";
    onInput?: (event: FormEvent<HTMLInputElement>) => void;
  }) => (
    <Field label={label} required={required} full={full} error={error(name)}>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        maxLength={maxLength}
        inputMode={inputMode}
        {...register(name)}
        onInput={onInput}
      />
    </Field>
  );

  const Area = ({
    name,
    label,
    required,
    placeholder,
    rows = 2,
    full = true,
  }: {
    name: FieldPath<LoanFormValues>;
    label: string;
    required?: boolean;
    placeholder?: string;
    rows?: number;
    full?: boolean;
  }) => (
    <Field label={label} required={required} full={full} error={error(name)}>
      <Textarea rows={rows} placeholder={placeholder} {...register(name)} />
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
    <Field label={label} required={required} error={error(name)}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select disabled={disabled} value={(field.value as string) ?? ""} onValueChange={field.onChange}>
            <SelectTrigger>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.length ? (
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

  const onSubmit = async (values: LoanFormValues) => {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/loan-applications`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data?.message || data?.error || "Failed to create loan enquiry");
        return;
      }

      toast.success("Loan enquiry created successfully");
      reset(getDefaults());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create loan enquiry");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto max-w-6xl space-y-6 pb-12">
        <PageHeader
          title="New Loan Enquiry"
          description="Complete the applicant profile. Fields adapt to applicant category and loan type."
        />

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
              <Section
                title="Basic Information"
                description="Applicant personal and contact details"
                icon={<MapPin className="h-5 w-5 text-primary" />}
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

                <Text name="enquiryDate" label="Application Date" type="datetime-local" />
                <Text name="fullName" label="Full Name" required placeholder="Ramesh Kumar" />
                <Text
                  name="mobile"
                  label="Mobile Number"
                  required
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  inputMode="tel"
                  onInput={digitsOnly(10)}
                />
                <Text
                  name="altMobile"
                  label="Alternate Mobile"
                  type="tel"
                  placeholder="Optional"
                  maxLength={10}
                  inputMode="tel"
                  onInput={digitsOnly(10)}
                />
                <Text name="email" label="Email Address" required type="email" placeholder="applicant@example.com" />
                <Text name="dob" label="Date of Birth" type="date" />

                <SelectField
                  name="gender"
                  label="Gender"
                  options={toOptions(["Male", "Female", "Other"])}
                  placeholder="Select Gender"
                />

                <SelectField
                  name="maritalStatus"
                  label="Marital Status"
                  options={toOptions(["Single", "Married", "Divorced", "Widowed"])}
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
                <Text name="pan" label="PAN Number" placeholder="ABCDE1234F" maxLength={10} onInput={panInput} />
                <Text name="passport" label="Passport Number" placeholder="U12345678" />
                <Text name="passportExpireDate" label="Passport Expiry Date" type="date" />

                <Area name="permanentAddress" label="Address" placeholder="Enter address" />

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

                <Field label="Assigned Counsellor" error={error("counselorIds")}>
                  <Controller
                    control={control}
                    name="counselorIds"
                    render={({ field }) => (
                      <Select
                        disabled={!selectedBranchId || counselorsLoading}
                        value={field.value?.[0] ?? ""}
                        onValueChange={(value) => field.onChange([value])}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedBranchId
                                ? "Select Branch First"
                                : counselorsLoading
                                  ? "Loading Counsellors..."
                                  : "Select Counsellor"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {counselors.length ? (
                            counselors.map((user) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-counsellor" disabled>
                              No counsellors found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </Field>

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
                  options={fintechUsers.map((user) => ({
                    value: user.id,
                    label: user.name,
                  }))}
                  emptyText="No fintech users found"
                />

                <Text name="nextFollowUp" label="Next Follow-Up Date" type="date" />
                <Area name="remarks" label="Remarks" placeholder="Add remarks or follow-up notes" />
              </Section>

              <Section
                title="Applicant Category & Loan Category"
                description="Selecting these dynamically reveals the relevant fields below."
                icon={<UserRound className="h-5 w-5 text-primary" />}
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

              {showStudent && (
                <Section
                  title="Student / Education Background"
                  icon={<GraduationCap className="h-5 w-5 text-blue-500" />}
                >
                  <Text name="qualification" label="Highest Qualification" required placeholder="B.Tech / B.Com / MBA" />
                  <SelectField
                    name="graduationStatus"
                    label="Graduation Status"
                    required
                    options={toOptions(["Pursuing", "Completed", "Discontinued"])}
                    placeholder="Select Graduation Status"
                  />
                  <Text name="percentage" label="Percentage / CGPA" placeholder="75% / 8.2 CGPA" />
                  <Text
                    name="yearOfPassing"
                    label="Year of Passing"
                    placeholder="2026"
                    maxLength={4}
                    inputMode="numeric"
                    onInput={digitsOnly(4)}
                  />
                  <Text name="currentInstitution" label="Current Institution" placeholder="Institution name" />
                  <Text name="workExperience" label="Work Experience" placeholder="e.g. 2 years" />
                </Section>
              )}

              {showSalaried && (
                <Section title="Employment Details" icon={<Briefcase className="h-5 w-5 text-blue-500" />}>
                  <Text name="company" label="Company Name" required />
                  <Text name="designation" label="Designation" required />
                  <SelectField
                    name="employmentType"
                    label="Employment Type"
                    options={toOptions(["Permanent", "Contract", "Probation"])}
                  />
                  <Text name="employeeId" label="Employee ID" />
                  <Text name="totalExperience" label="Total Work Experience" placeholder="e.g. 5 years" />
                  <Text name="currentCompanyExperience" label="Current Company Experience" placeholder="e.g. 2 years" />
                  <Text name="monthlySalary" label="Monthly Salary (₹)" required type="number" inputMode="decimal" />
                  <Text name="annualIncome" label="Annual Income (₹)" type="number" inputMode="decimal" />
                  <Text name="existingEmi" label="Existing EMI (₹)" type="number" inputMode="decimal" />
                  <Area name="employerAddress" label="Employer Address" />
                </Section>
              )}

              {showBusiness && (
                <Section title="Business Details" icon={<Building2 className="h-5 w-5 text-blue-500" />}>
                  <Text name="businessName" label="Business Name" required />
                  <Text name="businessType" label="Business Type" required />
                  <SelectField
                    name="registrationType"
                    label="Registration Type"
                    options={toOptions(["Proprietorship", "Partnership", "LLP", "Private Limited", "Public Limited"])}
                  />
                  <Text name="registrationNumber" label="Registration Number" />
                  <Text name="yearsInBusiness" label="Years in Business" />
                  <Text name="annualTurnover" label="Annual Turnover (₹)" required type="number" inputMode="decimal" />
                  <Text name="annualIncome" label="Annual Income (₹)" type="number" inputMode="decimal" />
                  <Text name="existingEmi" label="Existing EMI (₹)" type="number" inputMode="decimal" />
                  <Area name="businessAddress" label="Business Address" />
                </Section>
              )}

              {showEducationLoan && (
                <>
                  <Section title="Study Information" icon={<GraduationCap className="h-5 w-5 text-blue-500" />}>
                    <SelectField
                      name="studyDestination"
                      label="Study Destination"
                      required
                      options={toOptions(["Abroad", "Domestic"])}
                    />
                    <SelectField
                      name="country"
                      label="Country"
                      required
                      options={toOptions(countries)}
                      placeholder="Select Country"
                    />
                    <SelectField
                      name="university"
                      label="University / College Name"
                      required
                      disabled={universitiesLoading}
                      options={toOptions(universities)}
                      placeholder={universitiesLoading ? "Loading Universities..." : "Select University"}
                    />
                    <SelectField
                      name="courseName"
                      label="Course Name"
                      required
                      disabled={coursesLoading}
                      options={toOptions(courses)}
                      placeholder={coursesLoading ? "Loading Courses..." : "Select Course"}
                    />
                    <SelectField
                      name="courseLevel"
                      label="Course Level"
                      options={toOptions(["Undergraduate", "Postgraduate", "PhD", "Diploma", "MBBS"])}
                    />
                    <Text name="courseDuration" label="Course Duration" placeholder="e.g. 2 years" />
                    <SelectField name="intake" label="Intake" required options={toOptions(intakes)} placeholder="Select Intake" />
                    <SelectField
                      name="admissionStatus"
                      label="Admission Status"
                      options={toOptions(["Applied", "Offer Received", "Confirmed", "Not Applied"])}
                    />
                    <SelectField
                      name="offerLetterReceived"
                      label="Offer Letter Received"
                      options={toOptions(["Yes", "No", "Conditional"])}
                    />
                  </Section>

                  <Section title="Financial Requirement" icon={<IndianRupee className="h-5 w-5 text-emerald-500" />}>
                    <Text name="tuitionFee" label="Tuition Fee (₹)" type="number" inputMode="decimal" />
                    <Text name="livingExpenses" label="Living Expenses (₹)" type="number" inputMode="decimal" />
                    <Text name="otherExpenses" label="Other Expenses (₹)" type="number" inputMode="decimal" />
                    <Text name="totalCourseCost" label="Total Course Cost (₹)" type="number" inputMode="decimal" />
                    <Text name="ownContribution" label="Own Contribution (₹)" type="number" inputMode="decimal" />
                    <Text
                      name="requiredLoanAmount"
                      label="Required Loan Amount (₹)"
                      required
                      type="number"
                      inputMode="decimal"
                    />
                    <SelectField
                      name="loanPreference"
                      label="Loan Preference"
                      options={toOptions(["Secured", "Unsecured", "Either"])}
                    />
                    <SelectField
                      name="collateralAvailable"
                      label="Collateral Available"
                      options={toOptions(["Yes", "No"])}
                    />
                  </Section>
                </>
              )}

              {loanCategory === "Personal Loan" && (
                <Section title="Personal Loan Requirement" icon={<CreditCard className="h-5 w-5 text-purple-500" />}>
                  <Text name="loanPurpose" label="Loan Purpose" required />
                  <Text name="requiredLoanAmount" label="Required Loan Amount (₹)" required type="number" />
                  <Text name="monthlySalary" label="Monthly Income (₹)" required type="number" />
                  <Text name="existingEmi" label="Existing EMI (₹)" type="number" />
                  <Text name="preferredTenure" label="Preferred Tenure (months)" type="number" />
                  <Text name="cibilScore" label="CIBIL Score" type="number" />
                </Section>
              )}

              {loanCategory === "Home Loan" && (
                <Section title="Home Loan Requirement" icon={<Home className="h-5 w-5 text-emerald-500" />}>
                  <Text name="propertyType" label="Property Type" required />
                  <Text name="propertyLocation" label="Property Location" required />
                  <Text name="propertyValue" label="Property Value (₹)" required type="number" />
                  <Text name="requiredLoanAmount" label="Required Loan Amount (₹)" required type="number" />
                  <Text name="downPayment" label="Down Payment (₹)" type="number" />
                  <Text name="existingEmi" label="Existing EMI (₹)" type="number" />
                  <Text name="preferredTenure" label="Preferred Tenure (months)" type="number" />
                  <Text name="cibilScore" label="CIBIL Score" type="number" />
                </Section>
              )}

              {loanCategory === "Business Loan" && (
                <Section title="Business Loan Requirement" icon={<Building2 className="h-5 w-5 text-blue-500" />}>
                  <Text name="businessName" label="Business Name" required />
                  <Text name="businessType" label="Business Type" />
                  <Text name="yearsInBusiness" label="Years in Business" />
                  <Text name="annualTurnover" label="Annual Turnover (₹)" type="number" />
                  <Text name="requiredLoanAmount" label="Required Loan Amount (₹)" required type="number" />
                  <Text name="loanPurpose" label="Loan Purpose" required />
                  <Text name="cibilScore" label="CIBIL Score" type="number" />
                </Section>
              )}

              {loanCategory === "Loan Against Property" && (
                <Section title="Loan Against Property" icon={<Home className="h-5 w-5 text-emerald-500" />}>
                  <Text name="propertyType" label="Property Type" required />
                  <Text name="propertyLocation" label="Property Location" required />
                  <Text name="propertyValue" label="Property Value (₹)" required type="number" />
                  <Text name="requiredLoanAmount" label="Required Loan Amount (₹)" required type="number" />
                  <Text name="existingEmi" label="Existing EMI (₹)" type="number" />
                  <Text name="preferredTenure" label="Preferred Tenure (months)" type="number" />
                  <Text name="cibilScore" label="CIBIL Score" type="number" />
                </Section>
              )}

              {loanCategory === "CIBIL Issue / Financial Consultation" && (
                <Section title="CIBIL / Financial Concern" icon={<CreditCard className="h-5 w-5 text-purple-500" />}>
                  <Text name="cibilScore" label="Current CIBIL Score" required type="number" />
                  <SelectField
                    name="loanPurpose"
                    label="CIBIL Concern Type"
                    required
                    options={toOptions(CIBIL_CONCERN_TYPES)}
                    placeholder="Select Concern"
                  />
                  <Text name="company" label="Bank / NBFC Name" />
                  <Area name="remarks" label="Issue Description" required rows={3} />
                </Section>
              )}

              {loanCategory === "Other" && (
                <Section title="Other Loan Requirement" icon={<IndianRupee className="h-5 w-5 text-emerald-500" />}>
                  <Text name="loanPurpose" label="Loan Purpose" required />
                  <Text name="requiredLoanAmount" label="Required Loan Amount (₹)" required type="number" />
                  <Text name="preferredTenure" label="Preferred Tenure (months)" type="number" />
                  <Text name="cibilScore" label="CIBIL Score" type="number" />
                </Section>
              )}

              {showCoApplicant && (
                <Section
                  title="Co-Applicant (Optional at enquiry stage)"
                  description="You can add detailed co-applicant records from the applicant profile after submitting."
                  icon={<Users className="h-5 w-5 text-primary" />}
                >
                  <Field label="Co-Applicant Name">
                    <Input placeholder="Optional at this stage" disabled />
                  </Field>
                  <Field label="Relationship">
                    <Input placeholder="Add after submitting" disabled />
                  </Field>
                  <Field label="Mobile Number">
                    <Input placeholder="Add after submitting" disabled />
                  </Field>
                </Section>
              )}

              <div className="sticky bottom-4 z-10 flex flex-col-reverse gap-3 rounded-2xl bg-background/80 p-4 shadow-lg backdrop-blur-md border sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSaving || isSubmitting}
                  onClick={() => reset(getDefaults())}
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