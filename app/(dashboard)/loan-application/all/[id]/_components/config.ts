import type { LoanProfileTab } from "./ProfileUI";

export type LoanProfileTabKey =
  | "basic"
  | "education"
  | "employment"
  | "business"
  | "coapplicant"
  | "financial"
  | "documents"
  | "cibil"
  | "banks"
  | "sanction"
  | "disbursement"
  | "deposit"
  | "followups"
  | "activity";

export const LOAN_STATUSES = [
  "New Enquiry",
  "Documents Pending",
  "Under Review",
  "Sanctioned",
  "Disbursed",
  "Deposit Received",
  "Rejected",
] as const;

export type LoanStatus = (typeof LOAN_STATUSES)[number];

const educationLoans = ["Study Abroad Loan", "Domestic Education Loan"];
const bankProcessLoans = [
  "Education Loan",
  "Study Abroad Loan",
  "Domestic Education Loan",
  "Personal Loan",
  "Home Loan",
  "Business Loan",
  "Loan Against Property",
  "Other",
];

export const formatDate = (value?: string | Date | null) => {
  if (!value) return "Not provided";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "Not provided"
    : date.toLocaleDateString("en-GB");
};

export const formatINR = (value?: number | null) =>
  typeof value === "number" && !Number.isNaN(value)
    ? new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(value)
    : "—";

export const getErrorMessage = (caughtError: unknown, fallback: string) => {
  if (caughtError instanceof Error && caughtError.message) {
    return caughtError.message;
  }

  return fallback;
};

export const getApplicantInitials = (name?: string | null) =>
  (name || "Applicant")
    .split(" ")
    .map((item) => item[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const loanStatusTone = (status: string) => {
  switch (status) {
    case "New Enquiry":
      return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300";
    case "Documents Pending":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300";
    case "Under Review":
      return "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300";
    case "Sanctioned":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Disbursed":
      return "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300";
    case "Deposit Received":
      return "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300";
    case "Rejected":
      return "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300";
  }
};

export function getTabsForLoanApplicant(
  applicantCategory?: string | null,
  loanCategory?: string | null,
): LoanProfileTab[] {
  const tabs: LoanProfileTab[] = [
    { key: "basic", label: "Basic" },
    { key: "documents", label: "Documents" },
  ];

  if (applicantCategory === "Student") {
    tabs.push({ key: "education", label: "Education" });
  }

  if (applicantCategory === "Salaried") {
    tabs.push({ key: "employment", label: "Employment" });
  }

  if (applicantCategory === "Self Employed") {
    tabs.push({ key: "business", label: "Business" });
  }

  if (
    educationLoans.includes(loanCategory || "") ||
    ["Home Loan", "Business Loan", "Loan Against Property"].includes(
      loanCategory || "",
    )
  ) {
    tabs.push({ key: "coapplicant", label: "Co-Applicant" });
  }

  tabs.push({ key: "financial", label: "Financial" });



  if (bankProcessLoans.includes(loanCategory || "")) {
    tabs.push(
      { key: "banks", label: "Banks" },
      { key: "sanction", label: "Sanction" },
      { key: "disbursement", label: "Disbursement" },
      { key: "deposit", label: "Deposit" },
    );
  }

  tabs.push(
    { key: "followups", label: "Follow-Ups" },
    { key: "activity", label: "Activity" },
  );

  return tabs;
}
