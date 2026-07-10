import axios from "axios";
import { api } from "@/lib/api";
import type {
  LoanBusinessDetails,
  LoanBusinessResponse,
  UpdateLoanBusinessPayload,
} from "@/types/loan-application/business.types";

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to update business details";
};

export const loanBusinessService = {
  updateBusinessDetails: async (
    applicationId: string,
    payload: UpdateLoanBusinessPayload,
  ): Promise<LoanBusinessDetails> => {
    try {
      const response = await api.patch<LoanBusinessResponse>(
        `/loan-applications/${applicationId}/business`,
        payload,
      );

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
