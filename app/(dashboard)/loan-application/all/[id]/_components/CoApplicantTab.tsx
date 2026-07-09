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

  const [adding, setAdding] = useState(false);

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
      setAdding(false);
    },
  });

  const handleCancel = () => {
    reset(defaultValues);
    setAdding(false);
  };

  const onSubmit = async (values: CoApplicantFormValues) => {
    await createMutation.mutateAsync(values);
  };

  return (
    <div className="space-y-6">
      <TabHeader
        eyebrow="Supporting Applicant"
        title="Co-Applicant Information"
        action={
          adding ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleCancel}
              disabled={createMutation.isPending}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={() => setAdding(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Co-Applicant
            </Button>
          )
        }
      />

      {adding && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6 rounded-2xl border bg-slate-50/50 p-4 md:p-6 dark:bg-slate-950/50"
        >
          <FormSection title="Personal Information">
            <FormField label="Full Name" error={errors.name?.message}>
              <Input placeholder="Enter full name" {...register("name")} />
            </FormField>

            <FormField
              label="Relationship"
              error={errors.relationship?.message}
            >
              <Select
                value={relationship}
                onValueChange={(value) =>
                  setValue("relationship", value, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
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

            <FormField label="Date of Birth">
              <Input type="date" {...register("dob")} />
            </FormField>

            <FormField label="Gender">
              <Select
                value={gender}
                onValueChange={(value) => setValue("gender", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </FormSection>

          <FormSection title="Contact Information">
            <FormField label="Mobile Number" error={errors.mobile?.message}>
              <Input
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter mobile number"
                {...register("mobile")}
              />
            </FormField>

            <FormField label="Alternate Mobile">
              <Input
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

          <FormSection title="Identity Information">
            <FormField label="PAN Number" error={errors.pan?.message}>
              <Input
                maxLength={10}
                placeholder="ABCDE1234F"
                className="uppercase"
                {...register("pan")}
              />
            </FormField>

            <FormField label="Aadhaar Number" error={errors.aadhaar?.message}>
              <Input
                inputMode="numeric"
                maxLength={12}
                placeholder="Enter 12-digit Aadhaar"
                {...register("aadhaar")}
              />
            </FormField>
          </FormSection>

          <FormSection title="Address Information">
            <FormField label="Address" wide>
              <Input
                placeholder="Enter complete address"
                {...register("address")}
              />
            </FormField>

            <FormField label="City">
              <Input placeholder="Enter city" {...register("city")} />
            </FormField>

            <FormField label="State">
              <Input placeholder="Enter state" {...register("state")} />
            </FormField>

            <FormField label="PIN Code" error={errors.pin?.message}>
              <Input
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter PIN code"
                {...register("pin")}
              />
            </FormField>
          </FormSection>

          <FormSection title="Employment Information">
            <FormField label="Employment Type">
              <Select
                value={employmentType}
                onValueChange={(value) => setValue("employmentType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employment type" />
                </SelectTrigger>

                <SelectContent>
                  <SelectItem value="Salaried">Salaried</SelectItem>
                  <SelectItem value="Self Employed">Self Employed</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Occupation">
              <Input
                placeholder="Enter occupation"
                {...register("occupation")}
              />
            </FormField>

            <FormField label="Employer / Business">
              <Input
                placeholder="Enter employer or business"
                {...register("employerName")}
              />
            </FormField>

            <FormField label="Designation">
              <Input
                placeholder="Enter designation"
                {...register("designation")}
              />
            </FormField>
          </FormSection>

          <FormSection title="Financial & Credit Information">
            <FormField label="Monthly Income">
              <Input
                type="number"
                min="0"
                placeholder="Enter monthly income"
                {...register("monthlyIncome")}
              />
            </FormField>

            <FormField label="Annual Income">
              <Input
                type="number"
                min="0"
                placeholder="Enter annual income"
                {...register("annualIncome")}
              />
            </FormField>

            <FormField label="Existing EMI">
              <Input
                type="number"
                min="0"
                placeholder="Enter existing EMI"
                {...register("existingEmi")}
              />
            </FormField>

            <FormField label="CIBIL Score" error={errors.cibilScore?.message}>
              <Input
                type="number"
                min="300"
                max="900"
                placeholder="300 - 900"
                {...register("cibilScore")}
              />
            </FormField>
          </FormSection>

          <div className="flex justify-end border-t pt-5">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full gap-2 sm:w-auto"
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
          </div>
        </form>
      )}

      {coApplicants.length === 0 ? (
        <EmptyState message="No co-applicant records found." />
      ) : (
        <div className="space-y-5">
          {coApplicants.map((coApplicant, index) => (
            <div
              key={coApplicant.id ?? index}
              className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="mb-5 flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-400">
                    Co-Applicant {index + 1}
                  </p>

                  <h4 className="mt-1 text-base font-black">
                    {coApplicant.name}
                  </h4>
                </div>

                <span className="w-fit rounded-full bg-red-600/10 px-3 py-1 text-[10px] font-black text-red-600">
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

                <InfoCard
                  icon={Landmark}
                  label="Employer"
                  value={coApplicant.employerName}
                />

                <InfoCard
                  icon={CalendarDays}
                  label="Date of Birth"
                  value={coApplicant.dob}
                />

                <InfoCard
                  icon={MapPin}
                  label="City / State"
                  value={
                    [coApplicant.city, coApplicant.state]
                      .filter(Boolean)
                      .join(", ") || null
                  }
                />
              </InfoGrid>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="border-b pb-2">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {children}
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  wide = false,
  children,
}: {
  label: string;
  error?: string;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={wide ? "space-y-2 md:col-span-2" : "space-y-2"}>
      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">
        {label}
      </label>

      {children}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}
