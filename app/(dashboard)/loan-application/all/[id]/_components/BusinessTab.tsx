"use client";

import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import {
  Building2,
  CheckCircle2,
  CreditCard,
  IndianRupee,
  Loader2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";
import { useUpdateLoanBusinessDetails } from "@/hooks/loan-application/useLoanBusinessDetails";
import type { UpdateLoanBusinessPayload } from "@/types/loan-application/business.types";

type BusinessFormState = {
  businessName: string;
  businessType: string;
  registrationType: string;
  registrationNumber: string;
  yearsInBusiness: string;
  annualTurnover: string;
  annualIncome: string;
  existingEmi: string;
  businessAddress: string;
};

type BusinessFormErrors = Partial<Record<keyof BusinessFormState, string>>;

const toInputValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const createFormState = (applicant: LoanApplication): BusinessFormState => ({
  businessName: applicant.businessName || "",
  businessType: applicant.businessType || "",
  registrationType: applicant.registrationType || "",
  registrationNumber: applicant.registrationNumber || "",
  yearsInBusiness: applicant.yearsInBusiness || "",
  annualTurnover: toInputValue(applicant.annualTurnover),
  annualIncome: toInputValue(applicant.annualIncome),
  existingEmi: toInputValue(applicant.existingEmi),
  businessAddress: applicant.businessAddress || "",
});

const trimToNull = (value: string) => {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
};

const amountToNull = (value: string) => {
  const trimmedValue = value.trim();

  return trimmedValue ? trimmedValue : null;
};

const validateAmount = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) {
    return "Enter a valid amount with up to 2 decimal places";
  }

  if (Number(value) < 0) {
    return "Amount cannot be negative";
  }

  return null;
};

export function BusinessTab({ applicant }: { applicant: LoanApplication }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState<BusinessFormState>(() =>
    createFormState(applicant),
  );
  const [errors, setErrors] = useState<BusinessFormErrors>({});
  const [successMessage, setSuccessMessage] = useState("");

  const updateBusiness = useUpdateLoanBusinessDetails(applicant.id);

  useEffect(() => {
    if (!isEditing) {
      setForm(createFormState(applicant));
    }
  }, [applicant, isEditing]);

  const handleChange =
    (field: keyof BusinessFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;

      setForm((current) => ({
        ...current,
        [field]: value,
      }));

      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));

      setSuccessMessage("");
    };

  const validateForm = () => {
    const nextErrors: BusinessFormErrors = {};

    const annualTurnoverError = validateAmount(form.annualTurnover);
    const annualIncomeError = validateAmount(form.annualIncome);
    const existingEmiError = validateAmount(form.existingEmi);

    if (annualTurnoverError) {
      nextErrors.annualTurnover = annualTurnoverError;
    }

    if (annualIncomeError) {
      nextErrors.annualIncome = annualIncomeError;
    }

    if (existingEmiError) {
      nextErrors.existingEmi = existingEmiError;
    }

    if (
      form.yearsInBusiness.trim() &&
      (!/^\d+$/.test(form.yearsInBusiness.trim()) ||
        Number(form.yearsInBusiness) < 0)
    ) {
      nextErrors.yearsInBusiness = "Enter valid years in business";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    const payload: UpdateLoanBusinessPayload = {
      businessName: trimToNull(form.businessName),
      businessType: trimToNull(form.businessType),
      registrationType: trimToNull(form.registrationType),
      registrationNumber: trimToNull(form.registrationNumber),
      yearsInBusiness: trimToNull(form.yearsInBusiness),
      annualTurnover: amountToNull(form.annualTurnover),
      annualIncome: amountToNull(form.annualIncome),
      existingEmi: amountToNull(form.existingEmi),
      businessAddress: trimToNull(form.businessAddress),
    };

    try {
      await updateBusiness.mutateAsync(payload);
      setSuccessMessage("Business details updated successfully.");
      setIsEditing(false);
    } catch {
      setSuccessMessage("");
    }
  };

  const handleCancel = () => {
    setForm(createFormState(applicant));
    setErrors({});
    setSuccessMessage("");
    setIsEditing(false);
    updateBusiness.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <TabHeader eyebrow="Self Employed Profile" title="Business Details" />

        {!isEditing && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              setSuccessMessage("");
              setIsEditing(true);
            }}
          >
            <Pencil className="h-4 w-4" />
            Edit Business Details
          </Button>
        )}
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMessage}
        </div>
      )}

      {updateBusiness.isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
          {updateBusiness.error.message}
        </div>
      )}

      {isEditing ? (
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={form.businessName}
                onChange={handleChange("businessName")}
                placeholder="Enter business name"
                disabled={updateBusiness.isPending}
              />
              {errors.businessName && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.businessName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input
                id="businessType"
                value={form.businessType}
                onChange={handleChange("businessType")}
                placeholder="Proprietorship, partnership, company"
                disabled={updateBusiness.isPending}
              />
              {errors.businessType && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.businessType}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationType">Registration Type</Label>
              <Input
                id="registrationType"
                value={form.registrationType}
                onChange={handleChange("registrationType")}
                placeholder="GST, UDYAM, CIN"
                disabled={updateBusiness.isPending}
              />
              {errors.registrationType && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.registrationType}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="registrationNumber">Registration Number</Label>
              <Input
                id="registrationNumber"
                value={form.registrationNumber}
                onChange={handleChange("registrationNumber")}
                placeholder="Enter registration number"
                disabled={updateBusiness.isPending}
              />
              {errors.registrationNumber && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.registrationNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="yearsInBusiness">Years in Business</Label>
              <Input
                id="yearsInBusiness"
                type="number"
                min="0"
                step="1"
                value={form.yearsInBusiness}
                onChange={handleChange("yearsInBusiness")}
                placeholder="Enter years"
                disabled={updateBusiness.isPending}
              />
              {errors.yearsInBusiness && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.yearsInBusiness}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualTurnover">Annual Turnover</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="annualTurnover"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  value={form.annualTurnover}
                  onChange={handleChange("annualTurnover")}
                  placeholder="Enter annual turnover"
                  disabled={updateBusiness.isPending}
                />
              </div>
              {errors.annualTurnover && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.annualTurnover}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="annualIncome">Annual Income</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="annualIncome"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  value={form.annualIncome}
                  onChange={handleChange("annualIncome")}
                  placeholder="Enter annual income"
                  disabled={updateBusiness.isPending}
                />
              </div>
              {errors.annualIncome && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.annualIncome}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="existingEmi">Existing EMI</Label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="existingEmi"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  value={form.existingEmi}
                  onChange={handleChange("existingEmi")}
                  placeholder="Enter existing EMI"
                  disabled={updateBusiness.isPending}
                />
              </div>
              {errors.existingEmi && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.existingEmi}
                </p>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="businessAddress">Business Address</Label>
              <Textarea
                id="businessAddress"
                rows={4}
                value={form.businessAddress}
                onChange={handleChange("businessAddress")}
                placeholder="Enter complete business address"
                disabled={updateBusiness.isPending}
              />
              {errors.businessAddress && (
                <p className="text-xs font-medium text-rose-600">
                  {errors.businessAddress}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={handleCancel}
              disabled={updateBusiness.isPending}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>

            <Button
              type="submit"
              className="gap-2 bg-red-600 text-white hover:bg-red-700"
              disabled={updateBusiness.isPending}
            >
              {updateBusiness.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {updateBusiness.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <InfoGrid>
            <InfoCard
              icon={Building2}
              label="Business Name"
              value={applicant.businessName}
            />
            <InfoCard
              icon={Building2}
              label="Business Type"
              value={applicant.businessType}
            />
            <InfoCard
              icon={CreditCard}
              label="Registration Type"
              value={applicant.registrationType}
            />
            <InfoCard
              icon={CreditCard}
              label="Registration Number"
              value={applicant.registrationNumber}
            />
            <InfoCard
              icon={Building2}
              label="Years in Business"
              value={applicant.yearsInBusiness}
            />
            <InfoCard
              icon={IndianRupee}
              label="Annual Turnover"
              value={formatINR(applicant.annualTurnover)}
            />
            <InfoCard
              icon={IndianRupee}
              label="Annual Income"
              value={formatINR(applicant.annualIncome)}
            />
            <InfoCard
              icon={IndianRupee}
              label="Existing EMI"
              value={formatINR(applicant.existingEmi)}
            />
          </InfoGrid>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Business Address
            </p>

            <p className="mt-2 whitespace-pre-line text-sm font-semibold text-slate-700 dark:text-slate-200">
              {applicant.businessAddress || "Not provided"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
