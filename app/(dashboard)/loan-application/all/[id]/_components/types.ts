export type BankApplication = {
  id?: string;
  bank?: string | null;
  branch?: string | null;
  applicationNo?: string | null;
  appliedAmount?: number | null;
  sanctionedAmount?: number | null;
  disbursedAmount?: number | null;
  roi?: number | null;
  tenure?: number | null;
  status?: string | null;
  remarks?: string | null;
  loginDate?: string | Date | null;
  sanctionDate?: string | Date | null;
  disbursementDate?: string | Date | null;
};

export type CoApplicant = {
  id?: string;
  name?: string | null;
  relationship?: string | null;
  mobile?: string | null;
  email?: string | null;
  income?: number | null;
  occupation?: string | null;
  monthlyIncome?: number | null;
  employmentType?: string | null;
  companyName?: string | null;
  annualIncome?: number | null;
  existingEmi?: number | null;
  
  cibilScore?: number | null;
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

export type LoanDocumentRecord = {
  id: string;
  originalFileName?: string | null;
  fileName?: string | null;
  fileUrl?: string | null;
  documentType?: string | null;
  fileSize?: number | null;
  remarks?: string | null;
  createdAt?: string | Date | null;
};

export type LoanDocumentChecklistItem = {
  code: string;
  name: string;
  required?: boolean;
  isOptional?: boolean;
  isComplete?: boolean;
  documents?: LoanDocumentRecord[];
};

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

  sanctionedAmount?: number | null;
  disbursedAmount?: number | null;
  depositAmount?: number | null;
  depositDate?: string | Date | null;
  depositReference?: string | null;
  depositBank?: string | null;
  depositRemarks?: string | null;

  coApplicants?: CoApplicant[];
  bankApplications?: BankApplication[];
  followUps?: FollowUp[];
  activities?: ActivityLog[];
};