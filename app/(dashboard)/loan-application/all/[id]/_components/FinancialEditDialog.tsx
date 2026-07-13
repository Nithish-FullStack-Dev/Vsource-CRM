"use client";

import { useEffect, useMemo } from "react";
import { IndianRupee, Loader2, Save, X } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  createFinancialEditSchema,
  type FinancialEditInput,
  type FinancialEditValues,
} from "@/schemas/loan-application/loan-application.schema";
import { useUpdateLoanFinancialDetails } from "@/hooks/loan-application/useLoanFinancialDetails";
import type { UpdateLoanFinancialPayload } from "@/types/loan-application/financial.types";
import type { LoanApplication } from "./types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LOAN_PREFERENCE_OPTIONS,
  YES_NO_OPTIONS,
} from "@/(dashboard)/loan-application/add/page";

type FinancialEditDialogProps = {
  applicant: LoanApplication;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const toInputValue = (value: unknown) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
};

const createDefaultValues = (
  applicant: LoanApplication,
): FinancialEditInput => ({
  tuitionFee: toInputValue(applicant.tuitionFee),
  livingExpenses: toInputValue(applicant.livingExpenses),
  otherExpenses: toInputValue(applicant.otherExpenses),
  totalCourseCost: toInputValue(applicant.totalCourseCost),
  ownContribution: toInputValue(applicant.ownContribution),
  requiredLoanAmount: toInputValue(applicant.requiredLoanAmount),
  loanPreference: toInputValue(applicant.loanPreference),
  collateralAvailable: toInputValue(applicant.collateralAvailable),
  loanPurpose: toInputValue(applicant.loanPurpose),
  preferredTenure: toInputValue(applicant.preferredTenure),
  cibilScore: toInputValue(applicant.cibilScore),
  propertyType: toInputValue(applicant.propertyType),
  propertyLocation: toInputValue(applicant.propertyLocation),
  propertyValue: toInputValue(applicant.propertyValue),
  downPayment: toInputValue(applicant.downPayment),
});

const parseOptionalNumber = (value: unknown) => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const number = Number(value);

  return Number.isNaN(number) ? value : number;
};

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs font-medium text-rose-600">{message}</p>;
}

export function FinancialEditDialog({
  applicant,
  open,
  onOpenChange,
}: FinancialEditDialogProps) {
  const financialEditSchema = useMemo(
    () => createFinancialEditSchema(applicant.loanCategory),
    [applicant.loanCategory],
  );

  const {
    mutateAsync,
    isPending,
    isError,
    error,
    reset: resetMutation,
  } = useUpdateLoanFinancialDetails(applicant.id);

  const {
    control,
    register,
    handleSubmit,
    reset,
    clearErrors,
    formState: { errors },
  } = useForm<FinancialEditInput, unknown, FinancialEditValues>({
    resolver: zodResolver(financialEditSchema),
    defaultValues: createDefaultValues(applicant),
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (open) {
      reset(createDefaultValues(applicant));
      resetMutation();
    }
  }, [open, applicant, reset, resetMutation]);

  const handleDialogChange = (nextOpen: boolean) => {
    if (isPending) {
      return;
    }

    if (!nextOpen) {
      reset(createDefaultValues(applicant));
      resetMutation();
    }

    onOpenChange(nextOpen);
  };

  const handleCancel = () => {
    if (isPending) {
      return;
    }

    reset(createDefaultValues(applicant));
    resetMutation();
    onOpenChange(false);
  };

  const onSubmit = async (values: FinancialEditValues) => {
    resetMutation();

    const payload: UpdateLoanFinancialPayload = {
      tuitionFee: values.tuitionFee ?? null,
      livingExpenses: values.livingExpenses ?? null,
      otherExpenses: values.otherExpenses ?? null,
      totalCourseCost: values.totalCourseCost ?? null,
      ownContribution: values.ownContribution ?? null,
      requiredLoanAmount: values.requiredLoanAmount ?? null,
      loanPreference: values.loanPreference ?? null,
      collateralAvailable: values.collateralAvailable ?? null,
      loanPurpose: values.loanPurpose ?? null,
      preferredTenure: values.preferredTenure ?? null,
      cibilScore: values.cibilScore ?? null,
      propertyType: values.propertyType ?? null,
      propertyLocation: values.propertyLocation ?? null,
      propertyValue: values.propertyValue ?? null,
      downPayment: values.downPayment ?? null,
    };

    try {
      await mutateAsync(payload);
      toast.success("Financial details updated successfully");
      onOpenChange(false);
    } catch {
      toast.error("Unable to update financial details");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="flex max-h-[94vh] w-[calc(100%-1rem)] max-w-5xl flex-col overflow-hidden p-4 sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit Financial Details</DialogTitle>
          <DialogDescription>
            Update the loan requirement, financial contribution, credit and
            property information.
          </DialogDescription>
        </DialogHeader>

        <form
          id="financial-edit-form"
          className="space-y-6"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          {isError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
              {error.message}
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="financial-tuitionFee">Tuition Fee</Label>

              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="financial-tuitionFee"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  placeholder="Enter tuition fee"
                  disabled={isPending}
                  {...register("tuitionFee")}
                />
              </div>

              <ErrorMessage message={errors.tuitionFee?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-livingExpenses">Living Expenses</Label>

              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="financial-livingExpenses"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  placeholder="Enter living expenses"
                  disabled={isPending}
                  {...register("livingExpenses")}
                />
              </div>

              <ErrorMessage message={errors.livingExpenses?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-otherExpenses">Other Expenses</Label>

              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="financial-otherExpenses"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  placeholder="Enter other expenses"
                  disabled={isPending}
                  {...register("otherExpenses")}
                />
              </div>

              <ErrorMessage message={errors.otherExpenses?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-totalCourseCost">
                Total Course Cost
              </Label>

              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="financial-totalCourseCost"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  placeholder="Enter total course cost"
                  disabled={isPending}
                  {...register("totalCourseCost")}
                />
              </div>

              <ErrorMessage message={errors.totalCourseCost?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-ownContribution">
                Own Contribution
              </Label>

              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="financial-ownContribution"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  placeholder="Enter own contribution"
                  disabled={isPending}
                  {...register("ownContribution")}
                />
              </div>

              <ErrorMessage message={errors.ownContribution?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-requiredLoanAmount">
                Required Loan Amount
              </Label>

              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="financial-requiredLoanAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  placeholder="Enter required amount"
                  disabled={isPending}
                  {...register("requiredLoanAmount", {
                    setValueAs: parseOptionalNumber,
                    onChange: () => {
                      clearErrors("requiredLoanAmount");
                    },
                  })}
                />
              </div>

              <ErrorMessage message={errors.requiredLoanAmount?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-loanPreference">Loan Preference</Label>

              <Controller
                name="loanPreference"
                control={control}
                render={({ field }) => (
                  <Select
                    value={typeof field.value === "string" ? field.value : ""}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger id="financial-loanPreference">
                      <SelectValue placeholder="Select loan preference" />
                    </SelectTrigger>

                    <SelectContent>
                      {LOAN_PREFERENCE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <ErrorMessage message={errors.loanPreference?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-collateralAvailable">
                Collateral Available
              </Label>

              <Controller
                name="collateralAvailable"
                control={control}
                render={({ field }) => (
                  <Select
                    value={typeof field.value === "string" ? field.value : ""}
                    onValueChange={field.onChange}
                    disabled={isPending}
                  >
                    <SelectTrigger id="financial-collateralAvailable">
                      <SelectValue placeholder="Select collateral availability" />
                    </SelectTrigger>

                    <SelectContent>
                      {YES_NO_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />

              <ErrorMessage message={errors.collateralAvailable?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-preferredTenure">
                Preferred Tenure
              </Label>

              <Input
                id="financial-preferredTenure"
                type="number"
                min="0"
                step="1"
                placeholder="Enter tenure in months"
                disabled={isPending}
                {...register("preferredTenure")}
              />

              <ErrorMessage message={errors.preferredTenure?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-cibilScore">CIBIL Score</Label>

              <Input
                id="financial-cibilScore"
                type="number"
                min="300"
                max="900"
                step="1"
                placeholder="Enter CIBIL score"
                disabled={isPending}
                {...register("cibilScore")}
              />

              <ErrorMessage message={errors.cibilScore?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-propertyType">Property Type</Label>

              <Input
                id="financial-propertyType"
                placeholder="Enter property type"
                disabled={isPending}
                {...register("propertyType")}
              />

              <ErrorMessage message={errors.propertyType?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-propertyValue">Property Value</Label>

              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="financial-propertyValue"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  placeholder="Enter property value"
                  disabled={isPending}
                  {...register("propertyValue")}
                />
              </div>

              <ErrorMessage message={errors.propertyValue?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="financial-downPayment">Down Payment</Label>

              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <Input
                  id="financial-downPayment"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  className="pl-9"
                  placeholder="Enter down payment"
                  disabled={isPending}
                  {...register("downPayment")}
                />
              </div>

              <ErrorMessage message={errors.downPayment?.message} />
            </div>

            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <Label htmlFor="financial-propertyLocation">
                Property Location
              </Label>

              <Input
                id="financial-propertyLocation"
                placeholder="Enter property location"
                disabled={isPending}
                {...register("propertyLocation")}
              />

              <ErrorMessage message={errors.propertyLocation?.message} />
            </div>

            <div className="space-y-2 md:col-span-2 xl:col-span-3">
              <Label htmlFor="financial-loanPurpose">Loan Purpose</Label>

              <Textarea
                id="financial-loanPurpose"
                rows={4}
                placeholder="Enter loan purpose"
                disabled={isPending}
                {...register("loanPurpose")}
              />

              <ErrorMessage message={errors.loanPurpose?.message} />
            </div>
          </div>

          <DialogFooter className="border-t border-slate-100 pt-5 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={isPending}
              onClick={handleCancel}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>

            <Button
              type="submit"
              className="gap-2 bg-red-600 text-white hover:bg-red-700"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
