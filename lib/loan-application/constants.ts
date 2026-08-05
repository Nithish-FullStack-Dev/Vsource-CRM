// lib/loan-application/constants.ts

import { LoanDocumentCategory } from "@/generated/prisma/enums";

export const APPLICANT_CATEGORIES = [
  "Student",
  // "Salaried",
  // "Self Employed",
] as const;

export const LOAN_CATEGORIES = [
  "Education Loan",
  "Study Abroad Loan",
  "Domestic Education Loan",
  // "Personal Loan",
  // "Home Loan",
  // "Business Loan",
] as const;

export const LOAN_STATUSES = [
  "New Enquiry",
  "Documents Pending",
  "Under Review",
  "Sanctioned",
  "Disbursed",
  "Deposit Received",
  "Approved",
  "Rejected",
] as const;

export type LoanStatus =
  (typeof LOAN_STATUSES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export const CIBIL_CONCERN_TYPES = [
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

/**
 * All supported education loan categories.
 *
 * IMPORTANT:
 * "Education Loan" is included because old/master walk-in
 * applications are stored using this value.
 */
export const EDUCATION_LOANS = [
  "Education Loan",
  "Study Abroad Loan",
  "Domestic Education Loan",
] as const;

/**
 * Loan categories that use the complete bank processing workflow.
 */
export const BANK_PROCESS_LOANS = [
  "Education Loan",
  "Domestic Education Loan",
] as const;

// lib/loan-application/constants.ts

export const LOAN_DOCUMENT_CHECKLIST = [
  {
    code: "photo",
    name: "Passport Size Photo",
    category: "KYC",
    required: true,
  },
  {
    code: "aadhaar",
    name: "Student Aadhaar Card",
    category: "KYC",
    required: true,
  },
  {
    code: "pan",
    name: "Student PAN Card",
    category: "KYC",
    required: true,
  },
  {
    code: "faadhaar",
    name: "Father Aadhaar Card",
    category: "KYC",
    required: true,
  },
  {
    code: "fpan",
    name: "Father PAN Card",
    category: "KYC",
    required: true,
  },
  {
    code: "maadhaar",
    name: "Mother Aadhaar Card",
    category: "KYC",
    required: true,
  },
  {
    code: "mpan",
    name: "Mother PAN Card",
    category: "KYC",
    required: true,
  },
  {
    code: "property_tax",
    name: "Property Tax",
    category: "KYC",
    required: true,
  },
  {
    code: "electricity_bill",
    name: "Electricity Bill",
    category: "KYC",
    required: true,
  },
  {
    code: "gas_bill",
    name: "Gas Bill",
    category: "KYC",
    required: true,
  },
  {
    code: "bank_statement",
    name: "6 Months Latest Bank Statement",
    category: "KYC",
    required: true,
  },
  {
    code: "income_certificate",
    name: "Agriculture Income Certificate",
    category: "OPTIONAL",
    required: true,
  },
  {
    code: "salary_payslips",
    name: "3 Months Salary Payslips",
    category: "OPTIONAL",
    required: false,
  },
  {
    code: "itr",
    name: "2 Years Latest ITR's",
    category: "OPTIONAL",
    required: false,
  },
  {
    code: "rental_agreement",
    name: "Rental Agreements",
    category: "OPTIONAL",
    required: false,
  },
  {
    code: "pension_payslips",
    name: "3 Months Latest Pension Payslips",
    category: "OPTIONAL",
    required: false,
  },
  {
    code: "abroad_payslips",
    name: "Abroad 3 Months Payslips",
    category: "OPTIONAL",
    required: false,
  },
  {
    code: "abroad_bankstatement",
    name: "Abroad 6 Months Latest Bank Statement",
    category: "OPTIONAL",
    required: false,
  },
  {
    code: "passport_certificate",
    name: "Passport Certificate",
    category: "OPTIONAL",
    required: false,
  },
  {
    code: "visa_certificate",
    name: "Visa Certificate",
    category: "OPTIONAL",
    required: false,
  },
] as const satisfies ReadonlyArray<{
  code: string;
  name: string;
  category: Extract<LoanDocumentCategory, "KYC" | "OPTIONAL">;
  required: boolean;
}>;

export const isEducationLoan = (loan?: string | null) =>
  Boolean(
    loan && EDUCATION_LOANS.includes(loan as (typeof EDUCATION_LOANS)[number]),
  );

export const isSalariedCategory = (category?: string | null) =>
  category === "Salaried";

export const isBusinessCategory = (category?: string | null) =>
  category === "Self Employed";

export const getLoanTabs = (
  applicantCategory?: string | null,
  loanCategory?: string | null,
) => {
  const tabs = [
    {
      key: "basic",
      label: "Basic",
    },
  ];

  /**
   * Applicant-specific tabs
   */
  if (applicantCategory === "Student") {
    tabs.push({
      key: "education",
      label: "Education",
    });
  }

  if (applicantCategory === "Salaried") {
    tabs.push({
      key: "employment",
      label: "Employment",
    });
  }

  if (applicantCategory === "Self Employed") {
    tabs.push({
      key: "business",
      label: "Business",
    });
  }

  tabs.push(
    {
      key: "documents",
      label: "Documents",
    },
    {
      key: "banks",
      label: "Lending Partner",
    },
    {
      key: "leading_patner",
      label: "Financial",
    },
  );

  /**
   * Co-Applicant
   */
  if (
    isEducationLoan(loanCategory) ||
    ["Home Loan", "Business Loan", "Loan Against Property"].includes(
      loanCategory ?? "",
    )
  ) {
    tabs.push({
      key: "coapplicant",
      label: "Co-Applicant",
    });
  }

  /**
   * Bank processing workflow
   */

  /**
   * Final remarks/activity/follow-up tab
   */
  tabs.push({
    key: "remarks",
    label: "Remarks",
  });

  return tabs;
};
