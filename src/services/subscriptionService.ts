import firestore from '@react-native-firebase/firestore';
import { UserModel } from '../models/UserModel';

export const checkSubscriptionStatus = async (userId: string) => {
  try {
    const userDoc = await firestore().collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return {
        hasActiveSubscription: false,
        isTrialActive: false,
        isSubscriptionExpired: true,
      };
    }

    const userData = userDoc.data() as UserModel;

    // Access is granted only when isPremium is true (set by IapService after IAP success)
    const isPremium = userData.isPremium === true;

    return {
      hasActiveSubscription: isPremium,
      isTrialActive: false, // Trial is no longer managed client-side
      isSubscriptionExpired: !isPremium,
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      hasActiveSubscription: false,
      isTrialActive: false,
      isSubscriptionExpired: true,
    };
  }
};


export const updateUserSubscription = async (userId: string, title: string) => {
  const now = new Date();
  const subscriptionEndDate = new Date();

  // Set expiration based on subscription type
  if (title.includes('Monthly')) {
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
  } else {
    subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1);
  }

  await firestore()
    .collection('users')
    .doc(userId)
    .update({
      isSubscribed: true,
      isTrialUsed: true,
      subscriptionType: title.includes('Monthly') ? 'monthly' : 'annual',
      subscriptionStartDate: now.toISOString(),
      subscriptionEndDate: subscriptionEndDate.toISOString(),
      lastPaymentDate: now.toISOString(),
    });
};
