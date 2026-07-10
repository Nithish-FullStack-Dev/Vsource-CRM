export type UpdateLoanBusinessPayload = {
  businessName: string | null;
  businessType: string | null;
  registrationType: string | null;
  registrationNumber: string | null;
  yearsInBusiness: string | null;
  annualTurnover: string | null;
  annualIncome: string | null;
  existingEmi: string | null;
  businessAddress: string | null;
};

export type LoanBusinessDetails = {
  id: string;
  businessName: string | null;
  businessType: string | null;
  registrationType: string | null;
  registrationNumber: string | null;
  yearsInBusiness: string | null;
  annualTurnover: string | null;
  annualIncome: string | null;
  existingEmi: string | null;
  businessAddress: string | null;
};

export type LoanBusinessResponse = {
  success: boolean;
  message: string;
  data: LoanBusinessDetails;
};
