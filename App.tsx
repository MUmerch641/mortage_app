/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, AppStateStatus, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider, useSelector } from 'react-redux';
import { persistor, store } from './src/redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import MainScreen from './src/screens/mainScreen';
import IncomeDetailsScreen from './src/screens/incomeDetailScreen';
import LayoutScreen from './src/screens/layoutScreens';
import LayoutScreen2 from './src/screens/layoutScreen2';
import LayoutScreen3 from './src/screens/layoutScreen3';
import LayoutScreen4 from './src/screens/layoutScreen4';
import LayoutScreen5 from './src/screens/layoutSCreen5';
import Subscription from './src/screens/subscription';
import SegmentScreen from './src/screens/segmentScreen';
import DrawerContent from './src/components/DrawerContent';
import loginScreen from './src/screens/loginScreen';
import PropertyValue from './src/screens/propertyValue';
import ContactUs from './src/screens/contactUs';
import Instructions from './src/screens/instructions';
import SplashScreen from './src/screens/splashScreen';
import SignUpScreen from './src/screens/signUpScreen';
import { RootStackParamList } from './navigationTypes';
import { useSubscriptionCheck } from './src/hooks/useSubscriptionCheck';
import {
  initializeRevenueCat,
  checkPremiumAccess,
} from './src/services/RevenueCatService';
import { setCheckingSubscription } from './src/redux/slices/subscriptionSlice';


// Create Stack Navigator for the main screens
const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();



// Stack Navigator Component
function StackNavigation() {
  const userToken = useSelector((state: any) => state.user.token);
  const userDetails = useSelector((state: any) => state.user.details);
  // Last known premium state from persisted Redux — used as offline/timeout fallback
  // so we NEVER lock out a premium user just because the network is slow or unavailable.
  const cachedIsPremium = useSelector((state: any) => state.subscription?.isPremium === true);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [requiresSubscription, setRequiresSubscription] = useState(false);

  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Always reset stuck isCheckingSubscription from a previous crash/hard-kill.
    // Without this, a crash mid-check leaves isCheckingSubscription=true in
    // redux-persist forever, which hides the paywall indefinitely.
    store.dispatch(setCheckingSubscription(false));

    // Reset local gate states when the user account changes (login/logout)
    setSubscriptionChecked(false);
    setRequiresSubscription(false);

    const checkSubscription = async () => {
      store.dispatch(setCheckingSubscription(true));

      try {
        if (userToken && userDetails?._user?.uid) {
          await initializeRevenueCat(userDetails._user.uid);

          // Timeout fallback: if RevenueCat is slow (e.g., offline), use the
          // persisted Redux state so premium users are never locked out.
          const timeoutPromise = new Promise<boolean>((resolve) =>
            setTimeout(() => resolve(cachedIsPremium), 10000)
          );

          const isActive = await Promise.race([
            checkPremiumAccess(userDetails._user.uid),
            timeoutPromise,
          ]);

          setRequiresSubscription(!isActive);
        } else {
          setSubscriptionChecked(true);
          store.dispatch(setCheckingSubscription(false));
          return;
        }
      } catch (error) {
        // On unexpected error fall back to cached state — never lock out a paying user
        setRequiresSubscription(!cachedIsPremium);
      } finally {
        setSubscriptionChecked(true);
        store.dispatch(setCheckingSubscription(false));
      }
    };

    checkSubscription();

    // Re-validate the moment the user returns from Google Play / App Store settings.
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkSubscription();
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      appStateSubscription.remove();
    };
  // Only re-run when the actual user account changes (uid or token), NOT on every
  // userDetails object update (e.g. displayName, Firestore writes) which would
  // cause unnecessary re-checks and trigger the loading spinner repeatedly.
  }, [userToken, userDetails?._user?.uid]);

  if (!subscriptionChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1d756d" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userToken ? (
        <>
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
          <Stack.Screen name="LoginScreen" component={loginScreen} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        </>
      ) : requiresSubscription ? (
        <>
          <Stack.Screen name="Subscription" component={Subscription} />
          <Stack.Screen name="SegmentScreen" component={SegmentScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="SegmentScreen" component={SegmentScreen} />
          <Stack.Screen name="LayoutScreen" component={LayoutScreen} />
          <Stack.Screen name="LayoutScreen2" component={LayoutScreen2 as React.ComponentType<any>} />
          <Stack.Screen name="LayoutScreen3" component={LayoutScreen3 as React.ComponentType<any>} />
          <Stack.Screen name="LayoutScreen4" component={LayoutScreen4 as React.ComponentType<any>} />
          <Stack.Screen name="LayoutScreen5" component={LayoutScreen5 as React.ComponentType<any>} />
          <Stack.Screen name="PropertyValue" component={PropertyValue} />
          <Stack.Screen name="Subscription" component={Subscription} />
          <Stack.Screen name="MainScreen" component={MainScreen as React.ComponentType<any>} />
          <Stack.Screen
            name="IncomeDetailsScreen"
            component={IncomeDetailsScreen}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

// Create a new component that wraps the Drawer.Navigator
function MainDrawerNavigator() {
  const userDetails = useSelector((state: any) => state.user.details);

  useSubscriptionCheck(); // Now this is safely inside NavigationContainer

  // Initialize RevenueCat ONCE on mount with the current user ID
  useEffect(() => {
    initializeRevenueCat(userDetails?._user?.uid);
  }, []); // ← empty deps: runs once on mount

  // NOTE: checkPremiumAccess on user change is handled by StackNavigation's
  // useEffect — removing the duplicate call here prevents 3-4 concurrent
  // RevenueCat requests firing simultaneously on every login.

  return (
    <Drawer.Navigator
      initialRouteName="HomeDrawer"
      screenOptions={{ headerShown: false }}
      drawerContent={props => <DrawerContent {...props} />}>
      <Drawer.Screen name="HomeDrawer" component={StackNavigation} />
      <Drawer.Screen name="Subscription" component={Subscription} />
      <Drawer.Screen name="contactUs" component={ContactUs} />
      <Drawer.Screen name="instructions" component={Instructions} />
    </Drawer.Navigator>
  );
}

// Main App Navigation with Drawer
function AppNavigation() {
  return (
    <NavigationContainer>
      <MainDrawerNavigator />
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  return (
    // <I18nextProvider i18n={i18n}>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AppNavigation />
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
    // </I18nextProvider>
  );
}

export default App;
