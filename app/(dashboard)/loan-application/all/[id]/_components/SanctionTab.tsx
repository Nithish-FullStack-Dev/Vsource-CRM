import { Calendar, CreditCard, IndianRupee, Landmark } from "lucide-react";

import { formatDate, formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function SanctionTab({ applicant }: { applicant: LoanApplication }) {
  const sanctionedBank = (applicant.bankApplications ?? []).find(
    (item) => item.sanctionedAmount,
  );

  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Approval Stage" title="Sanction Details" />

      <InfoGrid>
        <InfoCard
          icon={Landmark}
          label="Sanctioned Bank / NBFC"
          value={sanctionedBank?.bank}
        />
        <InfoCard
          icon={IndianRupee}
          label="Sanctioned Amount"
          value={formatINR(applicant.sanctionedAmount ?? sanctionedBank?.sanctionedAmount)}
        />
        <InfoCard
          icon={CreditCard}
          label="ROI"
          value={sanctionedBank?.roi ? `${sanctionedBank.roi}%` : undefined}
        />
        <InfoCard
          icon={CreditCard}
          label="Tenure"
          value={sanctionedBank?.tenure ? `${sanctionedBank.tenure} months` : undefined}
        />
        <InfoCard
          icon={Calendar}
          label="Sanction Date"
          value={formatDate(sanctionedBank?.sanctionDate)}
        />
        <InfoCard
          icon={CreditCard}
          label="Status"
          value={sanctionedBank?.status}
        />
      </InfoGrid>
    </div>
  );
}