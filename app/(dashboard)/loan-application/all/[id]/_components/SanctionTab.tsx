import {
  Calendar,
  CreditCard,
  Edit,
  IndianRupee,
  Landmark,
} from "lucide-react";

import { formatDate, formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";
import { SanctionEditDialog } from "./SanctionEditDialog";
import { Button } from "@/components/ui/button";

export function SanctionTab({ applicant }: { applicant: LoanApplication }) {
  const sanction = applicant.sanction;

  return (
    <div className="space-y-6">
      {/* Container aligned horizontally to position headers and triggers beautifully */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <TabHeader eyebrow="Approval Stage" title="Sanction Details" />

        <SanctionEditDialog
          applicant={applicant}
          trigger={
            <Button
              variant="default"
              className="flex items-center gap-2 self-start sm:self-auto"
            >
              <Edit className="w-4 h-4" /> Edit Sanction
            </Button>
          }
        />
      </div>

      <InfoGrid>
        <InfoCard
          icon={Landmark}
          label="Sanctioned Bank / NBFC"
          value={sanction?.bank?.name}
        />

        <InfoCard
          icon={IndianRupee}
          label="Sanctioned Amount"
          value={formatINR(sanction?.sanctionedAmount)}
        />

        <InfoCard
          icon={CreditCard}
          label="Sanction Number"
          value={sanction?.sanctionNo}
        />

        <InfoCard
          icon={Calendar}
          label="Sanction Date"
          value={formatDate(sanction?.sanctionDate)}
        />

        <InfoCard
          icon={CreditCard}
          label="Interest Rate (ROI)"
          value={
            sanction?.roi != null
              ? `${Number(sanction.roi).toFixed(2)}%`
              : undefined
          }
        />

        <InfoCard
          icon={CreditCard}
          label="Loan Tenure"
          value={
            sanction?.tenure != null ? `${sanction.tenure} Months` : undefined
          }
        />

        <InfoCard
          icon={IndianRupee}
          label="EMI"
          value={formatINR(sanction?.emi)}
        />

        <InfoCard
          icon={IndianRupee}
          label="Processing Fee"
          value={formatINR(sanction?.processingFee)}
        />

        <InfoCard
          icon={IndianRupee}
          label="Insurance Amount"
          value={formatINR(sanction?.insuranceAmount)}
        />

        <InfoCard
          icon={Calendar}
          label="Expiry Date"
          value={formatDate(sanction?.expiryDate)}
        />

        <InfoCard
          icon={CreditCard}
          label="Moratorium"
          value={sanction?.moratorium}
        />

        <InfoCard
          icon={CreditCard}
          label="Sanction Letter"
          value={
            sanction?.sanctionLetter ? (
              <a
                href={sanction.sanctionLetter}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                View Letter
              </a>
            ) : (
              "—"
            )
          }
        />

        <InfoCard icon={CreditCard} label="Remarks" value={sanction?.remarks} />
      </InfoGrid>
    </div>
  );
}
