import { Calendar, CreditCard, IndianRupee, Landmark } from "lucide-react";

import { formatDate, formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function DepositTab({ applicant }: { applicant: LoanApplication }) {
  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Post Disbursement" title="Deposit Details" />

      <InfoGrid>
        <InfoCard
          icon={IndianRupee}
          label="Deposit Amount"
          value={formatINR(applicant.depositAmount)}
        />
        <InfoCard
          icon={Calendar}
          label="Deposit Date"
          value={formatDate(applicant.depositDate)}
        />
        <InfoCard
          icon={CreditCard}
          label="Reference Number"
          value={applicant.depositReference}
        />
        <InfoCard
          icon={Landmark}
          label="Deposit Bank"
          value={applicant.depositBank}
        />
      </InfoGrid>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Deposit Remarks
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {applicant.depositRemarks || "Not provided"}
        </p>
      </div>
    </div>
  );
}