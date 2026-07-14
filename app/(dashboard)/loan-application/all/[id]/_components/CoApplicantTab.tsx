// app\(dashboard)\loan-application\all\[id]\_components\CoApplicantTab.tsx
"use client";

import { useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  Home,
  IndianRupee,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  User,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import { formatINR } from "./config";
import { EmptyState, InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import { CoApplicantDialog } from "./CoApplicantDialog";

import type { CoApplicant, LoanApplication } from "./types";
import { MODULES } from "@/lib/module-codes";

function formatDate(value?: string | Date | null): string | undefined {
  if (!value) return undefined;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return undefined;

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function CoApplicantTab({
  applicant,
  canCreate,
  canUpdate,
}: {
  applicant: LoanApplication;
  canUpdate: (moduleCode: string) => boolean;
  canCreate: (moduleCode: string) => boolean;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedCoApplicant, setSelectedCoApplicant] =
    useState<CoApplicant | null>(null);

  const coApplicants = applicant.coApplicants ?? [];

  const handleAdd = () => {
    setSelectedCoApplicant(null);
    setDialogOpen(true);
  };

  const handleEdit = (coApplicant: CoApplicant) => {
    setSelectedCoApplicant(coApplicant);
    setDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setDialogOpen(open);

    if (!open) {
      setSelectedCoApplicant(null);
    }
  };

  return (
    <div className="space-y-6">
      <TabHeader
        eyebrow="Supporting Applicant"
        title="Co-Applicant Information"
        action={
          coApplicants.length === 0 ? (
            canCreate(MODULES.LOAN_APPLICATION) ? (
              <Button
                type="button"
                size="sm"
                className="gap-2 bg-red-600 text-white hover:bg-red-700"
                onClick={handleAdd}
              >
                <Plus className="h-4 w-4" />
                Add Co-Applicant
              </Button>
            ) : null
          ) : canUpdate(MODULES.LOAN_APPLICATION) ? (
            <Button
              type="button"
              size="sm"
              className="gap-2 bg-red-600 text-white hover:bg-red-700"
              onClick={() => handleEdit(coApplicants[0])}
            >
              <Pencil className="h-4 w-4" />
              Edit Co-Applicant
            </Button>
          ) : null
        }
      />

      {coApplicants.length === 0 ? (
        <EmptyState message="No co-applicant records found." />
      ) : (
        <div className="space-y-6">
          {coApplicants.map((coApplicant, index) => (
            <div
              key={coApplicant.id ?? index}
              className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600/10 text-red-600">
                    <User className="h-5 w-5" />
                  </div>

                  <div>
                    <h4 className="mt-1 text-base font-black text-slate-900 dark:text-white">
                      {coApplicant.name || "Unnamed Co-Applicant"}
                    </h4>
                  </div>
                </div>

                <span className="w-fit rounded-full bg-red-600/10 px-3 py-1.5 text-[10px] font-black text-red-600">
                  {coApplicant.relationship || "Relationship N/A"}
                </span>
              </div>

              <div className="p-5">
                <InfoGrid>
                  <InfoCard
                    icon={User}
                    label="Full Name"
                    value={coApplicant.name}
                  />

                  <InfoCard
                    icon={Users}
                    label="Relationship"
                    value={coApplicant.relationship}
                  />

                  <InfoCard
                    icon={CalendarDays}
                    label="Date of Birth"
                    value={formatDate(coApplicant.dob)}
                  />

                  <InfoCard
                    icon={User}
                    label="Gender"
                    value={coApplicant.gender}
                  />

                  <InfoCard
                    icon={Phone}
                    label="Mobile"
                    value={coApplicant.mobile}
                  />

                  <InfoCard
                    icon={Phone}
                    label="Alternate Mobile"
                    value={coApplicant.altMobile}
                  />

                  <InfoCard
                    icon={Mail}
                    label="Email"
                    value={coApplicant.email}
                  />

                  <InfoCard
                    icon={CreditCard}
                    label="PAN Number"
                    value={coApplicant.pan}
                  />

                  <InfoCard
                    icon={CreditCard}
                    label="Aadhaar Number"
                    value={coApplicant.aadhaar}
                  />

                  <InfoCard
                    icon={Home}
                    label="Address"
                    value={coApplicant.address}
                  />

                  <InfoCard
                    icon={MapPin}
                    label="City"
                    value={coApplicant.city}
                  />

                  <InfoCard
                    icon={MapPin}
                    label="State"
                    value={coApplicant.state}
                  />

                  <InfoCard
                    icon={MapPin}
                    label="PIN Code"
                    value={coApplicant.pin}
                  />

                  <InfoCard
                    icon={BriefcaseBusiness}
                    label="Employment Type"
                    value={coApplicant.employmentType}
                  />

                  <InfoCard
                    icon={BriefcaseBusiness}
                    label="Occupation"
                    value={coApplicant.occupation}
                  />

                  <InfoCard
                    icon={BriefcaseBusiness}
                    label="Employer / Business"
                    value={coApplicant.employerName}
                  />

                  <InfoCard
                    icon={BriefcaseBusiness}
                    label="Designation"
                    value={coApplicant.designation}
                  />

                  <InfoCard
                    icon={IndianRupee}
                    label="Monthly Income"
                    value={formatINR(coApplicant.monthlyIncome)}
                  />

                  <InfoCard
                    icon={IndianRupee}
                    label="Annual Income"
                    value={formatINR(coApplicant.annualIncome)}
                  />

                  <InfoCard
                    icon={IndianRupee}
                    label="Existing EMI"
                    value={formatINR(coApplicant.existingEmi)}
                  />

                  <InfoCard
                    icon={CreditCard}
                    label="CIBIL Score"
                    value={coApplicant.cibilScore}
                  />
                </InfoGrid>
              </div>
            </div>
          ))}
        </div>
      )}

      <CoApplicantDialog
        applicant={applicant}
        coApplicant={selectedCoApplicant}
        open={dialogOpen}
        onOpenChange={handleDialogChange}
      />
    </div>
  );
}
