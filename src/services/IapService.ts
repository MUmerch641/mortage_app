import {
    initConnection,
    endConnection,
    getSubscriptions,
    requestSubscription,
    getAvailablePurchases,
    finishTransaction,
    purchaseUpdatedListener,
    purchaseErrorListener,
    flushFailedPurchasesCachedAsPendingAndroid,
    type SubscriptionPurchase,
    type PurchaseError,
    type Subscription,
} from 'react-native-iap';
import { Platform, Alert, EmitterSubscription } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { store } from '../redux/store';
import {
    setSubscriptionStatus,
    setLoading,
    setError,
    setPremium,
} from '../redux/slices/subscriptionSlice';

// Product IDs - Must match App Store Connect / Google Play Console
export const SUBSCRIPTION_SKUS = Platform.select({
    ios: ['mortgage_monthly_sub_10'],
    android: ['mortgage_monthly_sub_10'],
}) as string[];


// Subscription duration in months
const SUBSCRIPTION_DURATION_MONTHS = 1;

// Trial duration in months
const TRIAL_DURATION_MONTHS = 2;

let purchaseUpdateSubscription: EmitterSubscription | null = null;
let purchaseErrorSubscription: EmitterSubscription | null = null;

// Guard to prevent multiple simultaneous initializations
let isInitializing = false;
let isInitialized = false;

// Session-level set to skip transactions we've already handled in this JS session.
// This prevents duplicate processing if the listener fires multiple times for the
// same transaction before finishTransaction completes.
const processedTransactionIds = new Set<string>();

// Flag: only show the success alert for purchases initiated by the user in THIS
// session (i.e. after calling purchaseSubscription). Stale/replayed transactions
// from StoreKit's queue should be finished silently.
let userInitiatedPurchase = false;

/**
 * Initialize IAP connection and set up listeners.
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export const initializeIAP = async (): Promise<boolean> => {
    if (isInitialized || isInitializing) {
        return isInitialized;
    }

    isInitializing = true;
    try {
        await initConnection();

        // On Android, flush any stale failed purchases to prevent stuck states
        if (Platform.OS === 'android') {
            try {
                await flushFailedPurchasesCachedAsPendingAndroid();
            } catch (flushError) {
                console.log('Error flushing failed purchases (non-critical):', flushError);
            }
        }

        // Set up purchase listeners (only once)
        setupPurchaseListeners();

        isInitialized = true;
        return true;
    } catch (error) {
        console.error('Failed to initialize IAP:', error);
        store.dispatch(setError('Failed to connect to store'));
        return false;
    } finally {
        isInitializing = false;
    }
};

/**
 * Check whether a transactionId was already synced to Firestore.
 * This survives JS reloads, unlike the in-memory Set.
 */
const isTransactionAlreadySynced = async (
    transactionId: string,
): Promise<boolean> => {
    try {
        const currentUser = auth().currentUser;
        const uid =
            currentUser?.uid || (store.getState().user?.details as any)?._user?.uid;
        if (!uid) return false;

        const userDoc = await firestore()
            .collection('users')
            .doc(uid)
            .get();
        if (!userDoc.exists) return false;

        const data = userDoc.data();
        return data?.iapTransactionId === transactionId;
    } catch {
        return false;
    }
};

/**
 * Set up listeners for purchase updates and errors.
 * Ensures only ONE set of listeners exists at any time.
 */
const setupPurchaseListeners = () => {
    // Remove existing listeners first to guarantee no duplicates
    removePurchaseListeners();

    // Listen for successful purchases
    purchaseUpdateSubscription = purchaseUpdatedListener(
        async (purchase: SubscriptionPurchase) => {
            const receipt = purchase.transactionReceipt;
            const transactionId = purchase.transactionId;

            // ── Guard: no receipt or no transactionId → nothing to do ──
            if (!receipt || !transactionId) {
                console.warn(
                    'Purchase missing receipt or transactionId, finishing & skipping.',
                    purchase,
                );
                try {
                    await finishTransaction({ purchase, isConsumable: false });
                } catch (e) {
                    console.log('Error finishing incomplete transaction:', e);
                }
                return;
            }

            // ── Guard: already handled in this JS session ──
            if (processedTransactionIds.has(transactionId)) {
                console.log(
                    `Transaction ${transactionId} already processed in this session. Finishing silently.`,
                );
                try {
                    await finishTransaction({ purchase, isConsumable: false });
                } catch (e) {
                    console.log('Error finishing duplicate transaction:', e);
                }
                return;
            }

            // Mark as in-flight immediately so concurrent listener fires are ignored
            processedTransactionIds.add(transactionId);

            // ── Guard: already synced to Firestore (survives JS reloads) ──
            const alreadySynced = await isTransactionAlreadySynced(transactionId);
            if (alreadySynced) {
                console.log(
                    `Transaction ${transactionId} already in Firestore. Finishing silently.`,
                );
                try {
                    await finishTransaction({ purchase, isConsumable: false });
                } catch (e) {
                    console.log('Error finishing already-synced transaction:', e);
                }
                return;
            }

            // ── Process the purchase ──
            try {
                await validateAndSyncPurchase(purchase);

                // ALWAYS finish the transaction after a successful DB write
                await finishTransaction({ purchase, isConsumable: false });
                console.log(`Transaction ${transactionId} finished successfully.`);

                // Only show the alert if the user actively pressed "Subscribe" in
                // this session. Stale replayed transactions are handled silently.
                if (userInitiatedPurchase) {
                    userInitiatedPurchase = false; // reset so it doesn't fire again
                    Alert.alert(
                        'Success!',
                        'Your subscription has been activated. Enjoy premium features!',
                    );
                }
            } catch (error) {
                console.error('Error processing purchase:', error);
                // Remove from session set so the user can retry
                processedTransactionIds.delete(transactionId);

                // Still try to finish the transaction to prevent infinite replays.
                // If the DB write failed the user can restore later.
                try {
                    await finishTransaction({ purchase, isConsumable: false });
                } catch (finishErr) {
                    console.log('Error finishing failed-processing transaction:', finishErr);
                }

                if (userInitiatedPurchase) {
                    userInitiatedPurchase = false;
                    Alert.alert('Error', 'Failed to process purchase. Please try again.');
                }
                store.dispatch(setLoading(false));
            }
        },
    );

    // Listen for purchase errors
    purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
        store.dispatch(setLoading(false));
        userInitiatedPurchase = false;

        if (error.code === 'E_USER_CANCELLED') {
            // User cancelled the purchase, fail silently
        } else {
            Alert.alert(
                'Purchase Failed',
                error.message || 'An error occurred during purchase. Please try again.',
            );
            store.dispatch(setError(error.message || 'Purchase failed'));
        }
    });
};

/**
 * Remove purchase listeners
 */
export const removePurchaseListeners = () => {
    if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
        purchaseUpdateSubscription = null;
    }
    if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
        purchaseErrorSubscription = null;
    }
};

/**
 * End IAP connection and cleanup
 */
export const endIAPConnection = async () => {
    removePurchaseListeners();
    processedTransactionIds.clear();
    isInitialized = false;
    isInitializing = false;
    userInitiatedPurchase = false;
    await endConnection();
};

/**
 * Get available subscription products
 */
export const getSubscriptionProducts = async (): Promise<Subscription[]> => {
    try {
        store.dispatch(setLoading(true));
        const subscriptions = await getSubscriptions({ skus: SUBSCRIPTION_SKUS });
        store.dispatch(setLoading(false));
        return subscriptions;
    } catch (error) {
        console.error('Failed to get subscriptions:', error);
        store.dispatch(setLoading(false));
        store.dispatch(setError('Failed to load subscription options'));
        return [];
    }
};

/**
 * Request a subscription purchase
 */
export const purchaseSubscription = async (
    sku: string,
    offerToken?: string,
): Promise<void> => {
    try {
        store.dispatch(setLoading(true));
        store.dispatch(setError(null));

        // Mark that a user actively initiated this purchase so the listener
        // can safely show the success alert exactly once.
        userInitiatedPurchase = true;

        if (Platform.OS === 'android') {
            // Android Billing Library v5+ requires offerToken via subscriptionOffers
            let token = offerToken;
            if (!token) {
                // Fetch subscriptions to get the offerToken if not passed in
                const subs = await getSubscriptions({ skus: SUBSCRIPTION_SKUS });
                const sub: any = subs.find(s => s.productId === sku);
                token = sub?.subscriptionOfferDetails?.[0]?.offerToken;
            }
            if (!token) {
                throw new Error('Could not find offer token for this subscription');
            }
            await requestSubscription({
                sku,
                subscriptionOffers: [{ sku, offerToken: token }],
            });
        } else {
            // iOS uses simple sku-based request
            await requestSubscription({ sku });
        }

        // Note: The actual purchase result will be handled by the purchaseUpdatedListener
    } catch (error: any) {
        console.error('Failed to request subscription:', error);
        store.dispatch(setLoading(false));

        if (error.code !== 'E_USER_CANCELLED') {
            store.dispatch(setError('Failed to process subscription'));
            Alert.alert('Error', 'Failed to start subscription. Please try again.');
        }
    }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async (userId: string): Promise<boolean> => {
    try {
        store.dispatch(setLoading(true));
        store.dispatch(setError(null));

        const purchases = await getAvailablePurchases();

        if (!purchases || purchases.length === 0) {
            store.dispatch(setLoading(false));
            Alert.alert(
                'No Purchases Found',
                'No previous purchases were found to restore.',
            );
            return false;
        }

        // Find the most recent valid subscription
        const validSubscription = purchases.find(purchase =>
            SUBSCRIPTION_SKUS.includes(purchase.productId),
        );

        if (validSubscription) {
            await validateAndSyncPurchase(validSubscription as SubscriptionPurchase, userId);

            // Finish ALL restored purchases so Apple/Google stop replaying them
            for (const p of purchases) {
                try {
                    await finishTransaction({ purchase: p as SubscriptionPurchase, isConsumable: false });
                    if (p.transactionId) {
                        processedTransactionIds.add(p.transactionId);
                    }
                } catch (e) {
                    console.log('Error finishing restored transaction:', e);
                }
            }

            Alert.alert('Success!', 'Your subscription has been restored.');
            store.dispatch(setLoading(false));
            return true;
        }

        // Even if no valid subscription was found, finish all purchases to clear the queue
        for (const p of purchases) {
            try {
                await finishTransaction({ purchase: p as SubscriptionPurchase, isConsumable: false });
            } catch (e) {
                console.log('Error finishing non-valid restored transaction:', e);
            }
        }

        store.dispatch(setLoading(false));
        Alert.alert('No Valid Subscription', 'No active subscription found to restore.');
        return false;
    } catch (error: any) {
        console.error('Failed to restore purchases:', error);
        store.dispatch(setLoading(false));
        store.dispatch(setError('Failed to restore purchases'));
        Alert.alert('Error', 'Failed to restore purchases. Please try again.');
        return false;
    }
};

import auth from '@react-native-firebase/auth';

/**
 * Validate purchase and sync with Firebase
 */
export const validateAndSyncPurchase = async (
    purchase: SubscriptionPurchase,
    userId?: string,
): Promise<void> => {
    // Get user ID directly from Firebase Auth to ensure we have the most current user
    // This is critical for background listeners where Redux/State might be stale or inaccessible
    const currentUser = auth().currentUser;
    const uid = currentUser?.uid || userId || (store.getState().user?.details as any)?._user?.uid;

    if (!uid) {
        console.error('validateAndSyncPurchase: No user ID found via Auth, args, or Redux');
        throw new Error('User not logged in');
    }

    console.log(`Syncing purchase for user: ${uid}`);

    // Calculate subscription end date
    const purchaseDate = new Date(Number(purchase.transactionDate) || Date.now());
    const subscriptionEndDate = new Date(purchaseDate);
    subscriptionEndDate.setMonth(
        subscriptionEndDate.getMonth() + SUBSCRIPTION_DURATION_MONTHS,
    );

    // Update Firestore
    try {
        await firestore()
            .collection('users')
            .doc(uid)
            .update({
                isPremium: true,
                isSubscribed: true,
                isTrialUsed: true,
                subscriptionType: 'monthly',
                subscriptionStartDate: purchaseDate.toISOString(),
                subscriptionEndDate: subscriptionEndDate.toISOString(),
                lastPaymentDate: purchaseDate.toISOString(),
                iapProductId: purchase.productId,
                iapTransactionId: purchase.transactionId,
                iapPurchaseDate: purchaseDate.toISOString(),
                iapReceipt: purchase.transactionReceipt || '',
            });

        console.log('Firestore updated successfully');
    } catch (firestoreError) {
        console.error('Failed to update Firestore:', firestoreError);
        throw new Error('Failed to update user record');
    }

    // Update Redux state
    store.dispatch(
        setSubscriptionStatus({
            isPremium: true,
            isTrialActive: false,
            subscriptionExpiry: subscriptionEndDate.toISOString(),
            productId: purchase.productId,
        }),
    );

    store.dispatch(setPremium(true));
    store.dispatch(setLoading(false));
};

/**
 * Check if user has premium access (IAP subscription only — no trials)
 */
export const checkPremiumAccess = async (userId: string): Promise<boolean> => {
    try {
        const userDoc = await firestore().collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return false;
        }

        const userData = userDoc.data();

        // Access is only granted when isPremium is true (set by validateAndSyncPurchase after IAP success)
        if (userData?.isPremium === true) {
            store.dispatch(
                setSubscriptionStatus({
                    isPremium: true,
                    isTrialActive: false,
                    subscriptionExpiry: userData.subscriptionEndDate || null,
                    productId: userData.iapProductId || null,
                }),
            );
            return true;
        }

        // No active IAP subscription
        store.dispatch(
            setSubscriptionStatus({
                isPremium: false,
                isTrialActive: false,
                subscriptionExpiry: null,
                productId: null,
            }),
        );
        return false;
    } catch (error) {
        console.error('Error checking premium access:', error);
        return false;
    }
};
