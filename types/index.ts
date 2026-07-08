// crm-frontend-next\app\types\index.ts
export type MbbsLeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost"
  | "draft";
export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "converted"
  | "lost"
  | "draft";
export type ApplicationStage =
  | "inquiry"
  | "documents"
  | "applied"
  | "offer"
  | "visa"
  | "enrolled";

export type EnglishTestType = "IELTS" | "TOEFL" | "PTE" | "DUOLINGO";

export interface LeadEnglishTest {
  id?: string;
  leadId?: string;

  testType: EnglishTestType;

  totalScore?: number | null;
  listeningScore?: number | null;
  readingScore?: number | null;
  writingScore?: number | null;
  speakingScore?: number | null;

  createdAt?: string;
  updatedAt?: string;
}
export interface Lead {
  id: string;
  leadNumber: string;

  counsellingDate?: string | null;

  studentName?: string;
  fatherName?: string;
  mobileNumber?: string;
  emailId?: string;
  password?: string;

  place?: string;
  passport?: string;
  passportExpireDate?: string | null;

  source?: string;

  branchId: string;

  branch?: {
    id: string;
    name: string;
  };

  counselors?: {
    isPrimary: boolean;
    counselor: {
      id: string;
      name: string;
    };
  }[];

  preferredCountry?: string;
  preferredIntake?: string;
  preferredCourse?: string;
  preferredTiers?: string[];

  graduationStatus?: "completed" | "pursuing" | null;
  loanRequirement?: boolean;

  tenthPercentage?: number;
  tenthYearOfPassing?: number;

  twelfthPercentage?: number;
  twelfthYearOfPassing?: number;

  bachelorsCourse?: string;
  bachelorsUniversityName?: string;
  bachelorsPercentage?: number;
  bachelorsYearOfPassing?: number;

  backlogs?: number;

  workExperience?: string;

  greGmatScore?: number;
  quantitativeScore?: number;
  verbalScore?: number;
  analyticalWritingScore?: number;

  englishTests?: LeadEnglishTest[];

  gapsIfAny?: string;

  remarks?: string;

  nextFollowup?: string | null;

  timelines?: {
    id: string;
    description: string;
    nextFollowup?: string | null;
    createdAt: string;

    createdBy?: {
      id: string;
      name: string;
    } | null;
  }[];

  status: LeadStatus;

  isConverted?: boolean;

  createdAt: string;
}

export interface Followup {
  id: string;
  student: string;
  counselor: string;
  followupType: string;
  date: string;
  time: string;
  country: string;
  status: "Pending" | "Completed" | "Missed" | "Rescheduled";
  remarks: string;
  notes: string;
}

export interface Course {
  id: string;
  logo: string;
  universityName: string;
  courseName: string;
  country: string;
  applicationFee: string;
  yearlyTuition: string;
  duration: string;
  intakeMonth: string;
  intakeYear: string;
  level: string;
  requirements: string;
  ielts: string;
  pte: string;
  toefl: string;
  duolingo: string;
  description: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  country: string;
  program: string;
  intake: string;
  status: string;
  progress: number;
  avatar?: string;
}

export interface University {
  id: string;
  name: string;
  country: string;
  city: string;
  ranking: number;
  tuitionFee: number;
  duration: string;
  intakes: string[];
  scholarships: boolean;
  programs: string[];
  image?: string;
}

export interface Application {
  id: string;
  studentName: string;
  university: string;
  program: string;
  stage: ApplicationStage;
  intake: string;
  counselor: string;
  updatedAt: string;
}

export interface Branch {
  id: string;
  name: string;
  isActive: boolean;
  usersCount: number;
  leadsCount: number;
  studentsCount: number;
  createdAt: string;
}

export interface Counselor {
  id: string;
  name: string;
  email: string;
  branch: string;
  leads: number;
  conversions: number;
  rating: number;
}

export interface CoachingBatch {
  id: string;
  name: string;
  type: "IELTS" | "PTE" | "TOEFL" | "GRE" | "GMAT";
  faculty: string;
  schedule: string;
  students: number;
  startDate: string;
}

export interface LoanInquiry {
  id: string;
  student: string;
  bank: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "disbursed";
  emi: number;
  appliedAt: string;
}

export interface Role {
  id: string;
  name: string;
  users: number;
  permissions: Record<
    string,
    { c: boolean; r: boolean; u: boolean; d: boolean }
  >;
}
export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  branch: string;
  status: "active" | "inactive";
  lastLogin: string;
}
export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "lead" | "application" | "system";
}
