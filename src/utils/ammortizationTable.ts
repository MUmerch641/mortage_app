import {formatValue} from './helpers';
import {MAX_TENURE_MONTHS} from './mortgageConstants';

type AmortizationInput = {
  loanAmount: number;
  tenureMonths: number;
  fixedInterestRate: number; // e.g. 5.75
  variableInterestRate: number; // e.g. 3.99
  propertyValue: number; // e.g. 4.3
  numOfFixedYear: number; // in years
  lifeInsuranceRate: number; // annual e.g. 0.25 (for 0.25%)
  propertyInsuranceRate: number; // annual e.g. 0.18 (for 0.18%)
};

type AmortizationRow = {
  month: number;
  interestRate: string;
  payment: string;
  interest: string;
  principal: string;
  outstanding: string;
  lifeInsurance: string;
  propertyInsurance: string;
  grandTotal: string;
};

export function generateAmortizationSchedule({
  loanAmount,
  tenureMonths,
  fixedInterestRate,
  variableInterestRate,
  propertyValue,
  numOfFixedYear,
  lifeInsuranceRate,
  propertyInsuranceRate,
}: AmortizationInput): AmortizationRow[] {
  // console.log(
  //   `Loan Amount: ${loanAmount}, Type: ${typeof loanAmount}
  //   Months: ${tenureMonths}, Type: ${typeof tenureMonths}
  //   Fixed Interest Rate: ${fixedInterestRate}, Type: ${typeof fixedInterestRate}
  //   Variable Interest Rate: ${variableInterestRate}, Type: ${typeof variableInterestRate}
  //   Property Value: ${propertyValue}, Type: ${typeof propertyValue}
  //   Number of Fixed Years: ${numOfFixedYear}, Type: ${typeof numOfFixedYear}
  //   Life Insurance Rate: ${lifeInsuranceRate}, Type: ${typeof lifeInsuranceRate}
  //   Property Insurance Rate: ${propertyInsuranceRate}, Type: ${typeof propertyInsuranceRate}`,
  // );
  const normalizedTenureMonths = Math.min(
    Math.max(Math.floor(tenureMonths || 0), 0),
    MAX_TENURE_MONTHS,
  );

  const schedule: AmortizationRow[] = [];
  let outstanding = loanAmount;

  const fixedMonths = Math.min(numOfFixedYear * 12, normalizedTenureMonths);

  const fixedMonthlyRate = fixedInterestRate / 100;
  const variableMonthlyRate = variableInterestRate / 100;

  const fixedPayment = -PMT(
    fixedMonthlyRate / 12,
    normalizedTenureMonths,
    loanAmount,
  );

  for (let month = 1; month <= normalizedTenureMonths; month++) {
    const isFixed = month <= fixedMonths;
    const variablePayment = -PMT(
      variableMonthlyRate / 12,
      normalizedTenureMonths + 1 - month,
      outstanding,
    );
    const rate = isFixed ? fixedMonthlyRate : variableMonthlyRate;
    const payment = isFixed ? fixedPayment : variablePayment;
    const lifeInsurance = outstanding * (lifeInsuranceRate / 100 / 12);

    const interest = (outstanding * rate) / 12;
    const principal = payment - interest;
    outstanding = Math.max(0, outstanding - principal);

    const propertyInsurance =
      (propertyValue * (propertyInsuranceRate / 100)) / 12;
    const grandTotal = payment + lifeInsurance + propertyInsurance;

    schedule.push({
      month,
      interestRate: formatValue(rate * 100, 2, true),
      payment: formatValue(payment, 2),
      interest: formatValue(interest, 2),
      principal: formatValue(principal, 2),
      outstanding: formatValue(outstanding, 2),
      lifeInsurance: formatValue(lifeInsurance, 2),
      propertyInsurance: formatValue(propertyInsurance, 2),
      grandTotal: formatValue(grandTotal, 2),
    });
  }

  return schedule;
}

// Basic PMT formula implementation
function PMT(rate: number, nper: number, pv: number): number {
  return -(rate * pv) / (1 - Math.pow(1 + rate, -nper));
}
