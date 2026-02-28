import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  savedFormData: {
    rental: { yearlyIncome: 0, returnInvestment: 0, capLimit: 0, addedSalary: 0 },
    bonus: { input1: 0, input2: 0, input3: 0, average: 0, percentageAvg: 0, addedSalary: 0 },
    incentive: { input1: 0, input2: 0, input3: 0, input4: 0, input5: 0, input6: 0, average: 0, percentageAvg: 0, addedSalary: 0 },
    schoolingAllowance: { yearlyAllowance: 0, percentageConsidered: 0, addedSalary: 0 },
    ticketAllowance: { yearlyAllowance: 0, percentageConsidered: 0, addedSalary: 0 }
  }
};

const incomeDetailSlice = createSlice({
  name: 'incomeDetail',
  initialState,
  reducers: {
    incomeDetailFormValue: (state, action) => {
      state.savedFormData = action.payload; // ✅ Store form data in Redux
    },
    resetIncomeDetail: (state) => {
      // Reset to initial state
      state.savedFormData = initialState.savedFormData;
    },
  },
});

export const { incomeDetailFormValue, resetIncomeDetail } = incomeDetailSlice.actions;
export default incomeDetailSlice.reducer;
