// app\(dashboard)\loan-application\all\[id]\_components\types.ts

export type BankApplication = {
  id?: string;

  applicationId?: string;

  bankId?: string;

  bank?: {
    id: string;
    name: string;
    status?: boolean;
  } | null;

  branch?: string | null;

  applicationNo?: string | null;

  applicationDate?: string | Date | null;

  appliedAmount?: number | string | null;

  loanType?: string | null;

  roi?: number | string | null;

  tenure?: number | null;

  processingFee?: number | string | null;

  insuranceAmount?: number | string | null;

  moratorium?: string | null;

  loginExecutive?: string | null;

  status?: string | null;

  rejectionReason?: string | null;

  remarks?: string | null;

  createdAt?: string | Date | null;

  updatedAt?: string | Date | null;
};

export type CoApplicant = {
  id?: string;

  name?: string | null;
  relationship?: string | null;
  dob?: string | Date | null;
  gender?: string | null;

  mobile?: string | null;
  altMobile?: string | null;
  email?: string | null;

  pan?: string | null;
  aadhaar?: string | null;

  address?: string | null;
  city?: string | null;
  state?: string | null;
  pin?: string | null;

  employmentType?: string | null;
  occupation?: string | null;
  employerName?: string | null;
  designation?: string | null;

  monthlyIncome?: number | string | null;
  annualIncome?: number | string | null;
  existingEmi?: number | string | null;
  income?: number | string | null;

  cibilScore?: number | null;

  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
};

export type FollowUp = {
  id?: string;
  date?: string | Date | null;
  nextFollowUp?: string | Date | null;
  type?: string | null;
  note?: string | null;
  createdBy?: string | null;
  createdAt?: string | Date | null;
};

export type ActivityLog = {
  id?: string;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  createdBy?: string | null;
  createdAt?: string | Date | null;
};

export type LoanDocumentCategory = "KYC" | "OPTIONAL" | "OTHER";

export type LoanDocumentChecklistItem = {
  id: string;
  code: string;
  name: string;
  category: LoanDocumentCategory;
  required: boolean;
  isSystem: boolean;
  isOptional: boolean;
  isComplete: boolean;
  documents: LoanDocumentRecord[];
};

export type LoanDocumentRecord = {
  id: string;
  applicationId: string;
  documentMasterId: string;
  documentCode: string;
  documentType: string;
  originalFileName: string;
  storedFileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  remarks?: string | null;
  uploadedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type DecimalValue = string | number | null;

export type LoanApplication = {
  id: string;
  applicationId?: string | null;

  fullName?: string | null;
  mobile?: string | null;
  altMobile?: string | null;
  email?: string | null;
  dob?: string | Date | null;
  gender?: string | null;
  maritalStatus?: string | null;
  aadhaar?: string | null;
  pan?: string | null;
  passport?: string | null;
  passportExpireDate?: string | Date | null;
  currentAddress?: string | null;
  permanentAddress?: string | null;
  city?: string | null;
  state?: string | null;
  pin?: string | null;

  enquiryDate?: string | Date | null;
  leadSource?: string | null;
  branch?: string | null;
  branchName?: string | null;
  branchId?: string | null;
  counselor?: string | null;
  counsellor?: string | null;
  counselorName?: string | null;
  fintechAssignee?: string | null;
  fintechAssigneeName?: string | null;
  priority?: string | null;
  nextFollowUp?: string | Date | null;
  remarks?: string | null;

  applicantCategory?: string | null;
  loanCategory?: string | null;
  loanStatus?: string | null;

  qualification?: string | null;
  graduationStatus?: string | null;
  percentage?: string | null;
  yearOfPassing?: string | null;
  currentInstitution?: string | null;
  workExperience?: string | null;

  company?: string | null;
  designation?: string | null;
  employmentType?: string | null;
  employeeId?: string | null;
  totalExperience?: string | null;
  currentCompanyExperience?: string | null;
  monthlySalary?: number | null;
  annualIncome?: number | null;
  existingEmi?: number | null;
  employerAddress?: string | null;

  businessName?: string | null;
  businessType?: string | null;
  registrationType?: string | null;
  registrationNumber?: string | null;
  yearsInBusiness?: string | null;
  annualTurnover?: number | null;
  businessAddress?: string | null;

  studyDestination?: string | null;
  country?: string | null;
  university?: string | null;
  courseName?: string | null;
  courseLevel?: string | null;
  courseDuration?: string | null;
  intake?: string | null;
  admissionStatus?: string | null;
  offerLetterReceived?: string | null;
  studentApplications?: {
    id: string;

    country: string | null;

    university: string | null;

    course: string | null;

    intake: string | null;

    status: string | null;

    offerStatus: string | null;

    applicationDate: string | Date | null;
  }[];

  tuitionFee?: number | null;
  livingExpenses?: number | null;
  otherExpenses?: number | null;
  totalCourseCost?: number | null;
  ownContribution?: number | null;
  requiredLoanAmount?: number | null;
  appliedAmount?: number | null;
  loanPreference?: string | null;
  collateralAvailable?: string | null;

  loanPurpose?: string | null;
  preferredTenure?: number | null;
  cibilScore?: number | null;
  propertyType?: string | null;
  propertyLocation?: string | null;
  propertyValue?: number | null;
  downPayment?: number | null;

  disbursedAmount?: number | null;
  depositAmount?: number | null;
  depositDate?: string | Date | null;
  depositReference?: string | null;
  depositRemarks?: string | null;
  depositStatus?: string | "Pending";

  sanctionBankId?: string | null;
  sanctionedAmount?: DecimalValue;
  sanctionDate?: string | Date | null;

  disbursementStatus?: string | null;
  disbursementDate?: string | Date | null;
  disbursedBank?: string | null;
  depositBank?: string | null;

  sanctionBankApplication?: BankApplication | null;
  disbursedBankApplication?: BankApplication | null;

  coApplicants?: CoApplicant[];
  bankApplications?: BankApplication[];
  followUps?: FollowUp[];
  activities?: ActivityLog[];
};
