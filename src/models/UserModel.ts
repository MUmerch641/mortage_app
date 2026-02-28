export interface UserModel {
  uid: string;
  email: string;
  displayName?: string;
  signupDate: string;
  isPremium: boolean; // Granted ONLY by a successful IAP transaction
  isSubscribed: boolean;
  // --- Legacy trial fields (not set on new users) ---
  trialEndDate?: string;
  isTrialUsed?: boolean;
  // --- Subscription fields (set by IapService after purchase) ---
  subscriptionType?: 'monthly' | 'annual';
  subscriptionEndDate?: string;
  subscriptionStartDate?: string;
  lastPaymentDate?: string;
  iapProductId?: string;
  iapTransactionId?: string;
  iapPurchaseDate?: string;
  iapReceipt?: string;
}
