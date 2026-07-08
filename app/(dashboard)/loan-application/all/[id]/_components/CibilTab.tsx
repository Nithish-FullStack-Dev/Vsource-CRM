import { Building2, CreditCard, FileText } from "lucide-react";

import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function CibilTab({ applicant }: { applicant: LoanApplication }) {
  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Financial Consultation" title="CIBIL / Financial Concern" />

      <InfoGrid>
        <InfoCard
          icon={CreditCard}
          label="Current CIBIL Score"
          value={applicant.cibilScore}
        />
        <InfoCard
          icon={CreditCard}
          label="Concern Type"
          value={applicant.loanPurpose}
        />
        <InfoCard icon={Building2} label="Bank / NBFC" value={applicant.company} />
      </InfoGrid>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-600" />

          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Issue Description
          </p>
        </div>

        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {applicant.remarks || "Not provided"}
        </p>
      </div>
    </div>
  );
}