import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    name: '',
    mobile: '',
    email: '',
    company: '',
    remarks: ''
};


const layout5Slice = createSlice({
    name: 'layout5',
    initialState,
    reducers: {
        layout5Form: (state, action) => {
            return { ...state, ...action.payload }
        },
    },
});
export const { layout5Form } = layout5Slice.actions;
export default layout5Slice.reducer;
