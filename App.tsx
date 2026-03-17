/* eslint-disable react/react-in-jsx-scope */
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
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
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [requiresSubscription, setRequiresSubscription] = useState(false);

  useEffect(() => {
    // Reset states when user changes (login/logout)
    setSubscriptionChecked(false);
    setRequiresSubscription(false);

    const checkSubscription = async () => {
      store.dispatch(setCheckingSubscription(true));

      try {
        if (userToken && userDetails?._user?.uid) {
          // Initialize RevenueCat with the user's UID so it can look up their subscription
          await initializeRevenueCat(userDetails._user.uid);

          // checkPremiumAccess asks RevenueCat's backend (which validates against Apple/Google)
          // whether this user's subscription is currently active. This automatically handles
          // expiry, renewals, and cancellations — no manual Firestore flag needed.
          const timeoutPromise = new Promise<boolean>((resolve) =>
            setTimeout(() => resolve(false), 10000)
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
        // Default to requiring subscription on any unexpected error
        setRequiresSubscription(true);
      } finally {
        setSubscriptionChecked(true);
        store.dispatch(setCheckingSubscription(false));
      }
    };

    checkSubscription();
  }, [userToken, userDetails]);

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

  // Initialize RevenueCat ONCE on mount, and re-identify on user change
  useEffect(() => {
    initializeRevenueCat(userDetails?._user?.uid);
    // RevenueCat has no disconnect — no cleanup needed
  }, []); // ← empty deps: runs once

  // Check premium access via RevenueCat whenever the logged-in user changes
  useEffect(() => {
    if (userDetails?._user?.uid) {
      checkPremiumAccess(userDetails._user.uid);
    }
  }, [userDetails?._user?.uid]);

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
