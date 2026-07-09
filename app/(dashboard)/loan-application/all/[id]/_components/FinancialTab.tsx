import { CreditCard, Home, IndianRupee } from "lucide-react";

import { formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateLoanApplicationSchema } from "@/schemas/loan-application/loan-application.schema";
import { useUpdateLoanApplication } from "@/hooks/loan-application/useLoanApplications";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FinancialTab({ applicant }: { applicant: LoanApplication }) {
  const [editing, setEditing] = useState(false);
  const update = useUpdateLoanApplication(applicant.id);
  const { register, handleSubmit, reset } = useForm<any>({
    resolver: zodResolver(updateLoanApplicationSchema),
    defaultValues: {
      tuitionFee: applicant.tuitionFee ?? undefined,
      livingExpenses: applicant.livingExpenses ?? undefined,
      otherExpenses: applicant.otherExpenses ?? undefined,
      totalCourseCost: applicant.totalCourseCost ?? undefined,
      ownContribution: applicant.ownContribution ?? undefined,
      requiredLoanAmount: applicant.requiredLoanAmount ?? undefined,
      loanPreference: applicant.loanPreference ?? undefined,
      collateralAvailable: applicant.collateralAvailable ?? undefined,
      loanPurpose: applicant.loanPurpose ?? undefined,
      preferredTenure: applicant.preferredTenure ?? undefined,
      cibilScore: applicant.cibilScore ?? undefined,
      propertyType: applicant.propertyType ?? undefined,
      propertyLocation: applicant.propertyLocation ?? undefined,
      propertyValue: applicant.propertyValue ?? undefined,
      downPayment: applicant.downPayment ?? undefined,
    },
  });

  const onSubmit = async (vals: any) => {
    await update.mutateAsync(vals);
    setEditing(false);
    reset(vals);
  };
  return (
    <div className="space-y-6">
      <TabHeader
        eyebrow="Loan Requirement"
        title="Financial Details"
        action={editing ? <Button size="sm" variant="outline" onClick={() => { setEditing(false); reset(); }}>Cancel</Button> : <Button size="sm" onClick={() => setEditing(true)}>Edit</Button>}
      />

      {editing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input placeholder="Tuition Fee" {...register('tuitionFee')} />
            <Input placeholder="Living Expenses" {...register('livingExpenses')} />
            <Input placeholder="Other Expenses" {...register('otherExpenses')} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input placeholder="Total Course Cost" {...register('totalCourseCost')} />
            <Input placeholder="Own Contribution" {...register('ownContribution')} />
            <Input placeholder="Required Loan Amount" {...register('requiredLoanAmount')} />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </form>
      ) : (
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
      )}
    </div>
  )};