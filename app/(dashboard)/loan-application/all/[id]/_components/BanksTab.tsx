"use client";

import { useMemo, useState } from "react";
import {
  Controller,
  type FieldError,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Building2, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { formatDate, formatINR } from "./config";
import { DataTable, EmptyState, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

import {
  bankApplicationSchema,
  type BankApplicationFormInput,
  type BankApplicationFormValues,
} from "@/schemas/loan-application/loan-application.schema";

import {
  createLoanBankApplication,
  deleteLoanBankApplication,
  getActiveBanks,
  updateLoanBankApplication,
  type BankListItem,
} from "@/services/loan-application/loan-application.service";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
import { useLoanBanks } from "@/hooks/loan-application/useLoanApplications";
import { LOAN_APPLICATION_KEYS } from "@/services/loan-application/loan-application-query-key";

type BankApplicationRow = NonNullable<
  LoanApplication["bankApplications"]
>[number];

const EMPTY_FORM_VALUES: BankApplicationFormInput = {
  bankId: "",
  branch: "",
  applicationNo: "",
  applicationDate: "",
  appliedAmount: "",
  loanType: "",
  roi: "",
  tenure: "",
  processingFee: "",
  insuranceAmount: "",
  moratorium: "",
  loginExecutive: "",
  status: "",
  rejectionReason: "",
  remarks: "",
};

const BANK_APPLICATION_STATUSES = [
  "Draft",
  "Submitted",
  "Logged In",
  "Under Review",
  "Documents Pending",
  "Credit Review",
  "Approved",
  "Sanctioned",
  "Rejected",
  "Withdrawn",
  "Closed",
] as const;

const LOAN_TYPES = [
  "Education Loan",
  "Personal Loan",
  "Home Loan",
  "Business Loan",
  "Loan Against Property",
  "Vehicle Loan",
  "Other",
] as const;

function getDateInputValue(value?: string | Date | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toInputNumber(value: number | string | null | undefined): number | "" {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : "";
}

function getMutationError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const responseMessage = error.response?.data?.message;

    if (typeof responseMessage === "string") {
      return responseMessage;
    }

    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

function getBankName(row: BankApplicationRow): string {
  if (row.bank && typeof row.bank === "object" && "name" in row.bank) {
    return row.bank.name || "—";
  }

  return "—";
}

function getEditFormValues(row: BankApplicationRow): BankApplicationFormInput {
  return {
    bankId: row.bankId ?? row.bank?.id ?? "",

    branch: row.branch ?? "",

    applicationNo: row.applicationNo ?? "",

    applicationDate: getDateInputValue(row.applicationDate),

    appliedAmount: toInputNumber(row.appliedAmount),

    loanType: row.loanType ?? "",

    roi: toInputNumber(row.roi),

    tenure: toInputNumber(row.tenure),

    processingFee: toInputNumber(row.processingFee),

    insuranceAmount: toInputNumber(row.insuranceAmount),

    moratorium: row.moratorium ?? "",

    loginExecutive: row.loginExecutive ?? "",

    status: row.status ?? "",

    rejectionReason: row.rejectionReason ?? "",

    remarks: row.remarks ?? "",
  };
}

export function BanksTab({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient();

  const { data: rows = [], isLoading } = useLoanBanks(applicationId);

  const [dialogOpen, setDialogOpen] = useState(false);

  const [editingApplication, setEditingApplication] =
    useState<BankApplicationRow | null>(null);

  const [deletingApplication, setDeletingApplication] =
    useState<BankApplicationRow | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BankApplicationFormInput, unknown, BankApplicationFormValues>({
    resolver: zodResolver(bankApplicationSchema),
    defaultValues: EMPTY_FORM_VALUES,
    mode: "onBlur",
  });

  const {
    data: bankResponse = [],
    isLoading: isBanksLoading,
    isError: isBanksError,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: ["banks", "active"],
    queryFn: getActiveBanks,
    staleTime: 5 * 60 * 1000,
  });

  const banks = useMemo<BankListItem[]>(() => {
    return Array.isArray(bankResponse) ? bankResponse : [];
  }, [bankResponse]);

  const createMutation = useMutation({
    mutationFn: (payload: BankApplicationFormValues) =>
      createLoanBankApplication(applicationId, payload),

    onSuccess: async () => {
      await invalidateLoanApplication();
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      bankApplicationId,
      payload,
    }: {
      bankApplicationId: string;
      payload: Partial<BankApplicationFormValues>;
    }) => updateLoanBankApplication(applicationId, bankApplicationId, payload),

    onSuccess: async () => {
      await invalidateLoanApplication();
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (bankApplicationId: string) =>
      deleteLoanBankApplication(applicationId, bankApplicationId),

    onSuccess: async () => {
      await invalidateLoanApplication();
      setDeletingApplication(null);
    },
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const isDeleting = deleteMutation.isPending;

  const saveError = createMutation.error ?? updateMutation.error;

  async function invalidateLoanApplication() {
    await queryClient.invalidateQueries({
      queryKey: [...LOAN_APPLICATION_KEYS.loanBankApplication, applicationId],
    });

    await queryClient.invalidateQueries({
      queryKey: [...LOAN_APPLICATION_KEYS.loanBankApplication],
    });
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  function openCreateDialog() {
    createMutation.reset();
    updateMutation.reset();

    setEditingApplication(null);

    reset(EMPTY_FORM_VALUES);

    setDialogOpen(true);
  }

  function openEditDialog(row: BankApplicationRow) {
    createMutation.reset();
    updateMutation.reset();

    setEditingApplication(row);

    reset(getEditFormValues(row));

    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingApplication(null);

    createMutation.reset();
    updateMutation.reset();

    reset(EMPTY_FORM_VALUES);
  }

  const onSubmit: SubmitHandler<BankApplicationFormValues> = (values) => {
    if (editingApplication?.id) {
      updateMutation.mutate({
        bankApplicationId: editingApplication.id,
        payload: values,
      });

      return;
    }

    createMutation.mutate(values);
  };

  function confirmDelete() {
    if (!deletingApplication?.id) {
      return;
    }

    deleteMutation.mutate(deletingApplication.id);
  }

  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Bank Process" title="Bank / NBFC Applications" />

      <div className="flex items-center justify-end">
        <Button type="button" size="sm" onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Bank Application
        </Button>
      </div>

      {rows.length === 0 ? (
        <EmptyState message="No bank or NBFC applications found." />
      ) : (
        <DataTable
          columns={[
            "Bank / NBFC",
            "Application No",
            "Application Date",
            "Applied Amount",
            "Loan Type",
            "ROI",
            "Tenure",
            "Status",
            "Remarks",
            "Actions",
          ]}
          rows={rows.map((row, index) => (
            <tr
              key={row.id ?? index}
              className="border-t dark:border-slate-800"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Building2 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {getBankName(row)}
                    </p>

                    {row.branch && (
                      <p className="text-xs text-muted-foreground">
                        {row.branch}
                      </p>
                    )}
                  </div>
                </div>
              </td>

              <td className="px-4 py-3 font-mono text-xs text-slate-500">
                {row.applicationNo || "—"}
              </td>

              <td className="px-4 py-3 text-slate-500">
                {formatDate(row.applicationDate)}
              </td>

              <td className="px-4 py-3 text-slate-500">
                {formatINR(
                  row.appliedAmount != null
                    ? Number(row.appliedAmount)
                    : row.appliedAmount,
                )}
              </td>

              <td className="px-4 py-3 text-slate-500">
                {row.loanType || "—"}
              </td>

              <td className="px-4 py-3 text-slate-500">
                {row.roi !== null && row.roi !== undefined
                  ? `${Number(row.roi).toFixed(2)}%`
                  : "—"}
              </td>

              <td className="px-4 py-3 text-slate-500">
                {row.tenure !== null && row.tenure !== undefined
                  ? `${row.tenure} months`
                  : "—"}
              </td>

              <td className="px-4 py-3">
                <StatusBadge status={row.status} />
              </td>

              <td className="max-w-[240px] px-4 py-3 text-slate-500">
                <span className="line-clamp-2" title={row.remarks ?? undefined}>
                  {row.remarks || "—"}
                </span>
              </td>

              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => openEditDialog(row)}
                    aria-label="Edit bank application"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>

                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeletingApplication(row)}
                    aria-label="Delete bank application"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        />
      )}

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog();
          }
        }}
      >
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"
          onInteractOutside={(event) => {
            if (isSaving) {
              event.preventDefault();
            }
          }}
          onEscapeKeyDown={(event) => {
            if (isSaving) {
              event.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {editingApplication
                ? "Edit Bank Application"
                : "Add Bank Application"}
            </DialogTitle>

            <DialogDescription>
              Add the bank or NBFC application information associated with this
              loan application.
            </DialogDescription>
          </DialogHeader>

          <form
            id="bank-application-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField label="Bank / NBFC" error={errors.bankId} required>
                <Controller
                  name="bankId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value || ""}
                      onValueChange={field.onChange}
                      disabled={isBanksLoading || isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isBanksLoading
                              ? "Loading banks..."
                              : "Select bank or NBFC"
                          }
                        />
                      </SelectTrigger>

                      <SelectContent>
                        {banks.length === 0 && !isBanksLoading ? (
                          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                            No active banks found.
                          </div>
                        ) : (
                          banks.map((bank) => (
                            <SelectItem key={bank.id} value={bank.id}>
                              {bank.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                />

                {isBanksError && (
                  <div className="flex items-center justify-between gap-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
                    <p className="text-xs text-destructive">
                      Failed to load banks.
                    </p>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2 py-1 text-xs"
                      onClick={() => void refetchBanks()}
                    >
                      Retry
                    </Button>
                  </div>
                )}
              </FormField>

              <FormField label="Bank Branch" error={errors.branch}>
                <Input
                  placeholder="Enter bank branch"
                  disabled={isSaving}
                  {...register("branch")}
                />
              </FormField>

              <FormField
                label="Application Date"
                error={errors.applicationDate}
              >
                <Input
                  type="date"
                  disabled={isSaving}
                  {...register("applicationDate")}
                />
              </FormField>

              <FormField label="Applied Amount" error={errors.appliedAmount}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter applied amount"
                  disabled={isSaving}
                  {...register("appliedAmount")}
                />
              </FormField>

              <FormField label="Rate of Interest (%)" error={errors.roi}>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Example: 10.50"
                  disabled={isSaving}
                  {...register("roi")}
                />
              </FormField>

              <FormField label="Tenure (Months)" error={errors.tenure}>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Example: 120"
                  disabled={isSaving}
                  {...register("tenure")}
                />
              </FormField>

              <FormField label="Processing Fee" error={errors.processingFee}>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter processing fee"
                  disabled={isSaving}
                  {...register("processingFee")}
                />
              </FormField>

              <FormField
                label="Insurance Amount"
                error={errors.insuranceAmount}
              >
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Enter insurance amount"
                  disabled={isSaving}
                  {...register("insuranceAmount")}
                />
              </FormField>

              <FormField label="Application Status" error={errors.status}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={String(field.value || "")}
                      onValueChange={field.onChange}
                      disabled={isSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select application status" />
                      </SelectTrigger>

                      <SelectContent>
                        {BANK_APPLICATION_STATUSES.map((status) => (
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
                label="Rejection Reason"
                error={errors.rejectionReason}
              >
                <Input
                  placeholder="Enter reason when rejected"
                  disabled={isSaving}
                  {...register("rejectionReason")}
                />
              </FormField>
            </div>

            <FormField label="Remarks" error={errors.remarks}>
              <Textarea
                rows={4}
                placeholder="Enter additional remarks"
                disabled={isSaving}
                {...register("remarks")}
              />
            </FormField>

            {saveError && (
              <div
                role="alert"
                className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {getMutationError(saveError)}
              </div>
            )}
          </form>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeDialog}
              disabled={isSaving}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              form="bank-application-form"
              disabled={isSaving || isBanksLoading || banks.length === 0}
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

              {editingApplication ? "Update Application" : "Save Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deletingApplication)}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeletingApplication(null);
            deleteMutation.reset();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete bank application?</AlertDialogTitle>

            <AlertDialogDescription>
              This will permanently delete the bank application for{" "}
              <strong>
                {deletingApplication
                  ? getBankName(deletingApplication)
                  : "the selected bank"}
              </strong>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteMutation.isError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {getMutationError(deleteMutation.error)}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Application
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FormField({
  label,
  error,
  required = false,
  children,
}: {
  label: string;
  error?: FieldError | any;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}

        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>

      {children}

      {error?.message && (
        <p className="text-sm text-destructive">
          {String((error as any)?.message)}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  if (!status) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  const normalizedStatus = status.toLowerCase();

  const className =
    normalizedStatus.includes("reject") || normalizedStatus.includes("withdraw")
      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
      : normalizedStatus.includes("approve") ||
          normalizedStatus.includes("sanction")
        ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
        : normalizedStatus.includes("pending") ||
            normalizedStatus.includes("review") ||
            normalizedStatus.includes("document")
          ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300";

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium ${className}`}
    >
      {status}
    </span>
  );
}
