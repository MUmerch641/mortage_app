import firestore from '@react-native-firebase/firestore';

export const checkSubscriptionStatus = async (userId: string) => {
  try {
    const userRef = firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return {requiresSubscription: true, isTrialExpired: true};
    }

    const userData = userDoc.data();

    // If user is already subscribed
    if (userData?.isSubscribed) {
      return {requiresSubscription: false, isTrialExpired: false};
    }

    // Check trial period
    const signupDate = userData?.signupDate?.toDate();
    const now = new Date();
    const trialEndDate = new Date(signupDate);
    trialEndDate.setDate(trialEndDate.getDate() + 60); // 2 month (60 day) trial

    const isTrialExpired = now > trialEndDate;

    return {
      requiresSubscription: isTrialExpired,
      isTrialExpired,
    };
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {requiresSubscription: true, isTrialExpired: true};
  }
};
