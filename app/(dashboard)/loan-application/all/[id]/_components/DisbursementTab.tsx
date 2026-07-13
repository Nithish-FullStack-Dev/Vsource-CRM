import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  CreditCard,
  IndianRupee,
  Landmark,
  Hash,
  Building2,
  User,
  FileText,
  Edit2,
  Loader2,
} from "lucide-react";

import { formatDate, formatINR } from "./config";
import { InfoCard, InfoGrid, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { LOAN_APPLICATION_KEYS } from "@/services/loan-application/loan-application-query-key";

type FormValues = {
  disbursementDate: Date | undefined;
  disbursedAmount: string;
  disbursementReference: string;
  accountNumber: string;
  transactionId: string;
  beneficiary: string;
  paymentMode: string;
  remarks: string;
};

export function DisbursementTab({ applicant }: { applicant: LoanApplication }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const disbursement = applicant.disbursement;

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<FormValues>({
      defaultValues: {
        disbursementDate: disbursement?.disbursementDate
          ? new Date(disbursement.disbursementDate)
          : undefined,
        disbursedAmount: disbursement?.disbursedAmount?.toString() ?? "",
        disbursementReference: disbursement?.disbursementReference ?? "",
        accountNumber: disbursement?.accountNumber ?? "",
        transactionId: disbursement?.transactionId ?? "",
        beneficiary: disbursement?.beneficiary ?? "",
        paymentMode: disbursement?.paymentMode ?? "",
        remarks: disbursement?.remarks ?? "",
      },
    });

  const selectedDate = watch("disbursementDate");
  const currentPaymentMode = watch("paymentMode");

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await api.patch(
        `/loan-applications/${applicant.id}/disbursement`,
        {
          ...values,
          disbursedAmount: values.disbursedAmount
            ? parseFloat(values.disbursedAmount)
            : null,
        },
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

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TabHeader eyebrow="Amount Release" title="Disbursement Details" />
        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (!val) reset();
          }}
        >
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Edit2 className="h-4 w-4" />
              Edit Details
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Disbursement Details</DialogTitle>
              <DialogDescription>
                Modify the release parameters and payment tracking strings for
                this application.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                  <Label>Disbursement Date</Label>
                  <Input
                    id="disbursementDate"
                    type="date"
                    {...register("disbursementDate")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="disbursedAmount">
                    Disbursed Amount (INR)
                  </Label>
                  <Input
                    id="disbursedAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("disbursedAmount")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <Select
                    value={currentPaymentMode}
                    onValueChange={(value) => setValue("paymentMode", value)}
                  >
                    <SelectTrigger id="paymentMode">
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEFT">NEFT</SelectItem>
                      <SelectItem value="RTGS">RTGS</SelectItem>
                      <SelectItem value="IMPS">IMPS</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    placeholder="Destination account"
                    {...register("accountNumber")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="disbursementReference">Reference No.</Label>
                  <Input
                    id="disbursementReference"
                    placeholder="Internal/Bank reference"
                    {...register("disbursementReference")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transactionId">Transaction ID</Label>
                  <Input
                    id="transactionId"
                    placeholder="UTR / Gateway transaction ID"
                    {...register("transactionId")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beneficiary">Beneficiary Name</Label>
                <Input
                  id="beneficiary"
                  placeholder="Receiver full name"
                  {...register("beneficiary")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  placeholder="Add specific operational annotations..."
                  {...register("remarks")}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <InfoGrid>
        <InfoCard
          icon={Landmark}
          label="Bank / NBFC"
          value={applicant.sanction?.bank?.name ?? "-"}
        />

        <InfoCard
          icon={IndianRupee}
          label="Disbursed Amount"
          value={formatINR(disbursement?.disbursedAmount)}
        />

        <InfoCard
          icon={CalendarIcon}
          label="Disbursement Date"
          value={formatDate(disbursement?.disbursementDate)}
        />

        <InfoCard
          icon={CreditCard}
          label="Status"
          value={applicant.loanStatus}
        />

        <InfoCard
          icon={Hash}
          label="Reference No."
          value={disbursement?.disbursementReference}
        />

        <InfoCard
          icon={Building2}
          label="Payment Mode"
          value={disbursement?.paymentMode}
        />

        <InfoCard
          icon={CreditCard}
          label="Transaction ID"
          value={disbursement?.transactionId}
        />

        <InfoCard
          icon={Landmark}
          label="Account Number"
          value={disbursement?.accountNumber}
        />

        <InfoCard
          icon={User}
          label="Beneficiary"
          value={disbursement?.beneficiary}
        />
      </InfoGrid>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-slate-500" />
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Remarks
          </p>
        </div>

        <p className="text-sm leading-6 text-slate-700 dark:text-slate-300">
          {disbursement?.remarks || "No remarks available."}
        </p>
      </div>
    </div>
  );
}
