import { Calendar, CreditCard, IndianRupee, Landmark } from "lucide-react";

import { formatDate, formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function DisbursementTab({ applicant }: { applicant: LoanApplication }) {
  const disbursedBank = (applicant.bankApplications ?? []).find(
    (item) => item.disbursedAmount,
  );

  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Amount Release" title="Disbursement Details" />

      <InfoGrid>
        <InfoCard
          icon={Landmark}
          label="Bank / NBFC"
          value={disbursedBank?.bank}
        />
        <InfoCard
          icon={IndianRupee}
          label="Disbursed Amount"
          value={formatINR(applicant.disbursedAmount ?? disbursedBank?.disbursedAmount)}
        />
        <InfoCard
          icon={Calendar}
          label="Disbursement Date"
          value={formatDate(disbursedBank?.disbursementDate)}
        />
        <InfoCard
          icon={CreditCard}
          label="Status"
          value={disbursedBank?.status || applicant.loanStatus}
        />
      </InfoGrid>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Remarks
        </p>

        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {disbursedBank?.remarks || applicant.remarks || "Not provided"}
        </p>
      </div>
    </div>
  );
}