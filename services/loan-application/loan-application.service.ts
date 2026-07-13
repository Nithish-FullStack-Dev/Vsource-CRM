// services\loan-application\loan-application.service.ts
import axios from "axios";
import type {
  LoanApplicationListFilters,
  LoanDocumentChecklistItem,
} from "@/types/loan-application";

import type {
  LoanApplicationFormValues,
  bankApplicationSchema,
  coApplicantSchema,
  followUpSchema,
  activitySchema,
  CoApplicantFormValues,
} from "@/schemas/loan-application/loan-application.schema";

import type { z } from "zod";
import { api } from "@/lib/api";
import { LoanApplication } from "@/(dashboard)/loan-application/all/[id]/_components/types";

export async function getLoanApplications(
  filters: LoanApplicationListFilters = {},
) {
  const { data } = await api.get("/loan-applications", {
    params: filters,
  });

  return (data?.data ?? data) as LoanApplication[];
}

export async function getLoanApplication(id: string) {
  const { data } = await api.get(`/loan-applications/${id}`);

  return (data?.data ?? data) as LoanApplication;
}

export async function createLoanApplication(
  payload: LoanApplicationFormValues,
) {
  const { data } = await api.post("/loan-applications", payload);

  return (data?.data ?? data) as LoanApplication;
}
export async function updateLoanCoApplicant(
  applicationId: string,
  coApplicantId: string,
  payload: CoApplicantFormValues,
) {
  const response = await axios.patch(
    `/api/loan-applications/${applicationId}/co-applicants/${coApplicantId}`,
    payload,
  );

  return response.data;
}
export async function updateLoanApplication(
  id: string,
  payload: Partial<LoanApplicationFormValues>,
) {
  const { data } = await api.patch(`/loan-applications/${id}`, payload);

  return (data?.data ?? data) as LoanApplication;
}

export async function deleteLoanApplication(id: string) {
  const { data } = await api.delete(`/loan-applications/${id}`);

  return data;
}

/**
 * ============================================================
 * DOCUMENTS
 * ============================================================
 */

export async function getLoanDocuments(id: string) {
  const { data } = await api.get(`/loan-applications/${id}/documents`);

  return (data?.data?.checklist ??
    data?.checklist ??
    []) as LoanDocumentChecklistItem[];
}

export async function uploadLoanDocument(payload: {
  applicationId: string;
  documentCode: string;
  file: File;
  remarks?: string;
  onProgress?: (value: number) => void;
}) {
  const form = new FormData();

  form.append("documentCode", payload.documentCode);
  form.append("file", payload.file);

  if (payload.remarks) {
    form.append("remarks", payload.remarks);
  }

  const { data } = await api.post(
    `/loan-applications/${payload.applicationId}/documents`,
    form,
    {
      onUploadProgress: (event) => {
        if (!event.total) return;

        payload.onProgress?.(Math.round((event.loaded * 100) / event.total));
      },
    },
  );

  return data?.data ?? data;
}

export async function replaceLoanDocument(payload: {
  applicationId: string;
  documentId: string;
  file: File;
  remarks?: string;
  onProgress?: (value: number) => void;
}) {
  const form = new FormData();

  form.append("file", payload.file);

  if (payload.remarks) {
    form.append("remarks", payload.remarks);
  }

  const { data } = await api.patch(
    `/loan-applications/${payload.applicationId}/documents/${payload.documentId}`,
    form,
    {
      onUploadProgress: (event) => {
        if (!event.total) return;

        payload.onProgress?.(Math.round((event.loaded * 100) / event.total));
      },
    },
  );

  return data?.data ?? data;
}

export async function deleteLoanDocument(
  applicationId: string,
  documentId: string,
) {
  const { data } = await api.delete(
    `/loan-applications/${applicationId}/documents/${documentId}`,
  );

  return data;
}

/**
 * ============================================================
 * BANK APPLICATIONS
 * ============================================================
 */

export type BankListItem = {
  id: string;
  name: string;
  status: boolean;
};

export type BankApplicationInput = z.input<typeof bankApplicationSchema>;

export async function getActiveBanks(): Promise<BankListItem[]> {
  const { data } = await api.get("/banks", {
    params: {
      status: true,
    },
  });

  const result = data?.data ?? data;

  return Array.isArray(result) ? result : [];
}

export async function createLoanBankApplication(
  applicationId: string,
  payload: BankApplicationInput,
) {
  const { data } = await api.post(
    `/loan-applications/${applicationId}/banks`,
    payload,
  );

  return data?.data ?? data;
}

export async function updateLoanBankApplication(
  applicationId: string,
  bankApplicationId: string,
  payload: Partial<BankApplicationInput>,
) {
  const { data } = await api.patch(
    `/loan-applications/${applicationId}/banks/${bankApplicationId}`,
    payload,
  );

  return data?.data ?? data;
}

export async function deleteLoanBankApplication(
  applicationId: string,
  bankApplicationId: string,
) {
  const { data } = await api.delete(
    `/loan-applications/${applicationId}/banks/${bankApplicationId}`,
  );

  return data?.data ?? data;
}

/**
 * ============================================================
 * CO-APPLICANTS
 * ============================================================
 */

export async function createLoanCoApplicant(
  applicationId: string,
  payload: z.input<typeof coApplicantSchema>,
) {
  const { data } = await api.post(
    `/loan-applications/${applicationId}/co-applicants`,
    payload,
  );

  return data?.data ?? data;
}

/**
 * ============================================================
 * FOLLOW-UPS
 * ============================================================
 */

export async function createLoanFollowUp(
  applicationId: string,
  payload: z.input<typeof followUpSchema>,
) {
  const { data } = await api.post(
    `/loan-applications/${applicationId}/follow-ups`,
    payload,
  );

  return data?.data ?? data;
}

/**
 * ============================================================
 * ACTIVITIES
 * ============================================================
 */

export async function createLoanActivity(
  applicationId: string,
  payload: z.input<typeof activitySchema>,
) {
  const { data } = await api.post(
    `/loan-applications/${applicationId}/activities`,
    payload,
  );

  return data?.data ?? data;
}
