import { CreditCard, Home, IndianRupee } from "lucide-react";

import { formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function FinancialTab({ applicant }: { applicant: LoanApplication }) {
  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Loan Requirement" title="Financial Details" />

      <InfoGrid>
        <InfoCard
          icon={IndianRupee}
          label="Tuition Fee"
          value={formatINR(applicant.tuitionFee)}
        />
        <InfoCard
          icon={IndianRupee}
          label="Living Expenses"
          value={formatINR(applicant.livingExpenses)}
        />
        <InfoCard
          icon={IndianRupee}
          label="Other Expenses"
          value={formatINR(applicant.otherExpenses)}
        />
        <InfoCard
          icon={IndianRupee}
          label="Total Course Cost"
          value={formatINR(applicant.totalCourseCost)}
        />
        <InfoCard
          icon={IndianRupee}
          label="Own Contribution"
          value={formatINR(applicant.ownContribution)}
        />
        <InfoCard
          icon={IndianRupee}
          label="Required Loan Amount"
          value={formatINR(applicant.requiredLoanAmount)}
        />
        <InfoCard
          icon={CreditCard}
          label="Loan Preference"
          value={applicant.loanPreference}
        />
        <InfoCard
          icon={Home}
          label="Collateral Available"
          value={applicant.collateralAvailable}
        />
        <InfoCard
          icon={CreditCard}
          label="Loan Purpose"
          value={applicant.loanPurpose}
        />
        <InfoCard
          icon={CreditCard}
          label="Preferred Tenure"
          value={
            applicant.preferredTenure
              ? `${applicant.preferredTenure} months`
              : undefined
          }
        />
        <InfoCard
          icon={CreditCard}
          label="CIBIL Score"
          value={applicant.cibilScore}
        />
        <InfoCard icon={Home} label="Property Type" value={applicant.propertyType} />
        <InfoCard
          icon={Home}
          label="Property Location"
          value={applicant.propertyLocation}
        />
        <InfoCard
          icon={IndianRupee}
          label="Property Value"
          value={formatINR(applicant.propertyValue)}
        />
        <InfoCard
          icon={IndianRupee}
          label="Down Payment"
          value={formatINR(applicant.downPayment)}
        />
      </InfoGrid>
    </div>
  );
}