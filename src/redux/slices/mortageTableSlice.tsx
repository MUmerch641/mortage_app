

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mortageTableArray: [],
};

const mortageTableSlice = createSlice({
  name: 'mortageTable',
  initialState,
  reducers: {
    mortageTableValue: (state, action) => {
      state.mortageTableArray = action.payload.mortageTableArray;
    },
  },
});

export const { mortageTableValue } = mortageTableSlice.actions;
export default mortageTableSlice.reducer;
