import React, { useEffect, useState } from 'react';
import { mortageTableValue } from '../redux/slices/mortageTableSlice';
import { useDispatch } from 'react-redux';

const MortgageTable = ({
  months,
  interestRate,
  initialData,
  onDataGenerated,
}: { months: number, interestRate: string, initialData: any, onDataGenerated: any }) => {
  const dispatch = useDispatch()

  useEffect(() => {
    if (months > 0) {
      const generateRows = () => {
        return Array.from({ length: months }, (_, index) => {
          const month = index + 1;
          const baseData = initialData?.[index] || {}; // Use initialData if provided for specific months

          // Example calculations; replace with your real logic
          const payment = baseData.payment || (1000 + index * 10).toFixed(2); // Mock example
          const interest = baseData.interest || (payment * 0.2).toFixed(2);
          const principal =
            baseData.principal || (payment - interest).toFixed(2);
          const outstanding =
            baseData.outstanding || (50000 - index * 1000).toFixed(2);
          const lifeInsurance =
            baseData.lifeInsurance || (50 + index).toFixed(2);
          const propertyInsurance =
            baseData.propertyInsurance || (30 + index).toFixed(2);
          const grandTotal = (
            parseFloat(payment) +
            parseFloat(lifeInsurance) +
            parseFloat(propertyInsurance)
          ).toFixed(2);

          return {
            month,
            interestRate:
              baseData.interestRate || `${interestRate}%`,
            payment,
            interest,
            principal,
            outstanding,
            lifeInsurance,
            propertyInsurance,
            grandTotal,
          };
        });
      };

      const rows = generateRows();

      dispatch(
        mortageTableValue({
          mortageTableArray: rows,
        }),
      );

      if (onDataGenerated) {
        onDataGenerated(rows); // Pass the generated data to the parent via callback
      }
    }
  }, [months]);

  return null; // No need to render anything
};

export default MortgageTable;
