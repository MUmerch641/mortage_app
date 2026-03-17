// src/hooks/useSubscriptionCheck.ts
import { useEffect } from 'react';
import { checkPremiumAccess } from '../services/RevenueCatService';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

/**
 * Periodically checks the user's subscription status via RevenueCat.
 * RevenueCat validates against Apple/Google servers in real-time,
 * so this will correctly detect expired subscriptions automatically.
 */
export const useSubscriptionCheck = () => {
  const navigation = useNavigation();
  const userDetails = useSelector((state: any) => state.user.details);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!userDetails?._user?.uid) {
        return;
      }

      try {
        const isActive = await checkPremiumAccess(userDetails._user.uid);

        if (!isActive) {
          // RevenueCat confirmed subscription is expired or inactive
          navigation.navigate('Subscription' as never);
        }
      } catch (error) {
        console.error('[useSubscriptionCheck] Error:', error);
      }
    };

    // Initial check
    checkSubscription();

    // Periodic check every 5 minutes
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userDetails, navigation]);
};
