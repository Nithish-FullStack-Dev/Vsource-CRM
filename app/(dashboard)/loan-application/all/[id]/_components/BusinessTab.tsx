import { Building2, CreditCard, IndianRupee } from "lucide-react";

import { formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function BusinessTab({ applicant }: { applicant: LoanApplication }) {
  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Self Employed Profile" title="Business Details" />

      <InfoGrid>
        <InfoCard
          icon={Building2}
          label="Business Name"
          value={applicant.businessName}
        />
        <InfoCard
          icon={Building2}
          label="Business Type"
          value={applicant.businessType}
        />
        <InfoCard
          icon={CreditCard}
          label="Registration Type"
          value={applicant.registrationType}
        />
        <InfoCard
          icon={CreditCard}
          label="Registration Number"
          value={applicant.registrationNumber}
        />
        <InfoCard
          icon={Building2}
          label="Years in Business"
          value={applicant.yearsInBusiness}
        />
        <InfoCard
          icon={IndianRupee}
          label="Annual Turnover"
          value={formatINR(applicant.annualTurnover)}
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
          Business Address
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {applicant.businessAddress || "Not provided"}
        </p>
      </div>
    </div>
  );
}