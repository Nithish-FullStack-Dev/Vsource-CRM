// app/(dashboard)/student-profiles/[id]/StudentComplianceStep.tsx
"use client";

import {
  FileText,
  CreditCard,
  FileCheck2,
  User,
  FileSignature,
  FolderOpen,
} from "lucide-react";

const tabs = [
  { key: "info", label: "Basic", icon: User, color: "text-red-500" },
  {
    key: "documents",
    label: "Documents",
    icon: FolderOpen,
    color: "text-blue-500",
  },
  {
    key: "applications",
    label: "Uni Applications",
    icon: FileText,
    color: "text-emerald-500",
  },
  {
    key: "loan",
    label: "Loan Process",
    icon: CreditCard,
    color: "text-amber-500",
  },
  {
    key: "visa",
    label: "Visa Process",
    icon: FileCheck2,
    color: "text-purple-500",
  },
  {
    key: "remarks",
    label: "Remarks",
    icon: FileSignature,
    color: "text-rose-500",
  },
] as const;

type StudentDetailTab = (typeof tabs)[number]["key"];

type ComplianceStep = {
  key:
    | "walkin"
    | "document"
    | "applications"
    | "offer_received"
    | "loan"
    | "ihs"
    | "cas"
    | "disbursed"
    | "deposit"
    | "visa_approved";
  label: string;
};

const COMPLIANCE_STEPS: ComplianceStep[] = [
  { key: "walkin", label: "Walkin" },
  { key: "document", label: "Document" },
  { key: "applications", label: "Applications" },
  { key: "offer_received", label: "Offer Received" },
  { key: "loan", label: "Loan" },
  { key: "disbursed", label: "Disbursed" },
  { key: "deposit", label: "Deposit" },
  { key: "ihs", label: "IHS" },
  { key: "cas", label: "CAS" },
  { key: "visa_approved", label: "Visa Approved" },
];

type StudentComplianceStepperProps = {
  currentIndex: number;
  completedIndexes: Set<number>;
  loanRequired: boolean;
};

export default function StudentComplianceStepper({
  currentIndex,
  completedIndexes,
  loanRequired,
}: StudentComplianceStepperProps) {
  const complianceSteps = loanRequired
    ? COMPLIANCE_STEPS
    : COMPLIANCE_STEPS.filter(
        (step) => !["loan", "disbursed", "deposit"].includes(step.key),
      );

  const totalSteps = complianceSteps.length;
  const progressWidth = completedIndexes.has(totalSteps - 1)
    ? 102
    : currentIndex <= 0
      ? 0
      : ((currentIndex + 0.5) / totalSteps) * 100;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* 
        RESPONSIVE FIX:
        Added custom scrollbar hiding utilities so it scrolls cleanly on mobile
        without displaying a bulky scrollbar bar. 
      */}
      <div className="overflow-x-auto md:overflow-x-visible scroll-smooth">
        {/* 
          RESPONSIVE FIX: 
          Added `min-w-[800px]` (or `min-w-max`). This forces the stepper to maintain 
          its minimum structural width, triggering the horizontal scroll on small screens 
          instead of squishing the circles and text together.
        */}
        <div className="w-full min-w-200 px-4 py-6 md:px-6 md:py-8">
          <div className="relative">
            {/* STEP LABELS */}
            <div
              className="grid w-full"
              style={{
                gridTemplateColumns: `repeat(${complianceSteps.length}, minmax(0,1fr))`,
              }}
            >
              {complianceSteps.map((step, index) => {
                const isCompleted = completedIndexes.has(index);
                const isCurrent =
                  currentIndex < complianceSteps.length &&
                  index === currentIndex;

                return (
                  <div
                    key={step.key}
                    className="flex min-w-0 justify-center px-1 text-center"
                  >
                    <span
                      className={`whitespace-nowrap text-[10px] font-black uppercase tracking-tight ${
                        isCurrent
                          ? "text-red-600"
                          : isCompleted
                            ? "text-emerald-600"
                            : "text-slate-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* STEPPER */}
            <div className="relative mt-5">
              {/* BACKGROUND LINE */}
              <div className="absolute left-5 right-5 top-5 h-3 -translate-y-1/2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                {/* ACTIVE PROGRESS LINE */}
                <div
                  className="h-full rounded-full bg-red-600 transition-[width] duration-700 ease-in-out"
                  style={{
                    width: `${progressWidth}%`,
                  }}
                />
              </div>

              {/* STEP CIRCLES */}
              <div
                className="relative grid w-full"
                style={{
                  gridTemplateColumns: `repeat(${complianceSteps.length}, minmax(0,1fr))`,
                }}
              >
                {complianceSteps.map((step, index) => {
                  const isCompleted = completedIndexes.has(index);
                  const isCurrent =
                    currentIndex < complianceSteps.length &&
                    index === currentIndex;
                  const isLastStep = index === complianceSteps.length - 1;
                  const isFullyCompleted = isLastStep && isCompleted;
                  return (
                    <div
                      key={step.key}
                      className="relative flex min-w-0 flex-col items-center"
                    >
                      <div
                        className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                          isFullyCompleted
                            ? "border-red-600 bg-red-600 text-white shadow-md"
                            : isCurrent
                              ? "border-red-600 bg-white dark:bg-slate-900"
                              : isCompleted
                                ? "border-red-600 bg-red-600 text-white shadow-md"
                                : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                        }`}
                      >
                        {isFullyCompleted ? (
                          <span className="text-xs font-black">✓</span>
                        ) : isCurrent ? (
                          <>
                            <span className="absolute -inset-2 -z-10 animate-ping rounded-full bg-red-500/25" />
                            <span className="absolute -inset-2 -z-10 rounded-full bg-red-500/15" />
                            <span className="h-3 w-3 rounded-full bg-red-600" />
                          </>
                        ) : isCompleted ? (
                          <span className="text-xs font-black">✓</span>
                        ) : null}
                      </div>

                      {/* CURRENT STAGE INDICATOR */}
                      {isCurrent && !isFullyCompleted && (
                        <div className="absolute top-10 flex flex-col items-center whitespace-nowrap">
                          <span className="text-[10px] leading-none text-red-600">
                            ▲
                          </span>
                          <span className="mt-1 text-[9px] font-black uppercase tracking-widest text-red-600">
                            Current Stage
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SPACE FOR CURRENT STAGE LABEL */}
            <div className="h-12" />
          </div>
        </div>
      </div>
    </div>
  );
}
