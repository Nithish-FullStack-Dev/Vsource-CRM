// app\components\leads\LeadStatusDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import { LEADS } from "@/lib/lead";

const statuses = [
  {
    label: "New",
    value: "NEW",
  },
  {
    label: "Visa Application",
    value: "VISA_APPLICATION",
  },
  {
    label: "Drop",
    value: "DROP",
  },
];

type LeadStatus = "NEW" | "VISA_APPLICATION" | "DROP";

interface Props {
  lead: any;
  open: boolean;
  onClose: () => void;
}

export default function LeadStatusDialog({ lead, open, onClose }: Props) {
  const [status, setStatus] = useState<LeadStatus>("NEW");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (lead?.status) {
      setStatus(lead.status);
    }
  }, [lead]);

  const updateStatusMutation = useMutation({
    mutationFn: async (status: LeadStatus) => {
      const { data } = await api.patch(`/leads/${lead.id}/status`, {
        status,
      });

      return data;
    },

    onSuccess: async (response) => {
      queryClient.invalidateQueries({
        queryKey: LEADS.all,
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });

      toast.success(response?.message || "Walkin status updated successfully");

      onClose();
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to update Walkin status",
      );
    },
  });

  if (!lead) return null;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(value) => {
        if (updateStatusMutation.isPending) return;

        if (!value) {
          onClose();
        }
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Walkin Status</AlertDialogTitle>

          <AlertDialogDescription>
            {lead.studentName}
            <br />
            {lead.leadNumber}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as LeadStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {status === "VISA_APPLICATION" && (
            <p className="mt-3 text-sm text-orange-500">
              This will convert the Walk-in to application and move it to Visa
              Applications.
            </p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={updateStatusMutation.isPending}>
            Cancel
          </AlertDialogCancel>

          <Button
            onClick={() => updateStatusMutation.mutate(status)}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending ? "Updating..." : "Update Status"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
