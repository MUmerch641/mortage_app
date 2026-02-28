// src/hooks/useSubscriptionCheck.ts
import { useEffect } from 'react';
import { checkSubscriptionStatus } from '../services/subscriptionService';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

export const useSubscriptionCheck = () => {
  const navigation = useNavigation();
  const userDetails = useSelector((state: any) => state.user.details);

  useEffect(() => {
    const checkSubscription = async () => {
      // Skip check if user is logged out
      if (!userDetails?._user?.uid) {
        return;
      }

      try {
        const status = await checkSubscriptionStatus(userDetails._user.uid);

        if (status.isSubscriptionExpired) {
          // Navigate to the Subscription drawer screen
          navigation.navigate('Subscription' as never);
        }
      } catch (error) {
        console.error('Subscription check error:', error);
      }
    };

    // Initial check
    checkSubscription();

    // Set up periodic checks (every 5 minutes)
    const interval = setInterval(checkSubscription, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [userDetails, navigation]);
};
