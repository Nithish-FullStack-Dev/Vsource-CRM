// app/(dashboard)/loan-application/all/[id]/_components/CoApplicantDialog.tsx

"use client";

import { useEffect } from "react";
import {
  Controller,
  useForm,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IndianRupee, Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

import {
  createLoanCoApplicant,
  updateLoanCoApplicant,
} from "@/services/loan-application/loan-application.service";

import type { CoApplicant, LoanApplication } from "./types";
type CoApplicantDialogProps = {
  applicant: LoanApplication;
  coApplicant: CoApplicant | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

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

const RELATIONSHIP_OPTIONS = [
  "Father",
  "Mother",
  "Spouse",
  "Brother",
  "Sister",
  "Guardian",
  "Other",
];

const GENDER_OPTIONS = ["Male", "Female", "Other"];

const EMPLOYMENT_OPTIONS = [
  "Salaried",
  "Self Employed",
  "Business",
  "Professional",
  "Retired",
  "Other",
];
function toDateInputValue(value?: string | Date | null): string {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function toOptionalNumber(value?: number | string | null): number | undefined {
  if (value === null || value === undefined || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function getFormValues(
  coApplicant?: CoApplicant | null,
): CoApplicantFormValues {
  if (!coApplicant) {
    return defaultValues;
  }

  return {
    name: coApplicant.name ?? "",
    relationship: coApplicant.relationship ?? "",
    mobile: coApplicant.mobile ?? "",
    altMobile: coApplicant.altMobile ?? "",
    email: coApplicant.email ?? "",
    dob: toDateInputValue(coApplicant.dob),
    gender: coApplicant.gender ?? "",
    pan: coApplicant.pan ?? "",
    aadhaar: coApplicant.aadhaar ?? "",
    address: coApplicant.address ?? "",
    city: coApplicant.city ?? "",
    state: coApplicant.state ?? "",
    pin: coApplicant.pin ?? "",
    employmentType: coApplicant.employmentType ?? "",
    occupation: coApplicant.occupation ?? "",
    employerName: coApplicant.employerName ?? "",
    designation: coApplicant.designation ?? "",
    monthlyIncome: toOptionalNumber(coApplicant.monthlyIncome),
    annualIncome: toOptionalNumber(coApplicant.annualIncome),
    existingEmi: toOptionalNumber(coApplicant.existingEmi),
    cibilScore: toOptionalNumber(coApplicant.cibilScore),
  };
}
function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-medium text-rose-600">{message}</p>;
}

export function CoApplicantDialog({
  applicant,
  coApplicant,
  open,
  onOpenChange,
}: CoApplicantDialogProps) {
  const queryClient = useQueryClient();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CoApplicantFormValues>({
    resolver: zodResolver(coApplicantSchema),
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const saveMutation = useMutation({
    mutationFn: (payload: CoApplicantFormValues) => {
      if (coApplicant?.id) {
        return updateLoanCoApplicant(applicant.id, coApplicant.id, payload);
      }

      return createLoanCoApplicant(applicant.id, payload);
    },
  });

  useEffect(() => {
    if (!open) return;

    reset(getFormValues(coApplicant));
    saveMutation.reset();
  }, [open, coApplicant, reset]);

  const handleDialogChange = (nextOpen: boolean) => {
    if (saveMutation.isPending) {
      return;
    }

    if (!nextOpen) {
      reset(defaultValues);
      saveMutation.reset();
    }

    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    if (saveMutation.isPending) {
      return;
    }

    reset(defaultValues);
    saveMutation.reset();
    onOpenChange(false);
  };
  function toSelectValue(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
  }
  const onSubmit = async (values: CoApplicantFormValues) => {
    saveMutation.reset();

    try {
      await saveMutation.mutateAsync(values);

      await queryClient.invalidateQueries({
        queryKey: ["loan-applications"],
      });

      await queryClient.invalidateQueries({
        queryKey: ["loan-application"],
      });

      toast.success(
        coApplicant
          ? "Co-applicant updated successfully"
          : "Co-applicant added successfully",
      );

      reset(defaultValues);
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : coApplicant
            ? "Unable to update co-applicant"
            : "Unable to add co-applicant",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="flex max-h-[94vh] w-[calc(100%-1rem)] max-w-5xl flex-col overflow-hidden p-0 sm:w-full">
        {/* Fixed Header */}

        <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <DialogTitle>
            {coApplicant ? "Edit Co-Applicant" : "Add Co-Applicant"}
          </DialogTitle>

          <DialogDescription>
            {coApplicant
              ? "Update the selected co-applicant information."
              : "Add personal, contact, identity, employment and financial information for the co-applicant."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="co-applicant-form"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* Scrollable Content */}

          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-5">
            {saveMutation.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
                {saveMutation.error instanceof Error
                  ? saveMutation.error.message
                  : "Unable to create co-applicant"}
              </div>
            )}

            {/* Personal Information */}

            <FormSection title="Personal Information">
              <FormField label="Full Name" error={errors.name?.message}>
                <Input
                  placeholder="Enter full name"
                  disabled={saveMutation.isPending}
                  {...register("name")}
                />
              </FormField>

              <FormField
                label="Relationship"
                error={errors.relationship?.message}
              >
                <Controller
                  name="relationship"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={toSelectValue(field.value)}
                      onValueChange={field.onChange}
                      disabled={saveMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>

                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField label="Date of Birth" error={errors.dob?.message}>
                <Input
                  type="date"
                  disabled={saveMutation.isPending}
                  {...register("dob")}
                />
              </FormField>

              <FormField label="Gender" error={errors.gender?.message}>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={toSelectValue(field.value)}
                      onValueChange={field.onChange}
                      disabled={saveMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>

                      <SelectContent>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>
            </FormSection>

            {/* Contact */}

            <FormSection title="Contact Information">
              <FormField label="Mobile Number" error={errors.mobile?.message}>
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter mobile number"
                  disabled={saveMutation.isPending}
                  {...register("mobile")}
                />
              </FormField>

              <FormField
                label="Alternate Mobile"
                error={errors.altMobile?.message}
              >
                <Input
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="Enter alternate mobile"
                  disabled={saveMutation.isPending}
                  {...register("altMobile")}
                />
              </FormField>

              <FormField label="Email Address" error={errors.email?.message}>
                <Input
                  type="email"
                  placeholder="Enter email address"
                  disabled={saveMutation.isPending}
                  {...register("email")}
                />
              </FormField>
            </FormSection>

            {/* Identity */}

            <FormSection title="Identity Information">
              <FormField label="PAN Number" error={errors.pan?.message}>
                <Input
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  className="uppercase"
                  disabled={saveMutation.isPending}
                  {...register("pan")}
                />
              </FormField>

              <FormField label="Aadhaar Number" error={errors.aadhaar?.message}>
                <Input
                  inputMode="numeric"
                  maxLength={12}
                  placeholder="Enter 12-digit Aadhaar"
                  disabled={saveMutation.isPending}
                  {...register("aadhaar")}
                />
              </FormField>
            </FormSection>

            {/* Address */}

            <FormSection title="Address Information">
              <FormField label="Address" error={errors.address?.message} wide>
                <Input
                  placeholder="Enter complete address"
                  disabled={saveMutation.isPending}
                  {...register("address")}
                />
              </FormField>

              <FormField label="City" error={errors.city?.message}>
                <Input
                  placeholder="Enter city"
                  disabled={saveMutation.isPending}
                  {...register("city")}
                />
              </FormField>

              <FormField label="State" error={errors.state?.message}>
                <Input
                  placeholder="Enter state"
                  disabled={saveMutation.isPending}
                  {...register("state")}
                />
              </FormField>

              <FormField label="PIN Code" error={errors.pin?.message}>
                <Input
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter PIN code"
                  disabled={saveMutation.isPending}
                  {...register("pin")}
                />
              </FormField>
            </FormSection>

            {/* Employment */}

            <FormSection title="Employment Information">
              <FormField
                label="Employment Type"
                error={errors.employmentType?.message}
              >
                <Controller
                  name="employmentType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={toSelectValue(field.value)}
                      onValueChange={field.onChange}
                      disabled={saveMutation.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employment type" />
                      </SelectTrigger>

                      <SelectContent>
                        {EMPLOYMENT_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField label="Occupation" error={errors.occupation?.message}>
                <Input
                  placeholder="Enter occupation"
                  disabled={saveMutation.isPending}
                  {...register("occupation")}
                />
              </FormField>

              <FormField
                label="Employer / Business"
                error={errors.employerName?.message}
              >
                <Input
                  placeholder="Enter employer or business"
                  disabled={saveMutation.isPending}
                  {...register("employerName")}
                />
              </FormField>

              <FormField
                label="Designation"
                error={errors.designation?.message}
              >
                <Input
                  placeholder="Enter designation"
                  disabled={saveMutation.isPending}
                  {...register("designation")}
                />
              </FormField>
            </FormSection>

            {/* Financial */}

            <FormSection title="Financial & Credit Information">
              <FormField
                label="Monthly Income"
                error={errors.monthlyIncome?.message}
              >
                <CurrencyInput
                  placeholder="Enter monthly income"
                  disabled={saveMutation.isPending}
                  registration={register("monthlyIncome")}
                />
              </FormField>

              <FormField
                label="Annual Income"
                error={errors.annualIncome?.message}
              >
                <CurrencyInput
                  placeholder="Enter annual income"
                  disabled={saveMutation.isPending}
                  registration={register("annualIncome")}
                />
              </FormField>

              <FormField
                label="Existing EMI"
                error={errors.existingEmi?.message}
              >
                <CurrencyInput
                  placeholder="Enter existing EMI"
                  disabled={saveMutation.isPending}
                  registration={register("existingEmi")}
                />
              </FormField>

              <FormField label="CIBIL Score" error={errors.cibilScore?.message}>
                <Input
                  type="number"
                  min="300"
                  max="900"
                  step="1"
                  placeholder="300 - 900"
                  disabled={saveMutation.isPending}
                  {...register("cibilScore")}
                />
              </FormField>
            </FormSection>
          </div>

          {/* Fixed Footer */}

          <DialogFooter className="shrink-0 border-t border-slate-100 px-5 py-4 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={saveMutation.isPending}
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>

            <Button
              type="submit"
              className="gap-2 bg-red-600 text-white hover:bg-red-700"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saveMutation.isPending
                ? "Saving..."
                : coApplicant
                  ? "Update Co-Applicant"
                  : "Save Co-Applicant"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
    <section className="space-y-4">
      <div className="border-b border-slate-100 pb-2 dark:border-slate-800">
        <h3 className="text-sm font-black text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
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
    <div
      className={wide ? "space-y-2 md:col-span-2 xl:col-span-3" : "space-y-2"}
    >
      <Label>{label}</Label>

      {children}

      <ErrorMessage message={error} />
    </div>
  );
}

type CurrencyInputProps = {
  placeholder: string;
  disabled: boolean;
  registration: UseFormRegisterReturn;
};

function CurrencyInput({
  placeholder,
  disabled,
  registration,
}: CurrencyInputProps) {
  return (
    <div className="relative">
      <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      <Input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        className="pl-9"
        placeholder={placeholder}
        disabled={disabled}
        {...registration}
      />
    </div>
  );
}
