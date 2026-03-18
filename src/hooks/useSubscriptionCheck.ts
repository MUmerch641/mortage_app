// src/hooks/useSubscriptionCheck.ts
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { checkPremiumAccess } from '../services/RevenueCatService';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

/**
 * Checks the user's subscription status via RevenueCat:
 *  1. On mount (initial login/app start)
 *  2. Every 5 minutes (periodic)
 *  3. Immediately when the app returns to the foreground
 *
 * Point 3 catches the case where the user cancels their subscription
 * from Google Play / App Store settings and then switches back to the app.
 */
export const useSubscriptionCheck = () => {
  const navigation = useNavigation();
  const userDetails = useSelector((state: any) => state.user.details);
  const userToken = useSelector((state: any) => state.user.token);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const checkSubscription = async () => {
      // Never run checks when logged out — StackNavigation handles routing
      if (!userToken || !userDetails?._user?.uid) {
        return;
      }

      try {
        const isActive = await checkPremiumAccess(userDetails._user.uid);

        if (!isActive) {
          // RevenueCat confirmed subscription is expired / cancelled
          navigation.navigate('Subscription' as never);
        }
      } catch (error) {
        console.error('[useSubscriptionCheck] Error:', error);
      }
    };

    // Check immediately on mount / user change
    checkSubscription();

    // Periodic check every 5 minutes
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);

    // AppState listener: re-check the moment the app comes back to the foreground.
    // This is the critical fix for catching cancellations made in Google Play / App Store settings.
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App just came to the foreground — validate subscription immediately
        checkSubscription();
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [userDetails, userToken, navigation]);
};

