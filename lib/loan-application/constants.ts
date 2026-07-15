// lib/loan-application/constants.ts

export const APPLICANT_CATEGORIES = [
  "Student",
  "Salaried",
  "Self Employed",
] as const;

export const LOAN_CATEGORIES = [
  "Education Loan",
  "Study Abroad Loan",
  "Domestic Education Loan",
  "Personal Loan",
  "Home Loan",
  "Business Loan",
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
  "Study Abroad Loan",
  "Domestic Education Loan",
  "Personal Loan",
  "Home Loan",
  "Business Loan",
  "Loan Against Property",
  "Other",
] as const;

export const LOAN_DOCUMENT_CHECKLIST = [
  { code: "photo", name: "Applicant Photo", required: true },
  { code: "aadhaar", name: "Aadhaar Card", required: true },
  { code: "pan", name: "PAN Card", required: true },
  { code: "address_proof", name: "Address Proof", required: true },
  { code: "bank_statement", name: "Bank Statement", required: true },
  { code: "income_proof", name: "Income Proof", required: true },
  { code: "itr", name: "ITR / Form 16", required: false },
  { code: "offer_letter", name: "Offer Letter", required: false },
  { code: "fee_structure", name: "Fee Structure", required: false },
  { code: "property_documents", name: "Property Documents", required: false },
  { code: "cibil_report", name: "CIBIL Report", required: false },
  { code: "sanction_letter", name: "Sanction Letter", required: false },
  { code: "disbursement_proof", name: "Disbursement Proof", required: false },
  { code: "deposit_receipt", name: "Deposit Receipt", required: false },
] as const;

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
    {
      key: "documents",
      label: "Documents",
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

  /**
   * Co-Applicant
   *
   * Education Loan now includes:
   * - Education Loan
   * - Study Abroad Loan
   * - Domestic Education Loan
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
   * Financial tab
   */
  tabs.push({
    key: "financial",
    label: "Financial",
  });

  /**
   * CIBIL consultation
   */

  /**
   * Complete bank processing workflow
   */
  if (
    BANK_PROCESS_LOANS.includes(
      loanCategory as (typeof BANK_PROCESS_LOANS)[number],
    )
  ) {
    tabs.push(
      {
        key: "banks",
        label: "Banks",
      },
      {
        key: "sanction",
        label: "Sanction",
      },
      {
        key: "disbursement",
        label: "Disbursement",
      },
      {
        key: "deposit",
        label: "Deposit",
      },
    );
  }

  /**
   * Final remarks/activity/follow-up tab
   */
  tabs.push({
    key: "remarks",
    label: "Remarks",
  });

  return tabs;
};
