import { createSlice } from '@reduxjs/toolkit';

interface Layout1State {
  income: number;
  additionalIncome: number;
  dbr: number;
  product: string;
  dob: string;
  ageAtMaturity: number;
  bufferPeriod: number;
}

const initialState: Layout1State = {
  income: 0,
  additionalIncome: 0,
  dbr: 0,
  product: 'Ready property',
  dob: '',
  ageAtMaturity: 0,
  bufferPeriod: 0,
};

const layout1Slice = createSlice({
  name: 'layout1',
  initialState,
  reducers: {
    layout1Form: (state, action) => {
      return { ...state, ...action.payload }
    },
  },
});
export const { layout1Form } = layout1Slice.actions;
export default layout1Slice.reducer;
