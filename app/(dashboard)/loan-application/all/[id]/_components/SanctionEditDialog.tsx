import React from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Landmark,
  Calendar,
  Percent,
  Clock,
  FileText,
  BadgePercent,
  ShieldCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { LoanApplication } from "./types";
import { api } from "@/lib/api";
import {
  BankListItem,
  getActiveBanks,
} from "@/services/loan-application/loan-application.service";
import { LOAN_APPLICATION_KEYS } from "@/services/loan-application/loan-application-query-key";

interface SanctionEditDialogProps {
  applicant: LoanApplication;
  trigger?: React.ReactNode;
}

interface SanctionFormValues {
  bankId: string;
  sanctionNo: string;
  sanctionDate: string;
  sanctionedAmount: number | "";
  roi: number | "";
  tenure: number | "";
  moratorium: string;
  processingFee: number | "";
  insuranceAmount: number | "";
  expiryDate: string;
  remarks: string;
}

export function SanctionEditDialog({
  applicant,
  trigger,
}: SanctionEditDialogProps) {
  const [open, setOpen] = React.useState(false);
  const queryClient = useQueryClient();
  const sanction = applicant.sanction;

  // 1. Fetch Active Banks using your TanStack Query setup
  const {
    data: bankResponse = [],
    isLoading: isBanksLoading,
    isError: isBanksError,
    refetch: refetchBanks,
  } = useQuery({
    queryKey: ["banks", "active"],
    queryFn: getActiveBanks,
    staleTime: 5 * 60 * 1000,
    enabled: open,
  });

  const formatDateForInput = (
    dateInput: Date | string | null | undefined,
  ): string => {
    if (!dateInput) return "";
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  };

  // 2. Initialize React Hook Form
  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<SanctionFormValues>({
    defaultValues: {
      bankId: sanction?.bankId ?? "",
      sanctionNo: sanction?.sanctionNo ?? "",
      sanctionDate: formatDateForInput(sanction?.sanctionDate),
      sanctionedAmount: sanction?.sanctionedAmount
        ? Number(sanction.sanctionedAmount)
        : "",
      roi: sanction?.roi ? Number(sanction.roi) : "",
      tenure: sanction?.tenure ?? "",
      moratorium: sanction?.moratorium ?? "",
      processingFee: sanction?.processingFee
        ? Number(sanction.processingFee)
        : "",
      insuranceAmount: sanction?.insuranceAmount
        ? Number(sanction.insuranceAmount)
        : "",
      expiryDate: formatDateForInput(sanction?.expiryDate),
      remarks: sanction?.remarks ?? "",
    },
  });

  // Sync structural data changes when opening
  React.useEffect(() => {
    if (open) {
      reset({
        bankId: sanction?.bankId ?? "",
        sanctionNo: sanction?.sanctionNo ?? "",
        sanctionDate: formatDateForInput(sanction?.sanctionDate),
        sanctionedAmount: sanction?.sanctionedAmount
          ? Number(sanction.sanctionedAmount)
          : "",
        roi: sanction?.roi ? Number(sanction.roi) : "",
        tenure: sanction?.tenure ?? "",
        moratorium: sanction?.moratorium ?? "",
        processingFee: sanction?.processingFee
          ? Number(sanction.processingFee)
          : "",
        insuranceAmount: sanction?.insuranceAmount
          ? Number(sanction.insuranceAmount)
          : "",
        expiryDate: formatDateForInput(sanction?.expiryDate),
        remarks: sanction?.remarks ?? "",
      });
    }
  }, [open, sanction, reset]);

  // 3. Mutation handling updates
  const mutation = useMutation({
    mutationFn: async (data: SanctionFormValues) => {
      const payload = {
        ...data,
        sanctionDate: data.sanctionDate
          ? new Date(data.sanctionDate).toISOString()
          : null,
        expiryDate: data.expiryDate
          ? new Date(data.expiryDate).toISOString()
          : null,
        sanctionedAmount:
          data.sanctionedAmount === "" ? null : data.sanctionedAmount,
        roi: data.roi === "" ? null : data.roi,
        tenure: data.tenure === "" ? null : Number(data.tenure),
        processingFee: data.processingFee === "" ? null : data.processingFee,
        insuranceAmount:
          data.insuranceAmount === "" ? null : data.insuranceAmount,
      };

      const response = await api.put(
        `/loan-applications/${applicant.id}/sanction`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...LOAN_APPLICATION_KEYS.all, applicant.id],
      });
      queryClient.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.detail(applicant.id),
      });
      setOpen(false);
    },
  });

  const onSubmit = (values: SanctionFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline">Edit Sanction Details</Button>}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Sanction Parameters</DialogTitle>
          <DialogDescription>
            Modify the underwriting credit configurations for application{" "}
            {applicant.applicationId}.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Select Component controlled by React Hook Form */}
            <div className="space-y-2">
              <Label htmlFor="bankId" className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-muted-foreground" />{" "}
                Sanctioned Bank / NBFC
              </Label>

              <Controller
                name="bankId"
                control={control}
                rules={{
                  required:
                    "Selecting an active banking institution is required",
                }}
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isBanksLoading}
                  >
                    <SelectTrigger id="bankId" className="w-full">
                      <SelectValue
                        placeholder={
                          isBanksLoading
                            ? "Fetching institutions..."
                            : "Select Sanctioning Partner"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {isBanksLoading && (
                        <div className="flex items-center justify-center p-4 gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" /> Gathering
                          Active Lenders
                        </div>
                      )}

                      {isBanksError && (
                        <div className="p-2 text-center">
                          <p className="text-xs text-destructive flex items-center justify-center gap-1 mb-1">
                            <AlertCircle className="w-3 h-3" /> Failed to load
                            items.
                          </p>
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            onClick={() => refetchBanks()}
                          >
                            Retry Network Request
                          </Button>
                        </div>
                      )}

                      {!isBanksLoading &&
                        !isBanksError &&
                        bankResponse.map((bank) => (
                          <SelectItem key={bank.id} value={bank.id}>
                            {bank.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.bankId && (
                <p className="text-xs text-destructive">
                  {errors.bankId.message}
                </p>
              )}
            </div>

            {/* Sanction Reference Number */}
            <div className="space-y-2">
              <Label htmlFor="sanctionNo" className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" /> Sanction
                Reference Number
              </Label>
              <Input
                id="sanctionNo"
                placeholder="SCN-XXXXX"
                {...register("sanctionNo")}
              />
            </div>

            {/* Sanctioned Amount */}
            <div className="space-y-2">
              <Label htmlFor="sanctionedAmount">Approved Amount</Label>
              <Input
                id="sanctionedAmount"
                type="number"
                step="0.01"
                min={0}
                placeholder="0.00"
                {...register("sanctionedAmount", { valueAsNumber: true })}
              />
            </div>

            {/* Rate of Interest (ROI) */}
            <div className="space-y-2">
              <Label htmlFor="roi" className="flex items-center gap-2">
                <Percent className="w-4 h-4 text-muted-foreground" /> Rate of
                Interest (ROI %)
              </Label>
              <Input
                id="roi"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("roi", { valueAsNumber: true })}
              />
            </div>

            {/* Tenure */}
            <div className="space-y-2">
              <Label htmlFor="tenure" className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Allocation
                Tenure (Months)
              </Label>
              <Input
                id="tenure"
                type="number"
                placeholder="e.g. 60"
                {...register("tenure", { valueAsNumber: true })}
              />
            </div>

            {/* Moratorium Period */}
            {/* <div className="space-y-2">
              <Label htmlFor="moratorium">Moratorium Terms</Label>
              <Input
                id="moratorium"
                placeholder="e.g. 6 months course + 6 months grace"
                {...register("moratorium")}
              />
            </div> */}

            {/* Processing Fee */}
            <div className="space-y-2">
              <Label
                htmlFor="processingFee"
                className="flex items-center gap-2"
              >
                <BadgePercent className="w-4 h-4 text-muted-foreground" />{" "}
                Processing Costs
              </Label>
              <Input
                id="processingFee"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("processingFee", { valueAsNumber: true })}
              />
            </div>

            {/* Insurance Amount */}
            <div className="space-y-2">
              <Label
                htmlFor="insuranceAmount"
                className="flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />{" "}
                Collateral / Loan Insurance
              </Label>
              <Input
                id="insuranceAmount"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register("insuranceAmount", { valueAsNumber: true })}
              />
            </div>

            {/* Sanction Date */}
            <div className="space-y-2">
              <Label htmlFor="sanctionDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" /> Date of
                Sanction
              </Label>
              <Input
                id="sanctionDate"
                type="date"
                {...register("sanctionDate")}
              />
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" /> Letter
                Expiration Date
              </Label>
              <Input id="expiryDate" type="date" {...register("expiryDate")} />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks">Remarks</Label>
            <Textarea
              id="remarks"
              placeholder="Add conditions, internal execution milestones or notes..."
              rows={3}
              {...register("remarks")}
            />
          </div>

          <DialogFooter className="gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending || isBanksLoading}
            >
              {mutation.isPending ? "Saving Records..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
