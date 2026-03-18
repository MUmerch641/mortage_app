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
  Platform,
  Image,
  BackHandler,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import Header from '../components/Header';
import { SvgXml } from 'react-native-svg';
import { backButton } from '../svg';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../../navigationTypes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  checkPremiumAccess,
  getSubscriptionPackages,
  purchasePackage,
  restorePurchases,
} from '../services/RevenueCatService';
import type { PurchasesPackage } from 'react-native-purchases';

type NavigationProps = NavigationProp<RootStackParamList, 'Subscription'>;

const Subscription: React.FC<any> = ({ route }) => {
  const navigation = useNavigation<NavigationProps>();
  const userDetails = useSelector((state: any) => state.user.details);
  const subscriptionState = useSelector((state: any) => state.subscription);
  const insets = useSafeAreaInsets();

  const [userSubscribed, setUserSubscribed] = useState(
    userDetails?._user?.isPremium === true || subscriptionState?.isPremium === true
  );
  const [products, setProducts] = useState<PurchasesPackage[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);   // ← separate state for restore
  const [isVerifyingStatus, setIsVerifyingStatus] = useState(true);

  const isFocused = useIsFocused();

  // Prevent going back when paywall is blocking access
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (!userSubscribed) return true;
        return false;
      },
    );
    return () => backHandler.remove();
  }, [userSubscribed]);

  // Live status check via RevenueCat on screen focus
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      setIsVerifyingStatus(true);
      try {
        const isActive = await checkPremiumAccess(userDetails?._user?.uid);
        if (isMounted) setUserSubscribed(isActive);
      } catch (error) {
        console.error('[Subscription] Status verify error:', error);
      } finally {
        if (isMounted) setIsVerifyingStatus(false);
      }
    };
    if (isFocused) checkStatus();
    return () => { isMounted = false; };
  }, [isFocused, userDetails]);

  // Auto-navigate if premium (and not opened from drawer settings)
  useEffect(() => {
    const navState = navigation.getState();
    const isMainStack = navState?.routes?.[0]?.name === 'SegmentScreen';
    if (userSubscribed && !isVerifyingStatus && !isMainStack) {
      navigation.dispatch(
        CommonActions.reset({ index: 0, routes: [{ name: 'HomeDrawer' }] })
      );
    }
  }, [userSubscribed, isVerifyingStatus, navigation]);


  // Fetch packages on focus
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const packages = await getSubscriptionPackages();
        setProducts(packages);
      } catch (error) {
        console.error('[Subscription] Error fetching packages:', error);
      } finally {
        setLoadingProducts(false);
      }
    };
    if (isFocused) fetchProducts();
  }, [isFocused]);

  // Watch Redux state for purchase results
  useEffect(() => {
    if (subscriptionState?.isPremium || userDetails?._user?.isPremium) {
      setUserSubscribed(true);
      setPurchasing(false);
    }
    if (!subscriptionState?.isLoading || subscriptionState?.error) {
      setPurchasing(false);
    }
  }, [subscriptionState?.isPremium, subscriptionState?.isLoading, subscriptionState?.error, userDetails?._user?.isPremium]);

  // ── Purchase ────────────────────────────────────────────────────────────
  const handlePurchase = async () => {
    if (products.length === 0) {
      Alert.alert(
        'Not Available',
        'Subscription packages could not be loaded. Please try on the release version from the Play Store.',
      );
      return;
    }
    setPurchasing(true);
    try {
      const success = await purchasePackage(products[0], userDetails?._user?.uid);
      if (success) setUserSubscribed(true);
      // If success === false and no error thrown, it means user cancelled — do nothing
    } catch (error) {
      console.error('[Subscription] Purchase error:', error);
    } finally {
      setPurchasing(false);
    }
  };

  // ── Restore ─────────────────────────────────────────────────────────────
  const handleRestore = async () => {
    setRestoring(true);
    try {
      const restored = await restorePurchases(userDetails?._user?.uid);
      if (restored) {
        setUserSubscribed(true);
      }
      // restorePurchases() internally shows an Alert if nothing found
    } catch (error) {
      console.error('[Subscription] Restore error:', error);
      Alert.alert('Restore Failed', 'Could not restore purchases. Please try again.');
    } finally {
      setRestoring(false);
    }
  };

  // Get display price from RevenueCat package, or fallback
  const getDisplayPrice = (): string => {
    if (products.length > 0) {
      const pkg = products[0];
      // RevenueCat provides a clean localizedPriceString on the product
      return pkg.product?.priceString ?? pkg.product?.price?.toString() ?? 'AED 10';
    }
    return 'AED 10';
  };

  // Feature list item component
  const FeatureItem = ({ icon, text }: { icon: string; text: string }) => (
    <View style={styles.featureItem}>
      <View style={styles.checkIcon}>
        <SvgXml
          width="12"
          height="12"
          xml={`<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`}
        />
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

      {isVerifyingStatus ? (
        <View style={styles.verifyingContainer}>
          <ActivityIndicator size="large" color="#1d756d" />
          <Text style={styles.verifyingText}>Verifying your status...</Text>
        </View>
      ) : userSubscribed ? (
        /* ── Premium Confirmed View ─────────────────────────────────── */
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <SvgXml
              width="44"
              height="44"
              xml={`<svg viewBox="0 0 24 24" fill="none" stroke="#1d756d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`}
            />
          </View>
          <Text style={styles.successTitle}>You're Premium!</Text>
          <Text style={styles.successText}>
            Your subscription is active. Enjoy full access to all features.
          </Text>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() =>
              navigation.dispatch(
                CommonActions.reset({ index: 0, routes: [{ name: 'HomeDrawer' }] })
              )
            }>
            <Text style={styles.buttonText}>Go to Calculator</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Paywall View ───────────────────────────────────────────── */
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          {/* Logo + Heading */}
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

          {/* Features */}
          <View style={styles.featuresContainer}>
            <FeatureItem icon="📊" text="Unlimited Mortgage Calculations" />
            <FeatureItem icon="📄" text="Detailed Amortization Schedules" />
            <FeatureItem icon="📤" text="PDF Export & Sharing" />
            <FeatureItem icon="🚫" text="Ad-Free Experience" />
          </View>

          {/* Pricing Card */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <Text style={styles.planName}>Monthly Plan</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>MOST POPULAR</Text>
              </View>
            </View>

            <View style={styles.priceRow}>
              {loadingProducts ? (
                <ActivityIndicator size="small" color="#1d756d" />
              ) : (
                <Text style={styles.priceText}>
                  {getDisplayPrice()}
                  <Text style={styles.periodText}>/month</Text>
                </Text>
              )}
            </View>

            <View style={styles.trialNoteRow}>
              <SvgXml
                width="14"
                height="14"
                xml={`<svg viewBox="0 0 24 24" fill="none" stroke="#1d756d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`}
              />
              <Text style={styles.trialNote}>  1 Month Free Trial • Cancel anytime</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.subscribeButton,
                (purchasing || loadingProducts) && styles.disabledButton,
              ]}
              disabled={purchasing || loadingProducts || restoring}
              onPress={handlePurchase}>
              {purchasing ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.subscribeButtonText}>🔓  Start Free Trial</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Restore Button */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={purchasing || restoring}>
            {restoring ? (
              <View style={styles.restoreLoadingRow}>
                <ActivityIndicator size="small" color="#1d756d" />
                <Text style={[styles.restoreText, { marginLeft: 8 }]}>Restoring...</Text>
              </View>
            ) : (
              <Text style={styles.restoreText}>Restore Purchases</Text>
            )}
          </TouchableOpacity>

          {/* Platform-aware legal disclaimer */}
          <Text style={styles.legalText}>
            Payment will be charged to your{' '}
            {Platform.select({
              ios: 'App Store account',
              android: 'Google Play account',
              default: 'account',
            })}{' '}
            at confirmation of purchase. Subscription automatically renews
            unless cancelled at least 24 hours before the end of the current
            period.{'\n'}
            <Text
              style={styles.legalLink}
              onPress={() => {}}>
              Privacy Policy
            </Text>
            {'  ·  '}
            <Text
              style={styles.legalLink}
              onPress={() => {}}>
              Terms of Use
            </Text>
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  // ── Verifying ──────────────────────────────────────────────────────────────
  verifyingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingText: {
    marginTop: 16,
    color: '#1d756d',
    fontSize: 16,
    fontWeight: '600',
  },
  // ── Premium Confirmed ───────────────────────────────────────────────────────
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  successIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1d756d',
    marginBottom: 12,
    textAlign: 'center',
  },
  successText: {
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
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#1d756d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // ── Paywall Scroll ──────────────────────────────────────────────────────────
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 14,
    borderRadius: 18,
  },
  mainHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1d756d',
    marginBottom: 8,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  // ── Features ──────────────────────────────────────────────────────────────
  featuresContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1d756d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  // ── Pricing Card ──────────────────────────────────────────────────────────
  pricingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#1d756d30',
    marginBottom: 16,
    shadowColor: '#1d756d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
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
    color: '#222',
  },
  badge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  badgeText: {
    color: '#2E7D32',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  priceRow: {
    marginBottom: 8,
  },
  priceText: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#1d756d',
  },
  periodText: {
    fontSize: 15,
    color: '#888',
    fontWeight: 'normal',
  },
  trialNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  trialNote: {
    fontSize: 13,
    color: '#555',
  },
  subscribeButton: {
    backgroundColor: '#1d756d',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#1d756d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  disabledButton: {
    backgroundColor: '#B0BEC5',
    shadowOpacity: 0,
    elevation: 0,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  // ── Restore ────────────────────────────────────────────────────────────────
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 8,
  },
  restoreLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  restoreText: {
    color: '#1d756d',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // ── Legal disclaimer ───────────────────────────────────────────────────────
  legalText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  legalLink: {
    color: '#1d756d',
    textDecorationLine: 'underline',
  },
});

export default Subscription;

