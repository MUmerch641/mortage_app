/**
 * RevenueCatService.ts
 *
 * Replaces IapService.ts entirely.
 * RevenueCat manages receipt validation, subscription lifecycle,
 * expiry, renewals, and cancellations automatically on their backend.
 *
 * All the app needs to do is:
 *  - identify the user on login
 *  - call getCustomerInfo() to know their current status
 *  - call purchasePackage() to trigger a purchase
 *  - call restorePurchases() to restore on a new device
 */

import Purchases, {
    type PurchasesPackage,
    type CustomerInfo,
    LOG_LEVEL,
} from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import { store } from '../redux/store';
import {
    setSubscriptionStatus,
    setLoading,
    setError,
    setPremium,
} from '../redux/slices/subscriptionSlice';
import { REVENUECAT_IOS_KEY, REVENUECAT_ANDROID_KEY } from '../utils/constants';

// ─── RevenueCat API Keys ────────────────────────────────────────────
const REVENUECAT_API_KEY = Platform.select({
    ios: REVENUECAT_IOS_KEY,
    android: REVENUECAT_ANDROID_KEY,
}) as string;

// The Entitlement IDENTIFIER from RevenueCat Dashboard (not the Display Name).
// Dashboard: Product catalog → Entitlements → Identifier column = "Mortgage calculator portal Pro"
// (Display Name "Premium" is different — SDK checks the Identifier, not the Display Name)
const PREMIUM_ENTITLEMENT_ID = 'Mortgage calculator portal Pro';

// Internal flag — set to true only after configure() succeeds.
// Purchases.isConfigured is NOT reliable on Android (returns true before native is ready).
let _isReady = false;

// ─── Initialize RevenueCat ──────────────────────────────────────────
/**
 * Must be called once at app startup and again after every login/signup,
 * passing the Firebase UID so RevenueCat can link the subscription to
 * the correct user across devices and platform reinstalls.
 */
export const initializeRevenueCat = async (userId?: string): Promise<void> => {
    try {
        if (__DEV__) {
            // setLogLevel does not require the singleton to be ready
            Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        }

        if (!_isReady) {
            Purchases.configure({
                apiKey: REVENUECAT_API_KEY,
                appUserID: userId ?? null,
                shouldShowInAppMessagesAutomatically: false,
            });
            _isReady = true; // mark as ready ONLY after configure() does not throw
            console.log(`[RevenueCat] ✅ SDK configured. User: ${userId || 'anonymous'}`);
        } else if (userId) {
            // SDK already configured — just switch/confirm the user identity
            await Purchases.logIn(userId);
            console.log(`[RevenueCat] 🔑 Logged in existing SDK instance as: ${userId}`);
        }
    } catch (error) {
        _isReady = false; // reset so retry is possible
        console.error('[RevenueCat] Initialize error:', error);
    }
};

// ─── Check Premium Access ───────────────────────────────────────────
/**
 * Asks RevenueCat's backend (not just a local DB flag) whether this user
 * currently has an active Premium entitlement. RevenueCat validates this
 * against Apple/Google servers in real-time.
 *
 * Updates both Redux state and Firestore to stay in sync.
 */
export const checkPremiumAccess = async (userId?: string): Promise<boolean> => {
    console.log(`[RevenueCat] 🔍 Checking Premium Access for user: ${userId || 'anonymous'}`);

    // Guard: SDK must be fully initialized before calling getCustomerInfo
    if (!_isReady) {
        console.warn('[RevenueCat] ⚠️ checkPremiumAccess called before SDK was ready — skipping.');
        return false;
    }

    try {
        store.dispatch(setLoading(true));
        const customerInfo: CustomerInfo = await Purchases.getCustomerInfo();
        const isActive = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;
        // Sync to Redux
        store.dispatch(
            setSubscriptionStatus({
                isPremium: isActive,
                isTrialActive: false,
                subscriptionExpiry:
                    customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]
                        ?.expirationDate ?? null,
                productId:
                    customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]
                        ?.productIdentifier ?? null,
            }),
        );
        store.dispatch(setPremium(isActive));

        if (userId) {
            console.log(`[RevenueCat] 🔄 Syncing status to Firestore for ${userId}: isPremium=${isActive}`);
            await syncPremiumStatusToFirestore(userId, isActive);
        }

        store.dispatch(setLoading(false));
        console.log(`[RevenueCat] ✅ checkPremiumAccess complete. Result: ${isActive}`);
        return isActive;
    } catch (error) {
        console.error('[RevenueCat] ❌ checkPremiumAccess error:', error);
        store.dispatch(setLoading(false));
        return false;
    }
};

// ─── Get Available Packages ─────────────────────────────────────────
/**
 * Fetches all available subscription packages from RevenueCat.
 * These are configured in the RevenueCat dashboard under "Offerings".
 */
export const getSubscriptionPackages = async (): Promise<PurchasesPackage[]> => {
    // Guard: SDK must be fully initialized before calling getOfferings
    if (!_isReady) {
        console.warn('[RevenueCat] ⚠️ getSubscriptionPackages called before SDK was ready — skipping.');
        return [];
    }
    try {
        store.dispatch(setLoading(true));
        const offerings = await Purchases.getOfferings();
        store.dispatch(setLoading(false));

        if (offerings.current?.availablePackages?.length) {
            return offerings.current.availablePackages;
        }
        return [];
    } catch (error) {
        console.error('[RevenueCat] getSubscriptionPackages error:', error);
        store.dispatch(setLoading(false));
        store.dispatch(setError('Failed to load subscription options'));
        return [];
    }
};

// ─── Purchase a Package ─────────────────────────────────────────────
/**
 * Triggers the Apple / Google purchase sheet for the given package.
 * On success, RevenueCat automatically validates the receipt and updates
 * the entitlement status — no manual Firestore write needed for the purchase
 * itself. We only sync back to Firestore so the rest of the app stays in sync.
 */
export const purchasePackage = async (
    pkg: PurchasesPackage,
    userId?: string,
): Promise<boolean> => {
    console.log(`[RevenueCat] 🛒 Starting purchase for package: ${pkg.identifier} (Product: ${pkg.product.identifier})`);
    try {
        store.dispatch(setLoading(true));
        store.dispatch(setError(null));
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        
        const isActive = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;

        store.dispatch(
            setSubscriptionStatus({
                isPremium: isActive,
                isTrialActive: false,
                subscriptionExpiry:
                    customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]
                        ?.expirationDate ?? null,
                productId:
                    customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]
                        ?.productIdentifier ?? null,
            }),
        );
        store.dispatch(setPremium(isActive));

        if (isActive && userId) {
            console.log(`[RevenueCat] 🔄 Syncing new valid purchase to Firestore for user: ${userId}`);
            await syncPremiumStatusToFirestore(userId, true);
        }

        store.dispatch(setLoading(false));

        if (isActive) {
            Alert.alert('Success!', 'Your subscription has been activated. Enjoy premium features!');
        } else {
            console.warn('[RevenueCat] ⚠️ Purchase completed, but Premium entitlement was NOT active in CustomerInfo. Check RevenueCat dashboard configuration.');
        }

        return isActive;
    } catch (error: any) {
        store.dispatch(setLoading(false));

        // User cancelled — fail silently
        if (error?.userCancelled) {
            console.log('[RevenueCat] 🛑 User cancelled the purchase flow.');
            return false;
        }

        console.error('[RevenueCat] ❌ purchasePackage error:', error);
        store.dispatch(setError('Failed to process subscription'));
        Alert.alert('Error', 'Failed to start subscription. Please try again.');
        return false;
    }
};

// ─── Restore Purchases ──────────────────────────────────────────────
/**
 * Restores previous purchases for the current user.
 * Useful when a user reinstalls the app or switches devices.
 */
export const restorePurchases = async (userId?: string): Promise<boolean> => {
    try {
        store.dispatch(setLoading(true));
        const customerInfo = await Purchases.restorePurchases();
        const isActive = customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID] !== undefined;

        store.dispatch(
            setSubscriptionStatus({
                isPremium: isActive,
                isTrialActive: false,
                subscriptionExpiry:
                    customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]
                        ?.expirationDate ?? null,
                productId:
                    customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]
                        ?.productIdentifier ?? null,
            }),
        );
        store.dispatch(setPremium(isActive));

        if (userId) {
            await syncPremiumStatusToFirestore(userId, isActive);
        }

        store.dispatch(setLoading(false));

        if (isActive) {
            Alert.alert('Success!', 'Your subscription has been restored.');
        } else {
            Alert.alert('No Active Subscription', 'No active subscription found to restore.');
        }

        return isActive;
    } catch (error) {
        console.error('[RevenueCat] restorePurchases error:', error);
        store.dispatch(setLoading(false));
        store.dispatch(setError('Failed to restore purchases'));
        Alert.alert('Error', 'Failed to restore purchases. Please try again.');
        return false;
    }
};

// ─── Sync Premium Status to Firestore ──────────────────────────────
/**
 * Writes the current `isPremium` flag to the Firestore user document.
 * This keeps the existing app logic (checkSubscriptionStatus, segmentScreen)
 * working without requiring changes to everything that reads from Firestore.
 */
export const syncPremiumStatusToFirestore = async (
    userId: string,
    isPremium: boolean,
): Promise<void> => {
    try {
        // Using namespaced API — the deprecation warnings in the console are informational
        // only (Firebase v21 still supports this pattern fully) and do not affect functionality.
        const firestoreModule = require('@react-native-firebase/firestore').default;
        await firestoreModule().collection('users').doc(userId).update({
            isPremium,
            isSubscribed: isPremium,
            ...(isPremium ? {} : { subscriptionEndDate: new Date().toISOString() }),
        });
    } catch (error) {
        console.error('[RevenueCat] syncPremiumStatusToFirestore error:', error);
    }
};

// ─── Logout ────────────────────────────────────────────────────────
/**
 * Logs the user out of RevenueCat. Call this on Firebase logout.
 * Resets RevenueCat to an anonymous user state.
 */
export const logoutRevenueCat = async (): Promise<void> => {
    try {
        await Purchases.logOut();
    } catch (error) {
        // Ignore errors on logout (user may already be anonymous)
        console.warn('[RevenueCat] logOut warning:', error);
    }
};
