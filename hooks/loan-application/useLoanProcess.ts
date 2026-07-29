import { api } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

interface LoanProcess {
  fintechAssignee?: {
    name: string | null;
  };
  depositStatus?: string | null;
  depositDate?: Date | null;
  loanStatus?: string | null;
  loanCategory?: string | null;
  disbursementDate?: Date | null;
  disbursementStatus: string;
  sanctionBankApplication?: {
    bank?: {
      name?: string;
    } | null;
  };
}

export const useLoanProcess = (leadId: string) => {
  return useQuery<LoanProcess>({
    queryKey: ["loan-process"],
    queryFn: async () => {
      const { data } = await api.get(
        `/loan-applications/${leadId}/loan-process`,
      );
      return data?.data;
    },
    enabled: !!leadId,
  });
};
