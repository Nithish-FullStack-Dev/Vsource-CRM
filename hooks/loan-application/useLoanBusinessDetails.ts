"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loanBusinessService } from "@/services/loan-application/loanBusiness.service";
import type {
  LoanBusinessDetails,
  UpdateLoanBusinessPayload,
} from "@/types/loan-application/business.types";

export const useUpdateLoanBusinessDetails = (applicationId: string) => {
  const queryClient = useQueryClient();

  return useMutation<LoanBusinessDetails, Error, UpdateLoanBusinessPayload>({
    mutationFn: (payload) =>
      loanBusinessService.updateBusinessDetails(applicationId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey.some((value) => value === applicationId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["loan-application"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["loan-applications"],
        }),
      ]);
    },
  });
};
