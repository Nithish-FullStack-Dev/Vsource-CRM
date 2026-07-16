import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Calendar as CalendarIcon,
  CreditCard,
  IndianRupee,
  Landmark,
  BadgeCheck,
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
import { LOAN_APPLICATION_KEYS } from "@/services/loan-application/loan-application-query-key";
import { MODULES } from "@/lib/module-codes";

type FormValues = {
  depositStatus: string;
  depositAmount: string;
  depositDate: Date | undefined;
  depositBank: string;
  depositReference: string;
  depositRemarks: string;
};

export function DepositTab({
  applicant,
  canUpdate,
}: {
  applicant: LoanApplication;
  canUpdate: (moduleCode: string) => boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<FormValues>({
      defaultValues: {
        depositStatus: applicant.depositStatus || "Pending",
        depositAmount: applicant.depositAmount?.toString() ?? "",
        depositDate: applicant.depositDate
          ? new Date(applicant.depositDate)
          : undefined,
        depositBank: applicant.depositBank ?? "",
        depositReference: applicant.depositReference ?? "",
        depositRemarks: applicant.depositRemarks ?? "",
      },
    });

  const selectedDate = watch("depositDate");
  const currentStatus = watch("depositStatus");

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const response = await axios.patch(
        `/api/loan-applications/${applicant.id}/deposit`,
        {
          ...values,
          depositAmount: values.depositAmount
            ? parseFloat(values.depositAmount)
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

  const preventNegativeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (["-", "+", "e", "E"].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <TabHeader eyebrow="University Deposit" title="Deposit Details" />
        <Dialog
          open={open}
          onOpenChange={(val) => {
            setOpen(val);
            if (!val) reset();
          }}
        >
          {canUpdate(MODULES.LOAN_APPLICATION) && (
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit2 className="h-4 w-4" />
                Edit Details
              </Button>
            </DialogTrigger>
          )}
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Deposit Details</DialogTitle>
              <DialogDescription>
                Modify university deposit tracking strings, amounts, and
                statuses.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="depositStatus">Deposit Status</Label>
                  <Select
                    value={currentStatus}
                    onValueChange={(value) => setValue("depositStatus", value)}
                  >
                    <SelectTrigger id="depositStatus">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Refunded">Refunded</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositAmount">Deposit Amount (INR)</Label>
                  <Input
                    id="depositAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...register("depositAmount")}
                    onKeyDown={preventNegativeInput}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 flex flex-col">
                  <Label>Deposit Date</Label>
                  <Input
                    id="depositDate"
                    type="date"
                    placeholder="Deposit Date"
                    {...register("depositDate")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="depositBank">Deposit Bank</Label>
                  <Input
                    id="depositBank"
                    placeholder="Remitting bank name"
                    {...register("depositBank")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositReference">Reference Number</Label>
                <Input
                  id="depositReference"
                  placeholder="Transaction ref or receipt number"
                  {...register("depositReference")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="depositRemarks">Remarks</Label>
                <Textarea
                  id="depositRemarks"
                  placeholder="Add specific internal annotations..."
                  {...register("depositRemarks")}
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
          icon={BadgeCheck}
          label="Deposit Status"
          value={applicant.depositStatus || "Pending"}
        />

        <InfoCard
          icon={IndianRupee}
          label="Deposit Amount"
          value={formatINR(applicant.depositAmount)}
        />

        <InfoCard
          icon={CalendarIcon}
          label="Deposit Date"
          value={formatDate(applicant.depositDate)}
        />

        <InfoCard
          icon={Landmark}
          label="Deposit Bank"
          value={applicant.depositBank}
        />

        <InfoCard
          icon={CreditCard}
          label="Reference Number"
          value={applicant.depositReference}
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
          {applicant.depositRemarks || "No remarks available."}
        </p>
      </div>
    </div>
  );
}
