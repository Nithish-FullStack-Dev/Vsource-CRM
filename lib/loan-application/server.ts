// lib\loan-application\server.ts
import db from "@/lib/prisma";
import type { LoanApplicationPayload } from "@/schemas/loan-application/loan-application.schema";
import { LOAN_DOCUMENT_CHECKLIST } from "@/lib/loan-application/constants";
const toDate = (v?: string | Date | null) => (v ? new Date(v) : null);
const money = (v?: number | null) => (typeof v === "number" ? v : null);
const num = (v: unknown) => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
export async function generateLoanApplicationId() {
  const y = new Date().getFullYear();
  const count = await db.loanApplication.count({
    where: {
      createdAt: {
        gte: new Date(`${y}-01-01T00:00:00.000Z`),
        lt: new Date(`${y + 1}-01-01T00:00:00.000Z`),
      },
    },
  });
  return `LA-${y}-${String(count + 1).padStart(5, "0")}`;
}
export function toLoanApplicationData(v: Partial<LoanApplicationPayload>) {
  return {
    fullName: v.fullName,
    mobile: v.mobile,
    altMobile: v.altMobile,
    email: v.email,
    dob: toDate(v.dob),
    gender: v.gender,
    maritalStatus: v.maritalStatus,
    aadhaar: v.aadhaar,
    pan: v.pan,
    passport: v.passport,
    passportExpireDate: toDate(v.passportExpireDate),
    currentAddress: v.currentAddress,
    permanentAddress: v.permanentAddress,
    city: v.city,
    state: v.state,
    pin: v.pin,
    enquiryDate: toDate(v.enquiryDate),
    leadSource: v.leadSource,
    branchId: v.branchId,
    counselorId: v.counselorId,
    fintechAssigneeId: v.fintechAssigneeId,
    priority: v.priority,
    nextFollowUp: toDate(v.nextFollowUp),
    remarks: v.remarks,
    applicantCategory: v.applicantCategory,
    loanCategory: v.loanCategory,
    // loanStatus: v.loanStatus || 'New Enquiry',
    qualification: v.qualification,
    graduationStatus: v.graduationStatus,
    percentage: v.percentage,
    yearOfPassing: v.yearOfPassing,
    currentInstitution: v.currentInstitution,
    workExperience: v.workExperience,
    company: v.company,
    designation: v.designation,
    employmentType: v.employmentType,
    employeeId: v.employeeId,
    totalExperience: v.totalExperience,
    currentCompanyExperience: v.currentCompanyExperience,
    monthlySalary: money(v.monthlySalary),
    annualIncome: money(v.annualIncome),
    existingEmi: money(v.existingEmi),
    employerAddress: v.employerAddress,
    businessName: v.businessName,
    businessType: v.businessType,
    registrationType: v.registrationType,
    registrationNumber: v.registrationNumber,
    yearsInBusiness: v.yearsInBusiness,
    annualTurnover: money(v.annualTurnover),
    businessAddress: v.businessAddress,
    studyDestination: v.studyDestination,
    country: v.country,
    university: v.university,
    courseName: v.courseName,
    courseLevel: v.courseLevel,
    courseDuration: v.courseDuration,
    intake: v.intake,
    admissionStatus: v.admissionStatus,
    offerLetterReceived: v.offerLetterReceived,
    tuitionFee: money(v.tuitionFee),
    livingExpenses: money(v.livingExpenses),
    otherExpenses: money(v.otherExpenses),
    totalCourseCost: money(v.totalCourseCost),
    ownContribution: money(v.ownContribution),
    requiredLoanAmount: money(v.requiredLoanAmount),
    loanPreference: v.loanPreference,
    collateralAvailable: v.collateralAvailable,
    loanPurpose: v.loanPurpose,
    preferredTenure:
      typeof v.preferredTenure === "number" ? v.preferredTenure : null,
    cibilScore: typeof v.cibilScore === "number" ? v.cibilScore : null,
    propertyType: v.propertyType,
    propertyLocation: v.propertyLocation,
    propertyValue: money(v.propertyValue),
    downPayment: money(v.downPayment),
    sanctionedAmount: money(v.sanctionedAmount),
    disbursedAmount: money(v.disbursedAmount),
    depositAmount: money(v.depositAmount),
    depositDate: toDate(v.depositDate),
    depositReference: v.depositReference,
    depositBank: v.depositBank,
    depositRemarks: v.depositRemarks,
  };
}
export const loanApplicationInclude = {
  branch: { select: { id: true, name: true, code: true } },
  counselor: { select: { id: true, name: true, email: true } },
  fintechAssignee: { select: { id: true, name: true, email: true } },
  bankApplications: { orderBy: { createdAt: "desc" as const } },
  coApplicants: { orderBy: { createdAt: "desc" as const } },
  followUps: { orderBy: { createdAt: "desc" as const } },
  activities: { orderBy: { createdAt: "desc" as const } },
  documents: { orderBy: { uploadedAt: "desc" as const } },
};
export function serializeLoanApplication(r: any) {
  if (!r) return null;
  const b = {
    ...r,
    branchName: r.branch?.name ?? null,
    counselorName: r.counselor?.name ?? null,
    fintechAssigneeName: r.fintechAssignee?.name ?? null,
  };
  for (const k of [
    "monthlySalary",
    "annualIncome",
    "existingEmi",
    "annualTurnover",
    "tuitionFee",
    "livingExpenses",
    "otherExpenses",
    "totalCourseCost",
    "ownContribution",
    "requiredLoanAmount",
    "propertyValue",
    "downPayment",
    "sanctionedAmount",
    "disbursedAmount",
    "depositAmount",
  ])
    b[k] = num(b[k]);
  b.bankApplications = (r.bankApplications ?? []).map((i: any) => ({
    ...i,
    appliedAmount: num(i.appliedAmount),
    sanctionedAmount: num(i.sanctionedAmount),
    disbursedAmount: num(i.disbursedAmount),
    roi: num(i.roi),
  }));
  b.coApplicants = (r.coApplicants ?? []).map((i: any) => ({
    ...i,
    income: num(i.income),
  }));
  return b;
}
export function buildDocumentChecklist(documents: any[]) {
  return LOAN_DOCUMENT_CHECKLIST.map((item) => {
    const docs = documents.filter((d) => d.documentCode === item.code);
    return {
      ...item,
      isOptional: item.required === false,
      isComplete: docs.length > 0,
      documents: docs,
    };
  });
}
