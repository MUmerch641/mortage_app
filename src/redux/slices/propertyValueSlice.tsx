import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  propertyValue: 0,
  propertyValueAddedPercent: 0,
  newPropertyValue: 0,
  newFinanceAmount: 0,
};

const propertyValueSlice = createSlice({
  name: 'propertyValue',
  initialState,
  reducers: {
    propertyValueForm: (state, action) => {
      return { ...state, ...action.payload }
    },
  },
});

export const { propertyValueForm } = propertyValueSlice.actions;
export default propertyValueSlice.reducer;
