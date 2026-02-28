export interface MainScreenProps {
  navigateToTab: (tabIndex: number) => void;
  currentTab: number;
  totalTabs: number;
}

export interface IncomeFormState {
  income: number;
  interestType: string;
  additionalIncome: number;
  dbr: number;
  product: string;
  dob: string;
  ageAtMaturity: number;
  bufferPeriod: number;
}

export interface EligibilityFormState {
  propertyValue: string;
  totalTenureMonth: string;
  LTV: string;
  financeAmount: string;
}

export interface MortgageRow {
  month: number;
  interestRate: string;
  payment: string;
  interest: string;
  principal: string;
  outstanding: string;
  lifeInsurance: string;
  propertyInsurance: string;
  grandTotal: string;
}
