"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loanFinancialService } from "@/services/loan-application/loanFinancial.service";
import type {
  LoanFinancialDetails,
  UpdateLoanFinancialPayload,
} from "@/types/loan-application/financial.types";

export const useUpdateLoanFinancialDetails = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation<LoanFinancialDetails, Error, UpdateLoanFinancialPayload>({
    mutationFn: (payload) =>
      loanFinancialService.updateFinancialDetails(applicationId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey.some(
              (queryKeyValue) => queryKeyValue === applicationId,
            ),
        }),
        queryClient.invalidateQueries({
          queryKey: ["loan-applications"],
        }),
      ]);
    },
  });
};
