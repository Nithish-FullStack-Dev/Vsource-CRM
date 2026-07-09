// hooks\loan-application\useLoanApplications.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LoanApplicationListFilters } from "@/types/loan-application";
import type { LoanApplicationFormValues } from "@/schemas/loan-application/loan-application.schema";
import {
  createLoanApplication,
  deleteLoanApplication,
  getLoanApplication,
  getLoanApplications,
  updateLoanApplication,
} from "@/services/loan-application/loan-application.service";
import { LOAN_APPLICATION_KEYS } from "@/services/loan-application/loan-application-query-key";
const msg = (e: unknown, f: string) =>
  e instanceof Error && e.message ? e.message : f;
export function useLoanApplications(filters: LoanApplicationListFilters = {}) {
  return useQuery({
    queryKey: LOAN_APPLICATION_KEYS.list(filters),
    queryFn: () => getLoanApplications(filters),
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
    mutationFn: (p: Partial<LoanApplicationFormValues>) =>
      updateLoanApplication(id, p),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.detail(id),
      });
      await qc.invalidateQueries({ queryKey: LOAN_APPLICATION_KEYS.all });
      toast.success("Loan application updated successfully");
    },
    onError: (e) => toast.error(msg(e, "Failed to update loan application")),
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
