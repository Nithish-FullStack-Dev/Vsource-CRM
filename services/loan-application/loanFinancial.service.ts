import axios from "axios";
import { api } from "@/lib/api";
import type {
  LoanFinancialDetails,
  LoanFinancialResponse,
  UpdateLoanFinancialPayload,
} from "@/types/loan-application/financial.types";

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (error.response?.status === 404) {
      return "Financial details API route was not found";
    }

    if (error.response?.status === 401) {
      return "You are not authorized to update this application";
    }

    if (error.response?.status === 403) {
      return "You do not have permission to update this application";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to update financial details";
};

export const loanFinancialService = {
  updateFinancialDetails: async (
    applicationId: string,
    payload: UpdateLoanFinancialPayload,
  ): Promise<LoanFinancialDetails> => {
    try {
      const response = await api.patch<LoanFinancialResponse>(
        `/loan-applications/${applicationId}/financial`,
        payload,
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || "Unable to update financial details",
        );
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
