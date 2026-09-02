/** lib\shared-student-loan-documents.ts
 * Documents that belong only to the Loan Application.
 *
 * IMPORTANT:
 * Student-owned documents must NOT be added here.
 *
 * Student-owned documents are stored in StudentDocument and are
 * automatically visible from both Student DMS and Loan Documents.
 */
export const LOAN_ONLY_DOCUMENT_CODES = new Set<string>([
  "faadhaar",
  "fpan",
  "maadhaar",
  "mpan",
  "property_tax",
  "electricity_bill",
  "gas_bill",
  "income_certificate",
  "salary_payslips",
  "itr",
  "rental_agreement",
  "pension_payslips",
  "abroad_payslips",
  "abroad_bankstatement",
]);

export function isLoanOnlyDocument(code: string): boolean {
  return LOAN_ONLY_DOCUMENT_CODES.has(code.trim());
}
