import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SubscriptionState {
    isPremium: boolean;
    isTrialActive: boolean;
    subscriptionExpiry: string | null;
    productId: string | null;
    isLoading: boolean;
    error: string | null;
    // True while App.tsx is doing the post-login subscription check
    isCheckingSubscription: boolean;
}

const initialState: SubscriptionState = {
    isPremium: false,
    isTrialActive: false,
    subscriptionExpiry: null,
    productId: null,
    isLoading: false,
    error: null,
    isCheckingSubscription: false,
};

const subscriptionSlice = createSlice({
    name: 'subscription',
    initialState,
    reducers: {
        setSubscriptionStatus: (
            state,
            action: PayloadAction<{
                isPremium: boolean;
                isTrialActive: boolean;
                subscriptionExpiry: string | null;
                productId: string | null;
            }>,
        ) => {
            state.isPremium = action.payload.isPremium;
            state.isTrialActive = action.payload.isTrialActive;
            state.subscriptionExpiry = action.payload.subscriptionExpiry;
            state.productId = action.payload.productId;
            state.error = null;
        },
        setPremium: (state, action: PayloadAction<boolean>) => {
            state.isPremium = action.payload;
        },
        setTrialActive: (state, action: PayloadAction<boolean>) => {
            state.isTrialActive = action.payload;
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setError: (state, action: PayloadAction<string | null>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        setCheckingSubscription: (state, action: PayloadAction<boolean>) => {
            state.isCheckingSubscription = action.payload;
        },
        resetSubscription: state => {
            state.isPremium = false;
            state.isTrialActive = false;
            state.subscriptionExpiry = null;
            state.productId = null;
            state.isLoading = false;
            state.error = null;
            state.isCheckingSubscription = false;
        },
    },
});

export const {
    setSubscriptionStatus,
    setPremium,
    setTrialActive,
    setLoading,
    setError,
    setCheckingSubscription,
    resetSubscription,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
