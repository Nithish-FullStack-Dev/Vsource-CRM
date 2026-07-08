export const LOAN_APPLICATION_KEYS = {
  all: ['loan-applications'] as const,
  list: (f?: unknown) => ['loan-applications', 'list', f ?? {}] as const,
  detail: (id: string) => ['loan-applications', 'detail', id] as const,
  documents: (id: string) => ['loan-applications', 'documents', id] as const,
};
