import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  interestType: 'Fixed',
  fixedInterestRate: 0,
  numOfFixedYear: 0,
  variableInterestRate: 0,
  IBOR: 0,
  lifeInsuranceRate: 0,
  propertyInsuranceRate: 0,
  numberOfLiables: 0
};


const layout3Slice = createSlice({
  name: 'layout3',
  initialState,
  reducers: {
    layout3Form: (state, action) => {
      return { ...state, ...action.payload }
    },
  },
});
export const { layout3Form } = layout3Slice.actions;
export default layout3Slice.reducer;
