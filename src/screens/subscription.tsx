import {
  NavigationProp,
  useIsFocused,
  useNavigation,
  CommonActions,
} from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Image,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import Header from '../components/Header';
import { SvgXml } from 'react-native-svg';
import { backButton } from '../svg';
import Box from '../components/Box';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../../navigationTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkSubscriptionStatus } from '../services/subscriptionService';
import {
  getSubscriptionProducts,
  purchaseSubscription,
  restorePurchases,
  SUBSCRIPTION_SKUS,
} from '../services/IapService';
import type { Subscription as IAPSubscription } from 'react-native-iap';

type NavigationProps = NavigationProp<RootStackParamList, 'Subscription'>;

const Subscription: React.FC<any> = ({ route }) => {
  const navigation = useNavigation<NavigationProps>();
  const userDetails = useSelector((state: any) => state.user.details);
  const subscriptionState = useSelector((state: any) => state.subscription);
  const insets = useSafeAreaInsets();

  const [userSubscribed, setUserSubscribed] = useState(
    userDetails?._user?.isPremium === true || subscriptionState?.isPremium === true
  );
  const [products, setProducts] = useState<IAPSubscription[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [isVerifyingStatus, setIsVerifyingStatus] = useState(true);

  const isFocused = useIsFocused();

  // Prevent going back if subscription is required
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!userSubscribed) {
          return true; // Block back when paywall is shown
        }
        return false;
      },
    );

    return () => backHandler.remove();
  }, [userSubscribed]);

  // Check subscription status
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      setIsVerifyingStatus(true);
      try {
        if (userDetails?._user?.uid) {
          const status = await checkSubscriptionStatus(userDetails._user.uid);
          if (isMounted) {
            setUserSubscribed(status.hasActiveSubscription);
          }
        }
      } catch (error) {
        console.error('--- SUBSCRIPTION SCREEN: Status verify error:', error);
      } finally {
        if (isMounted) {
          setIsVerifyingStatus(false);
        }
      }
    };

    if (isFocused) {
      checkStatus();
    }

    return () => {
      isMounted = false;
    };
  }, [isFocused, userDetails]);

  // Auto-navigate back to the main app immediately if premium and NOT from drawer
  useEffect(() => {
    const isDrawer = navigation.getState()?.type === 'drawer';
    if (userSubscribed && !isVerifyingStatus && !isDrawer) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'HomeDrawer' }],
        })
      );
    }
  }, [userSubscribed, isVerifyingStatus, navigation]);


  // Fetch IAP products when screen focuses
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const subs = await getSubscriptionProducts();
        setProducts(subs);
      } catch (error) {
        console.error('--- SUBSCRIPTION SCREEN: Error fetching products:', error);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (isFocused) {
      fetchProducts();
    }
  }, [isFocused]);

  // Watch Redux subscription state for updates (success, error, or loading finish)
  useEffect(() => {
    if (subscriptionState?.isPremium || userDetails?._user?.isPremium) {
      setUserSubscribed(true);
      setPurchasing(false);
    }

    // If loading stops or error occurs, stop the spinner
    if (!subscriptionState?.isLoading || subscriptionState?.error) {
      setPurchasing(false);
    }
  }, [subscriptionState?.isPremium, subscriptionState?.isLoading, subscriptionState?.error, userDetails?._user?.isPremium]);

  // Handle purchase button press
  const handlePurchase = async () => {
    setPurchasing(true);

    const sku = SUBSCRIPTION_SKUS[0]; // mortgage_monthly_sub_10

    // On Android, extract the offerToken from already-fetched products
    let offerToken: string | undefined;
    if (Platform.OS === 'android' && products.length > 0) {
      const product: any = products[0];
      offerToken = product?.subscriptionOfferDetails?.[0]?.offerToken;
    }

    try {
      await purchaseSubscription(sku, offerToken);
      // purchaseSubscription resolves when the Google Play dialog closes,
      // whether the user completed the purchase OR cancelled it.
      // If successful, the purchaseUpdatedListener in IapService will
      // update Redux (isPremium: true) and the useEffect above will
      // set userSubscribed = true.
    } catch (error) {
      console.error('--- SUBSCRIPTION SCREEN: Purchase error:', error);
    } finally {
      // ALWAYS stop the spinner when the Google Play dialog closes,
      // regardless of success or cancellation. This runs immediately.
      setPurchasing(false);
    }
  };

  // Handle restore purchases
  const handleRestore = async () => {
    if (!userDetails?._user?.uid) {
      return;
    }
    setPurchasing(true);
    try {
      const restored = await restorePurchases(userDetails._user.uid);
      if (restored) {
        setUserSubscribed(true);
      }
    } catch (error) {
      console.error('--- SUBSCRIPTION SCREEN: Restore error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  // Get display price from fetched products, or fallback
  const getDisplayPrice = (): string => {
    if (products.length > 0) {
      const product: any = products[0];
      // iOS has localizedPrice, Android uses subscriptionOfferDetails
      if (product.localizedPrice) {
        return product.localizedPrice;
      }
      if (product.subscriptionOfferDetails?.[0]?.pricingPhases?.pricingPhaseList?.[0]?.formattedPrice) {
        return product.subscriptionOfferDetails[0].pricingPhases.pricingPhaseList[0].formattedPrice;
      }
      if (product.price) {
        return product.price;
      }
    }
    return 'AED 10';
  };

  // Feature list item component
  const FeatureItem = ({ text }: { text: string }) => (
    <View style={styles.featureItem}>
      <View style={styles.checkIcon}>
        <SvgXml width="12" height="12" xml={`<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`} />
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );


  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform?.OS === 'android' ? { paddingTop: insets.top } : {},
      ]}>
      <Header
        mainHeadingText="Unlock Premium"
        onLeftBtnPress={() => navigation.goBack()}
        onRightBtnPress={() => { }}
        leftIcon={<SvgXml width="24" height="24" xml={backButton} />}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

        <View style={styles.contentContainer}>
          {isVerifyingStatus ? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#1d756d" />
              <Text style={{ marginTop: 16, color: '#1d756d', fontSize: 16, fontWeight: 'bold' }}>
                Verifying your status...
              </Text>
            </View>
          ) : userSubscribed ? (
            <View style={[styles.trialContainer, { justifyContent: 'center' }]}>
              <View style={styles.successIconContainer}>
                <Text style={{ fontSize: 40 }}>✅</Text>
              </View>
              <Text style={styles.trialTitle}>You're Premium!</Text>
              <Text style={styles.trialText}>
                Your subscription is active. Enjoy full access to all features.
              </Text>
              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => {
                  navigation.dispatch(
                    CommonActions.reset({
                      index: 0,
                      routes: [{ name: 'HomeDrawer' }],
                    })
                  );
                }}>
                <Text style={styles.buttonText}>Go to Calculator</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoContainer}>
              <View style={styles.headerSection}>
                <Image
                  source={require('../../src/assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
                <Text style={styles.mainHeading}>Mortgage Calculator Pro</Text>
                <Text style={styles.subHeading}>
                  Unlock the full potential of your mortgage planning.
                </Text>
              </View>

              <View style={styles.featuresContainer}>
                <FeatureItem text="Unlimited Mortgage Calculations" />
                <FeatureItem text="Detailed Amortization Schedules" />
                <FeatureItem text="PDF Export & Sharing" />
                <FeatureItem text="Ad-Free Experience" />
              </View>

              <View style={styles.pricingCard}>
                <View style={styles.pricingHeader}>
                  <Text style={styles.planName}>Monthly Plan</Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>BEST VALUE</Text>
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  {loadingProducts ? (
                    <ActivityIndicator size="small" color="#1d756d" />
                  ) : (
                    <Text style={styles.priceText}>{getDisplayPrice()}<Text style={styles.periodText}>/mo</Text></Text>
                  )}
                </View>

                <Text style={styles.trialNote}>Includes 1 Month Free Trial</Text>

                <TouchableOpacity
                  style={[styles.subscribeButton, (purchasing || loadingProducts) && styles.disabledButton]}
                  disabled={purchasing || loadingProducts}
                  onPress={handlePurchase}>
                  {purchasing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.subscribeButtonText}>Start Free Trial</Text>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.restoreButton}
                onPress={handleRestore}
                disabled={purchasing}>
                <Text style={styles.restoreText}>Restore Purchases</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA', // Light grey background
  },
  contentContainer: {
    flex: 1,
    padding: 24,
  },
  promoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    borderRadius: 16,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1d756d',
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  featuresContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1d756d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 20,
    shadowColor: '#1d756d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  pricingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: 'bold',
  },
  priceContainer: {
    marginBottom: 8,
  },
  priceText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1d756d',
  },
  periodText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'normal',
  },
  trialNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  subscribeButton: {
    backgroundColor: '#1d756d',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#1d756d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
    shadowOpacity: 0,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  restoreButton: {
    alignItems: 'center',
    padding: 12,
  },
  restoreText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  // Trial/Success Views
  trialContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  trialTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1d756d',
    marginBottom: 12,
    textAlign: 'center',
  },
  trialText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  continueButton: {
    backgroundColor: '#1d756d',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Subscription;
