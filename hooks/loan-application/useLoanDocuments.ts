// hooks\loan-application\useLoanDocuments.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteLoanDocument,
  getLoanDocuments,
  replaceLoanDocument,
  uploadLoanDocument,
} from "@/services/loan-application/loan-application.service";
import { LOAN_APPLICATION_KEYS } from "@/services/loan-application/loan-application-query-key";
export function useLoanDocuments(applicationId: string) {
  return useQuery({
    queryKey: LOAN_APPLICATION_KEYS.documents(applicationId),
    enabled: Boolean(applicationId),
    queryFn: () => getLoanDocuments(applicationId),
  });
}
export function useUploadLoanDocument(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadLoanDocument,
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.documents(applicationId),
      });
      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.detail(applicationId),
      });
    },
  });
}
export function useReplaceLoanDocument(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: replaceLoanDocument,
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.documents(applicationId),
      });
      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.detail(applicationId),
      });
    },
  });
}
export function useDeleteLoanDocument(applicationId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) =>
      deleteLoanDocument(applicationId, documentId),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.documents(applicationId),
      });
      await qc.invalidateQueries({
        queryKey: LOAN_APPLICATION_KEYS.detail(applicationId),
      });
    },
  });
}
