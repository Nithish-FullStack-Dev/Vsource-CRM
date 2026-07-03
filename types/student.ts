// types\student.ts
import { User } from "@/users/types/user";
import { Lead, Role } from ".";

export interface StudentRecord {
  id: string;

  studentName: string;

  mobileNumber: string;

  emailId: string;

  password?: string;

  dob?: string | Date;

  gender?: "male" | "female" | "others";

  applicationDate?: string | Date;

  currentStage?: string;

  status: "active" | "inactive";

  moi?: string;

  undergraduate?: "pursuing" | "graduate";

  counselorId: string;

  branch?: {
    id: string;
    name: string;
    code?: string;
  };

  counselor?: {
    id: string;
    name: string;
    role?: Role;
  };

  applications: Applications[];

  visaLoanProfile?: StudentVisaLoanProfile;

  remarks?: Remarks[];

  documents?: StudentDocumentRecord[];

  lead?: Lead;

  moduleProgress?: {
    id: string;
    module:
      | "basic_information"
      | "documents"
      | "university_applications"
      | "visa_process";

    status:
      | "pending"
      | "started"
      | "in_progress"
      | "need_corrections"
      | "completed"
      | "rejected";

    progress: number;
  }[];

  createdAt: string;
  updatedAt: string;
}

export interface Applications {
  id: string;

  portal?: string;

  universityId: string;
  courseId: string;

  countryId?: string;
  intakeId?: string;

  university?: {
    id: string;
    name: string;
  };

  course?: {
    id: string;
    name: string;
  };

  status: string;

  offerStatus?: string;

  applicationDate?: string | Date;
}

export interface Remarks {
  id: string;
  note: string;
  createdAt: string | Date;
  createdBy: User;
}

export type StudentDocumentRecord = {
  id: string;
  studentId: string;
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

export type StudentDocumentChecklistItem = {
  code: string;
  name: string;
  category:
    | "PERSONAL"
    | "ACADEMIC"
    | "TEST_SCORE"
    | "APPLICATION"
    | "UNIVERSITY"
    | "LOAN_STUDENT"
    | "LOAN_PARENT"
    | "LOAN_COLLATERAL"
    | "VISA";
  module: "ADMISSION" | "LOAN" | "VISA";
  requiredCount: number;
  allowMultiple: boolean;
  isMandatory: boolean;
  uploadedCount: number;
  isComplete: boolean;
  documents: StudentDocumentRecord[];
};

export type StudentDocumentSummary = {
  totalChecklistItems: number;
  completedChecklistItems: number;
  pendingChecklistItems: number;
  totalRequiredUploads: number;
  completedRequiredUploads: number;
  percentage: number;
};

export type StudentDocumentsResponse = {
  checklist: StudentDocumentChecklistItem[];
  summary: StudentDocumentSummary;
  hasUploadedDocuments: boolean;
};

//! Visa
export type StudentVisaLoanProfile = {
  id?: string;
  studentId?: string;
  depositDeadlineDate?: string | null;
  depositStatus?: string | null;
  ihsPaidStatus?: string | null;
  visaPaidStatus?: string | null;
  casDeadlineDate?: string | null;
  casStatus?: string | null;
  visaStatus?: string | null;
  universityStartDate?: string | null;
  fintechAssigneeId?: string | null;

  fintechAssignee?: {
    id: string;
    name: string;
  } | null;
  nbfc?: string | null;
  loanStatus?: string | null;
  pfStatus?: string | null;
  appliedAmount?: string | number | null;
  sanctionedAmount?: string | number | null;
  disbursed?: boolean;
  disbursedAmount?: string | number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type StudentVisaLoanProfilePayload = {
  depositDeadlineDate: string | null;
  depositStatus: string | null;
  ihsPaidStatus: string | null;
  visaPaidStatus: string | null;
  casDeadlineDate: string | null;
  casStatus: string | null;
  visaStatus: string | null;
  universityStartDate: string | null;
  fintechAssigneeId: string | null;
  nbfc: string | null;
  loanStatus: string | null;
  pfStatus: string | null;
  appliedAmount: number | null;
  sanctionedAmount: number | null;
  disbursed: boolean;
  disbursedAmount: number | null;
};

export interface StudentModuleProgressRecord {
  id: string;

  studentId: string;

  module:
    | "basic_information"
    | "documents"
    | "university_applications"
    | "visa_process";

  status:
    | "pending"
    | "started"
    | "in_progress"
    | "need_corrections"
    | "completed"
    | "rejected";

  progress: number;

  createdAt: string;

  updatedAt: string;
}
