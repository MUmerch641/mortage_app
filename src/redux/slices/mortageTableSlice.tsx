

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mortageTableArray:[],
};

const mortageTableSlice = createSlice({
  name: 'mortageTable',
  initialState,
  reducers: {
    mortageTableValue: (state, action) => {
      console.log('Reducer action:', action); // Log action type and payload
      state.mortageTableArray = action.payload.mortageTableArray;
    },
  },
});

export const { mortageTableValue } = mortageTableSlice.actions;
export default mortageTableSlice.reducer;
