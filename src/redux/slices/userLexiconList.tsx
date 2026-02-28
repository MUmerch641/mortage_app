import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  list: null,
};

const userLexiconList = createSlice({
  name: 'lexiconList',
  initialState,
  reducers: {
    listLexiconDetails: (state, action) => {
      state.list = action.payload.list;
    },
  },
});
export const {listLexiconDetails} = userLexiconList.actions;
export default userLexiconList.reducer;
