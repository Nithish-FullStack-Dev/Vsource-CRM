import { CreditCard, IndianRupee, Mail, Phone, User, Users } from "lucide-react";

import { formatINR } from "./config";
import { EmptyState, InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

export function CoApplicantTab({ applicant }: { applicant: LoanApplication }) {
  const coApplicants = applicant.coApplicants ?? [];

  return (
    <div className="space-y-6">
      <TabHeader
        eyebrow="Supporting Applicant"
        title="Co-Applicant Information"
      />

      {coApplicants.length === 0 ? (
        <EmptyState message="No co-applicant records found." />
      ) : (
        <div className="space-y-5">
          {coApplicants.map((coApplicant, index) => (
            <div
              key={coApplicant.id ?? index}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <h4 className="text-sm font-black text-slate-800 dark:text-white">
                  Co-Applicant {index + 1}
                </h4>

                <span className="rounded-full bg-red-600/10 px-3 py-1 text-[10px] font-black text-red-600">
                  {coApplicant.relationship || "Relationship N/A"}
                </span>
              </div>

              <InfoGrid>
                <InfoCard icon={User} label="Name" value={coApplicant.name} />
                <InfoCard
                  icon={Users}
                  label="Relationship"
                  value={coApplicant.relationship}
                />
                <InfoCard
                  icon={Phone}
                  label="Mobile"
                  value={coApplicant.mobile}
                />
                <InfoCard icon={Mail} label="Email" value={coApplicant.email} />
                <InfoCard
                  icon={IndianRupee}
                  label="Income"
                  value={formatINR(coApplicant.income)}
                />
                <InfoCard
                  icon={User}
                  label="Occupation"
                  value={coApplicant.occupation}
                />
                <InfoCard
                  icon={CreditCard}
                  label="CIBIL Score"
                  value={coApplicant.cibilScore}
                />
              </InfoGrid>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}