export type UpdateLoanFinancialPayload = {
  tuitionFee: number | null;
  livingExpenses: number | null;
  otherExpenses: number | null;
  totalCourseCost: number | null;
  ownContribution: number | null;
  requiredLoanAmount: number | null;
  loanPreference: string | null;
  collateralAvailable: string | null;
  loanPurpose: string | null;
  preferredTenure: number | null;
  cibilScore: number | null;
  propertyType: string | null;
  propertyLocation: string | null;
  propertyValue: number | null;
  downPayment: number | null;
};

export type LoanFinancialDetails = {
  id: string;
  tuitionFee: string | null;
  livingExpenses: string | null;
  otherExpenses: string | null;
  totalCourseCost: string | null;
  ownContribution: string | null;
  requiredLoanAmount: string | null;
  loanPreference: string | null;
  collateralAvailable: string | null;
  loanPurpose: string | null;
  preferredTenure: number | null;
  cibilScore: number | null;
  propertyType: string | null;
  propertyLocation: string | null;
  propertyValue: string | null;
  downPayment: string | null;
};

export type LoanFinancialResponse = {
  success: boolean;
  message: string;
  data: LoanFinancialDetails;
};
