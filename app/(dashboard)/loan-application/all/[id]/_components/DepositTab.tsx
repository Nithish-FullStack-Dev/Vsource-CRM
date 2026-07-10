// app\(dashboard)\loan-application\all\[id]\_components\DepositTab.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BriefcaseBusiness,
  CalendarDays,
  CreditCard,
  IndianRupee,
  Landmark,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  User,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  coApplicantSchema,
  type CoApplicantFormValues,
} from "@/schemas/loan-application/loan-application.schema";

import { createLoanCoApplicant } from "@/services/loan-application/loan-application.service";

import { formatINR } from "./config";
import { EmptyState, InfoCard, InfoGrid, TabHeader } from "./ProfileUI";

import type { LoanApplication } from "./types";

const defaultValues: CoApplicantFormValues = {
  name: "",
  relationship: "",
  mobile: "",
  altMobile: "",
  email: "",
  dob: "",
  gender: "",
  pan: "",
  aadhaar: "",
  address: "",
  city: "",
  state: "",
  pin: "",
  employmentType: "",
  occupation: "",
  employerName: "",
  designation: "",
  monthlyIncome: undefined,
  annualIncome: undefined,
  existingEmi: undefined,
  cibilScore: undefined,
};

export function CoApplicantTab({ applicant }: { applicant: LoanApplication }) {
  const coApplicants = applicant.coApplicants ?? [];

  const [dialogOpen, setDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CoApplicantFormValues>({
    resolver: zodResolver(coApplicantSchema),
    defaultValues,
  });

  const gender = watch("gender");
  const relationship = watch("relationship");
  const employmentType = watch("employmentType");

  const createMutation = useMutation({
    mutationFn: (payload: CoApplicantFormValues) =>
      createLoanCoApplicant(applicant.id, payload),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["loan-application", applicant.id],
      });

      reset(defaultValues);
      setDialogOpen(false);
    },
  });

  const handleOpenDialog = () => {
    reset(defaultValues);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    if (createMutation.isPending) {
      return;
    }

    reset(defaultValues);
    setDialogOpen(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && createMutation.isPending) {
      return;
    }

    if (!open) {
      reset(defaultValues);
    }

    setDialogOpen(open);
  };

  const onSubmit = async (values: CoApplicantFormValues) => {
    await createMutation.mutateAsync(values);
  };

  return (
    <>
      <div className="space-y-6">
        <TabHeader
          eyebrow="Supporting Applicant"
          title="Co-Applicant Information"
          action={
            <Button
              type="button"
              size="sm"
              onClick={handleOpenDialog}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Co-Applicant
            </Button>
          }
        />

        {coApplicants.length === 0 ? (
          <EmptyState message="No co-applicant records found." />
        ) : (
          <div className="space-y-5">
            {coApplicants.map((coApplicant, index) => (
              <div
                key={coApplicant.id ?? index}
                className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600/10 text-red-600">
                      <User className="h-5 w-5" />
                    </div>

                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Co-Applicant {index + 1}
                      </p>

                      <h4 className="mt-0.5 text-base font-black text-slate-900 dark:text-white">
                        {coApplicant.name}
                      </h4>
                    </div>
                  </div>

                  <span className="w-fit rounded-full bg-red-600/10 px-3 py-1 text-[10px] font-black text-red-600">
                    {coApplicant.relationship || "Relationship N/A"}
                  </span>
                </div>

                <div className="p-5">
                  <InfoGrid>
                    <InfoCard
                      icon={User}
                      label="Name"
                      value={coApplicant.name}
                    />

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

                    <InfoCard
                      icon={Mail}
                      label="Email"
                      value={coApplicant.email}
                    />

                    <InfoCard
                      icon={BriefcaseBusiness}
                      label="Occupation"
                      value={coApplicant.occupation}
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
                      icon={CreditCard}
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
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="flex max-h-[95vh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-2rem)]">
          <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4 pr-12 sm:px-6 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10 text-red-600">
                <Users className="h-5 w-5" />
              </div>

              <div>
                <DialogTitle className="text-left text-lg font-black text-slate-900 dark:text-white">
                  Add Co-Applicant
                </DialogTitle>

                <DialogDescription className="mt-1 text-left text-xs">
                  Add personal, contact, employment, financial and credit
                  information.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form
            id="co-applicant-form"
            onSubmit={handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-4 py-5 sm:px-6">
              <FormSection
                title="Personal Information"
                description="Basic details and relationship with the primary applicant."
              >
                <FormField
                  label="Full Name"
                  required
                  error={errors.name?.message}
                >
                  <Input placeholder="Enter full name" {...register("name")} />
                </FormField>

                <FormField
                  label="Relationship"
                  required
                  error={errors.relationship?.message}
                >
                  <Select
                    value={relationship || ""}
                    onValueChange={(value) =>
                      setValue("relationship", value, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Brother">Brother</SelectItem>
                      <SelectItem value="Sister">Sister</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Date of Birth" error={errors.dob?.message}>
                  <Input type="date" {...register("dob")} />
                </FormField>

              </FormSection>

              <FormSection
                title="Contact Information"
                description="Mobile and email communication details."
              >
                <FormField
                  label="Mobile Number"
                  required
                  error={errors.mobile?.message}
                >
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    {...register("mobile")}
                  />
                </FormField>

                <FormField
                  label="Alternate Mobile"
                  error={errors.altMobile?.message}
                >
                  <Input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter alternate mobile"
                    {...register("altMobile")}
                  />
                </FormField>

                <FormField label="Email Address" error={errors.email?.message}>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    {...register("email")}
                  />
                </FormField>
              </FormSection>

              <FormSection
                title="Identity Information"
                description="Government identity and verification details."
              >
                <FormField label="PAN Number" error={errors.pan?.message}>
                  <Input
                    maxLength={10}
                    placeholder="ABCDE1234F"
                    className="uppercase"
                    {...register("pan")}
                  />
                </FormField>

                <FormField
                  label="Aadhaar Number"
                  error={errors.aadhaar?.message}
                >
                  <Input
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="Enter 12-digit Aadhaar"
                    {...register("aadhaar")}
                  />
                </FormField>
              </FormSection>

              <FormSection
                title="Address Information"
                description="Current residential location details."
              >
                <FormField
                  label="Complete Address"
                  error={errors.address?.message}
                  wide
                >
                  <Input
                    placeholder="House number, street, area"
                    {...register("address")}
                  />
                </FormField>

                <FormField label="City" error={errors.city?.message}>
                  <Input placeholder="Enter city" {...register("city")} />
                </FormField>

                <FormField label="State" error={errors.state?.message}>
                  <Input placeholder="Enter state" {...register("state")} />
                </FormField>

                <FormField label="PIN Code" error={errors.pin?.message}>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter 6-digit PIN code"
                    {...register("pin")}
                  />
                </FormField>
              </FormSection>

              <FormSection
                title="Employment Information"
                description="Occupation and current employment details."
              >

                <FormField
                  label="Occupation"
                  error={errors.occupation?.message}
                >
                  <Input
                    placeholder="Enter occupation"
                    {...register("occupation")}
                  />
                </FormField>

                <FormField
                  label="Employer / Business"
                  error={errors.employerName?.message}
                >
                  <Input
                    placeholder="Enter employer or business name"
                    {...register("employerName")}
                  />
                </FormField>

                <FormField
                  label="Designation"
                  error={errors.designation?.message}
                >
                  <Input
                    placeholder="Enter designation"
                    {...register("designation")}
                  />
                </FormField>
              </FormSection>

              <FormSection
                title="Financial & Credit Information"
                description="Income, existing liabilities and credit score."
              >
                <FormField
                  label="Monthly Income"
                  error={errors.monthlyIncome?.message}
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Enter monthly income"
                    {...register("monthlyIncome")}
                  />
                </FormField>

                <FormField
                  label="Annual Income"
                  error={errors.annualIncome?.message}
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Enter annual income"
                    {...register("annualIncome")}
                  />
                </FormField>

                <FormField
                  label="Existing EMI"
                  error={errors.existingEmi?.message}
                >
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="Enter existing EMI"
                    {...register("existingEmi")}
                  />
                </FormField>

                <FormField
                  label="CIBIL Score"
                  error={errors.cibilScore?.message}
                >
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="300"
                    max="900"
                    placeholder="300 - 900"
                    {...register("cibilScore")}
                  />
                </FormField>
              </FormSection>
            </div>

            <DialogFooter className="shrink-0 flex-row justify-end gap-2 border-t border-slate-100 bg-white px-4 py-4 sm:px-6 dark:border-slate-800 dark:bg-slate-950">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={createMutation.isPending}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="gap-2"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Co-Applicant
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-slate-100 pb-3 dark:border-slate-800">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

function FormField({
  label,
  error,
  required = false,
  wide = false,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
        {label}

        {required && <span className="ml-1 text-red-600">*</span>}
      </label>

      {children}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
