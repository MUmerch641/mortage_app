import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  LTV: 0,
  totalTenureMonths: 0,
  financeAmount: 0,
  propertyValue: 0,
  newDBR: 0,
};


const layout4Slice = createSlice({
  name: 'layout4',
  initialState,
  reducers: {
    layout4Form: (state, action) => {
      return { ...state, ...action.payload }
    },
  },
});
export const { layout4Form } = layout4Slice.actions;
export default layout4Slice.reducer;
