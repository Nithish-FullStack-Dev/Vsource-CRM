import { Briefcase, Building2, CreditCard, IndianRupee } from "lucide-react";

import { formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function EmploymentTab({ applicant }: { applicant: LoanApplication }) {
  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Applicant Work Profile" title="Employment Details" />

      <InfoGrid>
        <InfoCard icon={Building2} label="Company Name" value={applicant.company} />
        <InfoCard icon={Briefcase} label="Designation" value={applicant.designation} />
        <InfoCard
          icon={Briefcase}
          label="Employment Type"
          value={applicant.employmentType}
        />
        <InfoCard icon={CreditCard} label="Employee ID" value={applicant.employeeId} />
        <InfoCard
          icon={Briefcase}
          label="Total Experience"
          value={applicant.totalExperience}
        />
        <InfoCard
          icon={Briefcase}
          label="Current Company Experience"
          value={applicant.currentCompanyExperience}
        />
        <InfoCard
          icon={IndianRupee}
          label="Monthly Salary"
          value={formatINR(applicant.monthlySalary)}
        />
        <InfoCard
          icon={IndianRupee}
          label="Annual Income"
          value={formatINR(applicant.annualIncome)}
        />
        <InfoCard
          icon={IndianRupee}
          label="Existing EMI"
          value={formatINR(applicant.existingEmi)}
        />
      </InfoGrid>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Employer Address
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {applicant.employerAddress || "Not provided"}
        </p>
      </div>
    </div>
  );
}