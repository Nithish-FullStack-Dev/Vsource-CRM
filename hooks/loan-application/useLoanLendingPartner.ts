// hooks\loan-application\useLoanLendingPartner.ts

"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface UpdateLoanLendingPartnerPayload {
  requiredLoanAmount?: number | null;

  sanctionBankId?: string | null;
  sanctionedAmount?: number | null;
  sanctionDate?: Date | string | null;

  disbursementStatus?: string | null;
  disbursementDate?: Date | string | null;
  disbursedBankId?: string | null;
}

interface MutationArgs {
  id: string;
  data: UpdateLoanLendingPartnerPayload;
}

export const useUpdateLoanLendingPartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: MutationArgs) => {
      const response = await api.patch(
        `/loan-applications/${id}/lending-partner`,
        data,
      );

      return response.data;
    },

    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({
        queryKey: ["loan-application", id],
      });

      queryClient.invalidateQueries({
        queryKey: ["loan-applications"],
      });
    },
  });
};
