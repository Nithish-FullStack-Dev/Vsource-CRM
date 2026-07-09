import { formatDate, formatINR } from "./config";
import { DataTable, EmptyState, TabHeader } from "./ProfileUI";
import type { LoanApplication } from "./types";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bankApplicationSchema } from "@/schemas/loan-application/loan-application.schema";
import {
  createLoanBankApplication,
  updateLoanBankApplication,
} from "@/services/loan-application/loan-application.service";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function BanksTab({ applicant }: { applicant: LoanApplication }) {
  const rows = applicant.bankApplications ?? [];
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm<any>({
    resolver: zodResolver(bankApplicationSchema),
    defaultValues: {
      bank: "",
      applicationNo: "",
      appliedAmount: undefined,
      status: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: (p: any) => createLoanBankApplication(applicant.id, p),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["loan-application", applicant.id],
      });
      reset();
      setAdding(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ bankId, payload }: any) =>
      updateLoanBankApplication(applicant.id, bankId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["loan-application", applicant.id],
      });
      setEditingId(null);
    },
  });

  return (
    <div className="space-y-6">
      <TabHeader eyebrow="Bank Process" title="Bank / NBFC Applications" />

      <div className="flex items-center justify-between">
        <div />
        <div>
          {adding ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setAdding(false);
                reset();
              }}
            >
              Cancel
            </Button>
          ) : (
            <Button size="sm" onClick={() => setAdding(true)}>
              Add Bank Application
            </Button>
          )}
        </div>
      </div>

      {adding && (
        <form
          onSubmit={handleSubmit((v) => createMutation.mutate(v))}
          className="space-y-3"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Input placeholder="Bank" {...register("bank")} />
            <Input
              placeholder="Application No"
              {...register("applicationNo")}
            />
            <Input
              placeholder="Applied Amount"
              {...register("appliedAmount")}
            />
          </div>
          <div className="flex justify-end">
            <Button type="submit">Save</Button>
          </div>
        </form>
      )}

      {rows.length === 0 ? (
        <EmptyState message="No bank or NBFC applications found." />
      ) : (
        <DataTable
          columns={[
            "Bank / NBFC",
            "Application No",
            "Login Date",
            "Applied",
            "Status",
            "Remarks",
          ]}
          rows={rows.map((row, index) => (
            <tr
              key={row.id ?? index}
              className="border-t dark:border-slate-800"
            >
              <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">
                {row.bank || "—"}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-slate-500">
                {row.applicationNo || "—"}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatDate(row.loginDate)}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {formatINR(row.appliedAmount)}
              </td>
              <td className="px-4 py-3 text-slate-500">{row.status || "—"}</td>
              <td className="px-4 py-3 text-slate-500">
                <div className="flex items-center gap-2">
                  <span>{row.remarks || "—"}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const status = window.prompt("Status", row.status ?? "");
                      if (status === null) return;
                      const remarks = window.prompt(
                        "Remarks",
                        row.remarks ?? "",
                      );
                      if (remarks === null) return;
                      updateMutation.mutate({
                        bankId: row.id,
                        payload: { status, remarks },
                      });
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        />
      )}
    </div>
  );
}
