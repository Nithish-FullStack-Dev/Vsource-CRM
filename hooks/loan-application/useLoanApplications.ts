// hooks\loan-application\useLoanApplications.ts
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { LoanApplicationListFilters } from "@/types/loan-application";

import type {
  LoanApplicationFormValues,
  UpdateLoanApplicationValues,
} from "@/schemas/loan-application/loan-application.schema";
import {
  createLoanApplication,
  deleteLoanApplication,
  getLoanApplication,
  getLoanApplications,
  updateLoanApplication,
} from "@/services/loan-application/loan-application.service";
import { LOAN_APPLICATION_KEYS } from "@/services/loan-application/loan-application-query-key";
import { api } from "@/lib/api";
import { BankApplication } from "@/(dashboard)/loan-application/all/[id]/_components/types";

const msg = (e: unknown, f: string) =>
  e instanceof Error && e.message ? e.message : f;

export function useLoanApplications(filters: LoanApplicationListFilters = {}) {
  return useQuery({
    queryKey: LOAN_APPLICATION_KEYS.list(filters),
    queryFn: () => getLoanApplications(filters),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLoanApplication(id: string) {
  return useQuery({
    queryKey: LOAN_APPLICATION_KEYS.detail(id),
    enabled: Boolean(id),
    queryFn: () => getLoanApplication(id),
  });
}

export function useCreateLoanApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: LoanApplicationFormValues) => createLoanApplication(p),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: LOAN_APPLICATION_KEYS.all });
      toast.success("Loan enquiry created successfully");
    },
    onError: (e) => toast.error(msg(e, "Failed to create loan enquiry")),
  });
}

export function useUpdateLoanApplication(id: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateLoanApplicationValues) =>
      updateLoanApplication(id, payload),

    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.detail(id),
      });

      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.all,
      });

      toast.success("Loan application updated successfully");
    },

    onError: (error) => {
      toast.error(msg(error, "Failed to update loan application"));
    },
  });
}

export function useDeleteLoanApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteLoanApplication,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: LOAN_APPLICATION_KEYS.all });
      toast.success("Loan application deleted successfully");
    },
    onError: (e) => toast.error(msg(e, "Failed to delete loan application")),
  });
}

export function useLoanStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { loanStatus: string }) => {
      const { data } = await api.patch(
        `/loan-applications/${id}/loan-status`,
        payload,
      );
      return data;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.detail(id),
      });

      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.all,
      });

      toast.success("Loan status updated successfully");
    },
    onError: (error) => {
      toast.error(msg(error, "Failed to update loan application"));
    },
  });
}

export const loanBanksService = {
  async getAll(applicationId: string): Promise<BankApplication[]> {
    const { data } = await api.get(`/loan-applications/${applicationId}/banks`);

    return data;
  },
};

export const useLoanBanks = (applicationId: string) =>
  useQuery({
    queryKey: [...LOAN_APPLICATION_KEYS.loanBankApplication, applicationId],
    queryFn: () => loanBanksService.getAll(applicationId),
    enabled: !!applicationId,
  });
