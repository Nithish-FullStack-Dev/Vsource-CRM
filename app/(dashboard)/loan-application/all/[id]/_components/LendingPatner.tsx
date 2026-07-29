"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  IndianRupee,
  Landmark,
  Loader2,
  Pencil,
  Save,
  Send,
  type LucideIcon,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

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
import { MODULES } from "@/lib/module-codes";
import {
  updateLoanLendingPartnerSchema,
  type UpdateLoanLendingPartnerValues,
} from "@/schemas/loan-application/loan-application.schema";
import { useUpdateLoanLendingPartner } from "@/hooks/loan-application/useLoanLendingPartner";

import { formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { BankApplication, LoanApplication } from "./types";

type LendingPatnerProps = {
  applicant: LoanApplication;
  canUpdate: (module: string) => boolean;
};

type EditLendingPartnerDialogProps = {
  applicant: LoanApplication;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type FormSectionProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
};

type FormFieldProps = {
  label: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

type LendingPartnerFormValues = UpdateLoanLendingPartnerValues & {
  depositAmount?: number | null;
  depositDate?: string | null;
  depositBank?: string | null;
  depositStatus?: string | null;
};

const EMPTY_SELECT_VALUE = "__none__";

const DEPOSIT_STATUS_OPTIONS = [
  "Pending",
  "Received",
  "Partially Received",
  "Refunded",
  "Cancelled",
];

const DISBURSEMENT_STATUS_OPTIONS = [
  "Pending",
  "Partially Disbursed",
  "Fully Disbursed",
  "On Hold",
  "Cancelled",
];

const toInputDate = (value?: string | Date | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
};

const toNumberOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isNaN(numberValue) ? null : numberValue;
};

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  return trimmedValue || null;
};

const getDefaultValues = (
  applicant: LoanApplication,
): LendingPartnerFormValues => ({
  requiredLoanAmount: applicant.requiredLoanAmount ?? undefined,

  sanctionBankId: applicant.sanctionBankId ?? undefined,

  sanctionedAmount:
    applicant.sanctionedAmount === null ||
    applicant.sanctionedAmount === undefined
      ? undefined
      : Number(applicant.sanctionedAmount),

  sanctionDate: toInputDate(applicant.sanctionDate) || undefined,

  depositAmount:
    applicant.depositAmount === null || applicant.depositAmount === undefined
      ? undefined
      : Number(applicant.depositAmount),

  depositDate: toInputDate(applicant.depositDate) || undefined,

  depositBank: applicant.depositBank ?? undefined,

  depositStatus: applicant.depositStatus ?? undefined,

  disbursementStatus: applicant.disbursementStatus ?? undefined,

  disbursementDate: toInputDate(applicant.disbursementDate) || undefined,
  disbursedAmount:
    applicant.disbursedAmount === null || applicant.disbursedAmount === undefined
      ? undefined
      : Number(applicant.disbursedAmount),

  disbursedBank: applicant.disbursedBank ?? undefined,
});

const getBankName = (bankApplication?: BankApplication | null) => {
  return bankApplication?.bank?.name || "Not provided";
};

const getBankApplicationLabel = (bankApplication: BankApplication) => {
  const bankName = bankApplication.bank?.name || "Unnamed Bank";

  return `${bankName}`;
};

const findBankApplication = (
  bankApplications: BankApplication[],
  bankApplicationId?: string | null,
) => {
  if (!bankApplicationId) {
    return null;
  }

  return (
    bankApplications.find(
      (bankApplication) => bankApplication.id === bankApplicationId,
    ) ?? null
  );
};

const formatDate = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-IN");
};

function FormSection({
  title,
  description,
  icon: Icon,
  children,
}: FormSectionProps) {
  return (
    <section className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10">
          <Icon className="h-5 w-5 text-red-600" />
        </div>

        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {title}
          </h3>

          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">{children}</div>
    </section>
  );
}

function FormField({ label, error, className, children }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>{label}</Label>

      {children}

      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

export function LendingPatner({ applicant, canUpdate }: LendingPatnerProps) {
  const [editOpen, setEditOpen] = useState(false);

  const bankApplications = applicant.bankApplications ?? [];

  const sanctionBankApplication =
    applicant.sanctionBankApplication ??
    findBankApplication(bankApplications, applicant.sanctionBankId);

  return (
    <>
      <div className="space-y-8">
        <section className="space-y-5">
          <TabHeader
            eyebrow="Loan Processing"
            title="Lending Partner"
            action={
              canUpdate(MODULES.LOAN_APPLICATION) ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="gap-2"
                >
                  <Pencil className="h-4 w-4" />
                  Edit Lending Partner
                </Button>
              ) : null
            }
          />

          <InfoGrid>
            <InfoCard
              icon={CircleDollarSign}
              label="Required Loan Amount"
              value={formatINR(applicant.requiredLoanAmount)}
            />

            <InfoCard
              icon={Landmark}
              label="Sanction Bank"
              value={getBankName(sanctionBankApplication)}
            />

            <InfoCard
              icon={IndianRupee}
              label="Sanctioned Amount"
              value={formatINR(applicant.sanctionedAmount)}
            />

            <InfoCard
              icon={CalendarDays}
              label="Sanction Date"
              value={formatDate(applicant.sanctionDate)}
            />
          </InfoGrid>
        </section>

        <section className="space-y-5 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Loan Release
            </p>

            <h2 className="mt-1 text-base font-black text-slate-900 dark:text-white">
              Disbursement Information
            </h2>
          </div>

          <InfoGrid>
            <InfoCard
              icon={Banknote}
              label="Disbursement Status"
              value={applicant.disbursementStatus}
            />

            <InfoCard
              icon={CalendarDays}
              label="Disbursement Date"
              value={formatDate(applicant.disbursementDate)}
            />

            <InfoCard
              icon={Landmark}
              label="Disbursed Bank"
              value={applicant.disbursedBank}
            />

            <InfoCard
              icon={IndianRupee}
              label="Disbursed Amount"
              value={formatINR(applicant.disbursedAmount)}
            />
          </InfoGrid>
        </section>
        <section className="space-y-5 border-t border-slate-200 pt-8 dark:border-slate-800">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Payment Information
            </p>

            <h2 className="mt-1 text-base font-black text-slate-900 dark:text-white">
              Deposit Information
            </h2>
          </div>

          <InfoGrid>
            <InfoCard
              icon={BadgeIndianRupee}
              label="Deposit Amount"
              value={formatINR(applicant.depositAmount)}
            />

            <InfoCard
              icon={CalendarDays}
              label="Deposit Date"
              value={formatDate(applicant.depositDate)}
            />

            <InfoCard
              icon={Landmark}
              label="Deposit Bank"
              value={applicant.depositBank}
            />

            <InfoCard
              icon={Banknote}
              label="Deposit Status"
              value={applicant.depositStatus}
            />
          </InfoGrid>
        </section>
      </div>

      <EditLendingPartnerDialog
        applicant={applicant}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}

function EditLendingPartnerDialog({
  applicant,
  open,
  onOpenChange,
}: EditLendingPartnerDialogProps) {
  const update = useUpdateLoanLendingPartner();

  const bankApplications = applicant.bankApplications ?? [];

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<LendingPartnerFormValues>({
    resolver: zodResolver(updateLoanLendingPartnerSchema) as any,
    defaultValues: getDefaultValues(applicant),
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset(getDefaultValues(applicant));
  }, [open, applicant, reset]);

  const bankOptions = useMemo(
    () =>
      bankApplications.filter(
        (
          bankApplication,
        ): bankApplication is BankApplication & {
          id: string;
        } => Boolean(bankApplication.id),
      ),
    [bankApplications],
  );

  const handleDialogChange = (nextOpen: boolean) => {
    if (update.isPending) {
      return;
    }

    if (!nextOpen) {
      reset(getDefaultValues(applicant));
      update.reset();
    }

    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: LendingPartnerFormValues) => {
    const payload = {
      requiredLoanAmount: toNumberOrNull(values.requiredLoanAmount),

      sanctionBankId: normalizeOptionalString(values.sanctionBankId),

      sanctionedAmount: toNumberOrNull(values.sanctionedAmount),

      sanctionDate: normalizeOptionalString(values.sanctionDate),

      depositAmount: toNumberOrNull(values.depositAmount),

      depositDate: normalizeOptionalString(values.depositDate),

      depositBank: normalizeOptionalString(values.depositBank),

      depositStatus: normalizeOptionalString(values.depositStatus),

      disbursementStatus: normalizeOptionalString(values.disbursementStatus),

      disbursementDate: normalizeOptionalString(values.disbursementDate),

       disbursedAmount: toNumberOrNull(values.disbursedAmount),

      disbursedBank: normalizeOptionalString(values.disbursedBank),
    };

    await update.mutateAsync({
      id: applicant.id,
      data: payload,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="flex max-h-[94vh] w-[calc(100%-1rem)] max-w-5xl flex-col overflow-hidden p-0 sm:w-full">
        <DialogHeader className="shrink-0 border-b bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600/10">
              <Landmark className="h-5 w-5 text-red-600" />
            </div>

            <div className="min-w-0">
              <DialogTitle className="text-lg font-black">
                Edit Lending Partner
              </DialogTitle>

              <DialogDescription className="mt-1">
                Update finance, sanction, deposit and disbursement information.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-6">
            <FormSection
              title="Finance"
              description="Applicant required loan amount."
              icon={CircleDollarSign}
            >
              <FormField
                label="Required Loan Amount"
                error={errors.requiredLoanAmount?.message}
              >
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    {...register("requiredLoanAmount", {
                      setValueAs: (value) =>
                        value === "" ? null : Number(value),
                    })}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="pl-9"
                    placeholder="Enter required loan amount"
                    disabled={update.isPending}
                  />
                </div>
              </FormField>
            </FormSection>

            <div className="border-t border-slate-200 dark:border-slate-800" />

            <FormSection
              title="Sanction Information"
              description="Approved bank application, sanctioned amount and sanction date."
              icon={Landmark}
            >
              <FormField
                label="Sanction Bank Application"
                error={errors.sanctionBankId?.message}
              >
                <Controller
                  control={control}
                  name="sanctionBankId"
                  render={({ field }) => (
                    <Select
                      value={field.value || EMPTY_SELECT_VALUE}
                      onValueChange={(value) =>
                        field.onChange(
                          value === EMPTY_SELECT_VALUE ? null : value,
                        )
                      }
                      disabled={update.isPending || bankOptions.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            bankOptions.length === 0
                              ? "No Bank Applications"
                              : "Select Bank Application"
                          }
                        />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>
                          Not Selected
                        </SelectItem>

                        {bankOptions.map((bankApplication) => (
                          <SelectItem
                            key={bankApplication.id}
                            value={bankApplication.id}
                          >
                            {getBankApplicationLabel(bankApplication)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />

                {bankOptions.length === 0 && (
                  <p className="text-xs font-medium text-amber-600">
                    Add a bank application before selecting the sanction bank.
                  </p>
                )}
              </FormField>

              <FormField
                label="Sanctioned Amount"
                error={errors.sanctionedAmount?.message}
              >
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    {...register("sanctionedAmount", {
                      setValueAs: (value) =>
                        value === "" ? null : Number(value),
                    })}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="pl-9"
                    placeholder="Enter sanctioned amount"
                    disabled={update.isPending}
                  />
                </div>
              </FormField>

              <FormField
                label="Sanction Date"
                error={errors.sanctionDate?.message}
              >
                <Input
                  {...register("sanctionDate")}
                  type="date"
                  disabled={update.isPending}
                />
              </FormField>
            </FormSection>

            <div className="border-t border-slate-200 dark:border-slate-800" />

            <FormSection
              title="Disbursement Information"
              description="Loan disbursement status, date and bank application."
              icon={Send}
            >
              <FormField
                label="Disbursement Status"
                error={errors.disbursementStatus?.message}
              >
                <Controller
                  control={control}
                  name="disbursementStatus"
                  render={({ field }) => (
                    <Select
                      value={field.value || EMPTY_SELECT_VALUE}
                      onValueChange={(value) =>
                        field.onChange(
                          value === EMPTY_SELECT_VALUE ? null : value,
                        )
                      }
                      disabled={update.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Disbursement Status" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>
                          Not Selected
                        </SelectItem>

                        {DISBURSEMENT_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                label="Disbursement Date"
                error={errors.disbursementDate?.message}
              >
                <Input
                  {...register("disbursementDate")}
                  type="date"
                  disabled={update.isPending}
                />
              </FormField>

              <FormField
                label="Disbursed Bank"
                error={errors.disbursedBank?.message}
              >
                <Input
                  {...register("disbursedBank")}
                  placeholder="Enter disbursed bank"
                  disabled={update.isPending}
                />
              </FormField>
              <FormField
                label="Disbursed Amount"
                error={errors.disbursedAmount?.message}
              >
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    {...register("disbursedAmount", {
                      setValueAs: (value) =>
                        value === "" ? null : Number(value),
                    })}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="pl-9"
                    placeholder="Enter deposit amount"
                    disabled={update.isPending}
                  />
                </div>
              </FormField>
            </FormSection>

            <div className="border-t border-slate-200 dark:border-slate-800" />

            <FormSection
              title="Deposit Information"
              description="Deposit amount, status, date, reference and bank application."
              icon={BadgeIndianRupee}
            >
              <FormField
                label="Deposit Amount"
                error={errors.depositAmount?.message}
              >
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <Input
                    {...register("depositAmount", {
                      setValueAs: (value) =>
                        value === "" ? null : Number(value),
                    })}
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    className="pl-9"
                    placeholder="Enter deposit amount"
                    disabled={update.isPending}
                  />
                </div>
              </FormField>

              <FormField
                label="Deposit Status"
                error={errors.depositStatus?.message}
              >
                <Controller
                  control={control}
                  name="depositStatus"
                  render={({ field }) => (
                    <Select
                      value={field.value || EMPTY_SELECT_VALUE}
                      onValueChange={(value) =>
                        field.onChange(
                          value === EMPTY_SELECT_VALUE ? null : value,
                        )
                      }
                      disabled={update.isPending}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Deposit Status" />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value={EMPTY_SELECT_VALUE}>
                          Not Selected
                        </SelectItem>

                        {DEPOSIT_STATUS_OPTIONS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </FormField>

              <FormField
                label="Deposit Date"
                error={errors.depositDate?.message}
              >
                <Input
                  {...register("depositDate")}
                  type="date"
                  disabled={update.isPending}
                />
              </FormField>

              <FormField
                label="Deposit Bank"
                error={errors.depositBank?.message}
              >
                <Input
                  {...register("depositBank")}
                  placeholder="Enter deposit bank"
                  disabled={update.isPending}
                />
              </FormField>
            </FormSection>

            {update.isError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
                {update.error instanceof Error
                  ? update.error.message
                  : "Failed to update lending partner information."}
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">
            <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogChange(false)}
                disabled={update.isPending}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={update.isPending || !isDirty}
                className="w-full gap-2 sm:w-auto"
              >
                {update.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Lending Partner
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default LendingPatner;
