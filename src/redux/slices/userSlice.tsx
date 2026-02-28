import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  details: [],
  token: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      state.details = action.payload.details;
      state.token = action.payload.token;
    },
    logoutUser: state => {
      state.details = [];
      state.token = null;
    },
  },
});
export const {login, logoutUser} = userSlice.actions;
export default userSlice.reducer;
