import axios from 'axios';
import type {
  LoanApplication,
  LoanApplicationListFilters,
  LoanDocumentChecklistItem,
} from '@/types/loan-application';
import type {
  LoanApplicationFormValues,
  bankApplicationSchema,
  coApplicantSchema,
  followUpSchema,
  activitySchema,
} from '@/schemas/loan-application/loan-application.schema';
import type { z } from 'zod';
const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? '/api',
  withCredentials: true,
});
export async function getLoanApplications(
  filters: LoanApplicationListFilters = {}
) {
  const { data } = await client.get('/loan-applications', { params: filters });
  return (data?.data ?? data) as LoanApplication[];
}
export async function getLoanApplication(id: string) {
  const { data } = await client.get(`/loan-applications/${id}`);
  return (data?.data ?? data) as LoanApplication;
}
export async function createLoanApplication(
  payload: LoanApplicationFormValues
) {
  const { data } = await client.post('/loan-applications', payload);
  return (data?.data ?? data) as LoanApplication;
}
export async function updateLoanApplication(
  id: string,
  payload: Partial<LoanApplicationFormValues>
) {
  const { data } = await client.patch(`/loan-applications/${id}`, payload);
  return (data?.data ?? data) as LoanApplication;
}
export async function deleteLoanApplication(id: string) {
  const { data } = await client.delete(`/loan-applications/${id}`);
  return data;
}
export async function getLoanDocuments(id: string) {
  const { data } = await client.get(`/loan-applications/${id}/documents`);
  return (data?.data?.checklist ??
    data?.checklist ??
    []) as LoanDocumentChecklistItem[];
}
export async function uploadLoanDocument(p: {
  applicationId: string;
  documentCode: string;
  file: File;
  remarks?: string;
  onProgress?: (v: number) => void;
}) {
  const form = new FormData();
  form.append('documentCode', p.documentCode);
  form.append('file', p.file);
  if (p.remarks) form.append('remarks', p.remarks);
  const { data } = await client.post(
    `/loan-applications/${p.applicationId}/documents`,
    form,
    {
      onUploadProgress: (e) =>
        e.total && p.onProgress?.(Math.round((e.loaded * 100) / e.total)),
    }
  );
  return data?.data ?? data;
}
export async function replaceLoanDocument(p: {
  applicationId: string;
  documentId: string;
  file: File;
  remarks?: string;
  onProgress?: (v: number) => void;
}) {
  const form = new FormData();
  form.append('file', p.file);
  if (p.remarks) form.append('remarks', p.remarks);
  const { data } = await client.patch(
    `/loan-applications/${p.applicationId}/documents/${p.documentId}`,
    form,
    {
      onUploadProgress: (e) =>
        e.total && p.onProgress?.(Math.round((e.loaded * 100) / e.total)),
    }
  );
  return data?.data ?? data;
}
export async function deleteLoanDocument(
  applicationId: string,
  documentId: string
) {
  const { data } = await client.delete(
    `/loan-applications/${applicationId}/documents/${documentId}`
  );
  return data;
}
export async function createLoanBankApplication(
  applicationId: string,
  payload: z.input<typeof bankApplicationSchema>
) {
  const { data } = await client.post(
    `/loan-applications/${applicationId}/banks`,
    payload
  );
  return data?.data ?? data;
}
export async function updateLoanBankApplication(
  applicationId: string,
  bankId: string,
  payload: Partial<z.input<typeof bankApplicationSchema>>
) {
  const { data } = await client.patch(
    `/loan-applications/${applicationId}/banks/${bankId}`,
    payload
  );
  return data?.data ?? data;
}
export async function deleteLoanBankApplication(
  applicationId: string,
  bankId: string
) {
  const { data } = await client.delete(
    `/loan-applications/${applicationId}/banks/${bankId}`
  );
  return data;
}
export async function createLoanCoApplicant(
  applicationId: string,
  payload: z.input<typeof coApplicantSchema>
) {
  const { data } = await client.post(
    `/loan-applications/${applicationId}/co-applicants`,
    payload
  );
  return data?.data ?? data;
}
export async function createLoanFollowUp(
  applicationId: string,
  payload: z.input<typeof followUpSchema>
) {
  const { data } = await client.post(
    `/loan-applications/${applicationId}/follow-ups`,
    payload
  );
  return data?.data ?? data;
}
export async function createLoanActivity(
  applicationId: string,
  payload: z.input<typeof activitySchema>
) {
  const { data } = await client.post(
    `/loan-applications/${applicationId}/activities`,
    payload
  );
  return data?.data ?? data;
}
