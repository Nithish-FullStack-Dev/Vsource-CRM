// types/student.ts

import { User } from "@/users/types/user";
import { Lead, Role } from ".";

export type StudentModuleType =
  | "basic_information"
  | "documents"
  | "university_applications"
  | "visa_process"
  | "loan_process";

export type StudentModuleStatus =
  | "not_started"
  | "started"
  | "in_progress"
  | "need_corrections"
  | "completed"
  | "rejected";

export interface StudentModuleProgressRecord {
  id: string;
  studentId: string;
  module: StudentModuleType;
  status: StudentModuleStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
}
export type StudentStage =
  | "application_started"
  | "application_submitted"
  | "offer_received"
  | "deposit_pending"
  | "deposit_paid"
  | "cas_pending"
  | "cas_received"
  | "visa_filing"
  | "visa_approved"
  | "visa_rejected"
  | "enrolled";

export interface StudentRecord {
  id: string;

  studentName: string;

  mobileNumber: string;

  emailId: string;

  password?: string;

  dob?: string | Date;

  gender?: "male" | "female" | "others";

  applicationDate?: string | Date;

  currentStage?: StudentStage | null;

  status: "active" | "inactive" | "drop";

  moi?: string;

  undergraduate?: "pursuing" | "graduate";

  counselorId?: string;

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

  visaProfile?: StudentVisaProfile | null;

  remarks?: Remarks[];

  documents?: StudentDocumentRecord[];

  lead?: Lead;

  leadId: string;

  moduleProgress?: StudentModuleProgressRecord[];

  timeline?: StudentTimeline[];

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

  followUpDate?: string | Date;
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

  module: "ADMISSION" | "LOAN" | "OTHER";

  requiredCount: number;

  allowMultiple: boolean;

  isMandatory: boolean;

  uploadedCount: number;

  isComplete: boolean;

  documents: StudentDocumentRecord[];

  documentMasterId?: string | null;

  required?: boolean;
  isOptional?: boolean;
  isSystem?: boolean;
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

export type StudentVisaProfile = {
  id?: string;

  studentId?: string;

  depositDeadlineDate?: string | null;
  depositStatus?: string | null;

  ihsPaidStatus?: "PAID" | "PENDING" | "PAID_PARTIALLY";

  visaPaidStatus?: string | null;

  casDeadlineDate?: string | null;

  casStatus?: "APPLIED" | "RECEIVED" | "PENDING";

  visaStatus?: "APPROVED" | "REJECTED" | "DECISION_PENDING";

  universityStartDate?: string | null;

  universityEndDate: string;

  interviewStatus: "" | "PASSED" | "FAILED" | "NO_INTERVIEW";

  createdAt?: string;

  updatedAt?: string;
};

export type StudentLoanProfile = {
  id?: string;

  studentId?: string;

  fintechAssigneeId?: string | null;

  fintechAssignee?: {
    id: string;
    name: string;
  } | null;

  nbfc?: string | null;

  loanStatus?: string | null;

  pfStatus?: string | null;

  depositDate?: string | null;

  disbursed?: boolean;

  disbursedDate?: string | null;

  createdAt?: string;

  updatedAt?: string;
};

export type StudentLoanProfilePayload = {
  fintechAssigneeId: string | null;

  nbfc: string | null;

  loanStatus: string | null;

  pfStatus: string | null;

  appliedAmount: number | null;

  sanctionedAmount: number | null;

  disbursed: boolean;

  disbursedAmount: number | null;
};

export interface StudentTimeline {
  id: string;

  studentId: string;

  type:
    | "note"
    | "followup"
    | "call"
    | "meeting"
    | "status_change"
    | "document"
    | "application"
    | "offer_letter"
    | "loan"
    | "visa"
    | "payment"
    | "info";

  title?: string;

  description?: string | null;

  followupDate?: string | null;

  oldValue?: string | null;

  newValue?: string | null;

  createdAt: string;

  createdBy?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface CreateTimelinePayload {
  type: StudentTimeline["type"];

  title?: string;

  description?: string;

  followupDate?: string;
}
