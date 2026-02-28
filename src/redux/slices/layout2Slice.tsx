import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  monthlyInstallment1: 0,
  monthlyInstallment2: 0,
  monthlyInstallment3: 0,
  monthlyInstallment4: 0,
  monthlyInstallment5: 0,
  monthlyInstallment6: 0,
  percentLiability: 0,
  creditCardLimit1: 0,
  creditCardLimit2: 0,
  creditCardLimit3: 0,
  creditCardLimit4: 0,
  creditCardLimit5: 0,
  creditCardLimit6: 0,
  calculatedDBR: 0, // Store the calculated DBR
};

const layout2Slice = createSlice({
  name: 'layout2',
  initialState,
  reducers: {
    layout2Form: (state, action) => {
      return { ...state, ...action.payload }
    },
  },
});

export const { layout2Form } = layout2Slice.actions;
export default layout2Slice.reducer;
