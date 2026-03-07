import React, { useState, useRef, useEffect, ComponentType } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Platform,
  ImageBackground,
  ActivityIndicator,
  Animated,
} from 'react-native';
import MainScreen from './mainScreen';
import layoutScreen2 from './layoutScreen2';
import layoutScreen3 from './layoutScreen3';
import layoutScreen4 from './layoutScreen4';
import layoutScreen5 from './layoutSCreen5';
import {
  RouteProp,
  useNavigation,
  useRoute,
  StackActions,
} from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { hamburgerColor, reset } from '../svg';
import Header from '../components/Header';
import Box from '../components/Box';
import { useDispatch, useSelector } from 'react-redux';
import {
  doc,
  getDoc,
  setDoc,
  getFirestore,
} from '@react-native-firebase/firestore';
import { DrawerNavigation, RootStackParamList } from '../../navigationTypes';
import { resetState } from '../redux/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseIcon from '../assets/closeIcon';

type SegmentScreenRouteProp = RouteProp<RootStackParamList, 'SegmentScreen'>;

type Segment = {
  id: number;
  title: string;
  component: ComponentType<any>; // Allows any React component
};

const segments: Segment[] = [
  { id: 1, title: 'Income', component: MainScreen },
  { id: 2, title: 'Liabilities', component: layoutScreen2 },
  { id: 3, title: 'Rates', component: layoutScreen3 },
  { id: 4, title: 'Eligibility', component: layoutScreen4 },
  { id: 5, title: 'Summary', component: layoutScreen5 },
];

const SegmentScreen = () => {
  const flatListRef = useRef<FlatList>(null);

  const route = useRoute<SegmentScreenRouteProp>();
  const additionalIncome = route?.params?.additionalIncome;
  const propertyValue = route?.params?.propertyValue;

  const navigation = useNavigation<DrawerNavigation>();
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = useState(true); // Loading state
  const slideAnim = useState(new Animated.Value(-50))[0]; // Animation for sliding
  const [isModalVisible2, setModalVisible2] = useState(false);
  const [isResetModalVisible, setResetModalVisible] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [selectedSegmentId, setSelectedSegmentId] = useState<number>(
    route.params?.initialTab ||
    (propertyValue !== undefined ? segments[3].id : segments[0].id),
  );

  const userDetails = useSelector((state: any) => state.user.details);
  const userToken = useSelector((state: any) => state.user.token);
  const subscriptionState = useSelector((state: any) => state.subscription);

  // A user is premium if EITHER their core user object says so, or the dedicated subscription state says so.
  const isPremiumUser = userDetails?._user?.isPremium === true || subscriptionState?.isPremium === true;
  // isCheckingSubscription is set by App.tsx while it does the post-login Firestore/Google Play check.
  // We MUST NOT show the paywall while this check is still running.
  const isCheckingSubscription = subscriptionState?.isCheckingSubscription === true;
  // CRITICAL: Never show the modal when logged out — StackNavigation handles routing to login.
  // Without this guard the modal appears over the login screen after logout.
  const isModalVisible = !!userToken && !isPremiumUser && !isCheckingSubscription;

  const userId = userDetails?._user?.id || userDetails?._user?.uid;

  useEffect(() => {
    if (route.params?.initialTab) {
      const index = segments.findIndex(s => s.id === route.params.initialTab);
      if (index >= 0) {
        setSelectedSegmentId(route.params.initialTab);
        flatListRef.current?.scrollToIndex({ animated: true, index });
      }
    }
  }, [route.params?.initialTab]);

  useEffect(() => {
    return () => {
      // Clean up animations when component unmounts
      slideAnim.stopAnimation();
    };
  }, []);

  const navigateToTab = (tabId: number) => {
    if (selectedSegmentId !== tabId) {
      // Clear any existing animations first
      slideAnim.stopAnimation();
      // Reset animation value
      slideAnim.setValue(-50);
      // Show "Saved" message
      setSavedMessage('Saved!');

      // Slide In Animation
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 400,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 400,
            useNativeDriver: true,
          }).start(() => setSavedMessage(null));
        }
      });

      // Find the index and navigate after delay
      const index = segments.findIndex(s => s.id === tabId);
      if (index >= 0) {
        setTimeout(() => {
          setSelectedSegmentId(tabId);
          flatListRef.current?.scrollToIndex({ animated: true, index });
        }, 800); // Same 0.8s delay as tab switching
      }
    }
  };

  const screenProps = {
    navigateToTab,
    currentTab: selectedSegmentId,
    totalTabs: segments.length,
    additionalIncome: additionalIncome,
    propertyValue: propertyValue,
    // ... other existing props ...
  };

  // Removed redundant checkIfUserIsSubscribed. 
  // We now rely entirely on the Redux subscriptionState updated by App.tsx and IapService.

  const createUserDocument = async (uid: string, userData: any) => {
    try {
      const db = getFirestore();
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, userData);
    } catch (error: any) {
    }
  };

  const addUser = async (response: any) => {
    const user = response.user;
    const uid = user.id; // Google user ID as the document ID

    if (!uid) {
      return;
    }

    const userData = {
      email: user.email || '',
      name: user?.name || '',
      isSubscribed: false,
    };

    const userExists = await checkIfUserExists(uid);

    if (!userExists) {
      await createUserDocument(uid, userData);
    }
  };

  const checkIfUserExists = async (uid: string) => {
    try {
      if (!uid) {
        return false;
      }
      const db = getFirestore();
      const userRef = doc(db, 'users', uid);
      const userSnap = await getDoc(userRef);
      return userSnap.exists;
    } catch (error: any) {
      return false;
    }
  };

  useEffect(() => {
    // Only initialize user if we have valid user details
    if (!userDetails?._user?.uid) {
      return;
    }

    const signInResponse = {
      user: {
        email: userDetails._user.email || '',
        id: userDetails._user.uid,
        name: userDetails._user.displayName || userDetails._user.name || '',
      },
    };

    const initializeUser = async () => {
      await addUser(signInResponse);
    };

    initializeUser();
  }, [userDetails]);

  const dispatch = useDispatch();

  const handleResetPress = () => {
    setResetModalVisible(true); // Show confirmation modal
  };

  const resetAll = () => {
    setResetModalVisible(false);
    dispatch(resetState());

    navigation.dispatch(StackActions.replace('SegmentScreen'));

    setModalVisible2(true);
    setTimeout(() => setModalVisible2(false), 3000);
  };

  const handleSegmentPress = (itemId: number, index: number) => {
    if (selectedSegmentId !== itemId) {
      // Clear any existing animations first
      slideAnim.stopAnimation();
      // Reset animation value
      slideAnim.setValue(-50);
      // Show "Saved" message
      setSavedMessage('Saved!');
      // Slide In Animation
      Animated.timing(slideAnim, {
        toValue: 10,
        duration: 400,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          Animated.timing(slideAnim, {
            toValue: -50,
            duration: 400,
            useNativeDriver: true,
          }).start(() => setSavedMessage(null));
        }
      });

      setTimeout(() => {
        setSelectedSegmentId(itemId);
        flatListRef.current?.scrollToIndex({ animated: true, index });
      }, 800); // 0.8 seconds delay
    }
  };

  const renderSegmentItem = ({ item, index }: { item: Segment; index: number }) => (
    <TouchableOpacity
      style={[
        styles.segmentButton,
        selectedSegmentId === item.id && styles.segmentButtonActive,
      ]}
      onPress={() => handleSegmentPress(item.id, index)}>
      <Text
        style={[
          styles.segmentButtonText,
          selectedSegmentId === item.id && styles.segmentButtonTextActive,
        ]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );

  const SelectedContentComponent =
    segments.find(seg => seg.id === selectedSegmentId)?.component || null;


  return (
    <SafeAreaView
      style={[
        { flex: 1 },
        Platform?.OS === 'android' ? { paddingTop: insets.top, paddingBottom: insets.bottom } : {},
      ]}>
      <Header
        mainHeadingText={'Mortgage Eligibility'}
        onLeftBtnPress={() => navigation.openDrawer()}
        onRightBtnPress={handleResetPress}
        leftIcon={<SvgXml width="48" height="48" xml={hamburgerColor} />}
        rightIcon={<SvgXml width="48" height="48" xml={reset} />}
      />
      <View
        style={{ flex: 1 }}>
        {/*  Notification Banner */}
        {savedMessage && (
          <Animated.View
            style={[
              styles.notification,
              { transform: [{ translateY: slideAnim }] },
            ]}>
            <Text style={styles.notificationText}>{savedMessage}</Text>
          </Animated.View>
        )}
        <Box style={styles.container}>
          {/* FlatList for Segments */}
          <FlatList<Segment>
            ref={flatListRef}
            data={segments}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={renderSegmentItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.segmentContainer}
            style={{ maxHeight: 50 }}
          />

          {/* Content Container */}
          <View style={styles.contentContainer}>
            {SelectedContentComponent &&
              (SelectedContentComponent === MainScreen ? (
                <SelectedContentComponent {...screenProps} />
              ) : (
                <SelectedContentComponent {...screenProps} />
              ))}
          </View>
        </Box>

        {/* Hard Paywall Blocking Modal */}
        <Modal
          visible={isModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => {
            navigation.navigate('Subscription');
          }}>
          <View style={styles.modalOverlay}>
            <View style={styles.paywallModalContainer}>
              <View style={styles.paywallIconContainer}>
                <SvgXml
                  width="40"
                  height="40"
                  xml={`<svg viewBox="0 0 24 24" fill="none" stroke="#1d756d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`}
                />
              </View>
              <Text style={styles.paywallTitle}>Subscription Required</Text>
              <Text style={styles.paywallText}>
                Unlock full access to all mortgage calculation tools and premium features.
              </Text>

              <TouchableOpacity
                style={styles.paywallButton}
                onPress={() => navigation.navigate('Subscription')}>
                <Text style={styles.paywallButtonText}>Subscribe Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          visible={isModalVisible2}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible2(false)}>
          <View style={styles.modalOverlay2}>
            <View style={styles.modalContent}>
              <Text style={{ color: 'black', fontSize: 20, fontWeight: '500' }}>
                Refreshed
              </Text>
              {/* <Button title="close" onPress={() => setModalVisible(false)} /> */}
            </View>
          </View>
        </Modal>

        {/* Add the new Reset Confirmation Modal */}
        <Modal
          visible={isResetModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setResetModalVisible(false)}>
          <View style={styles.resetModalOverlay}>
            <View style={styles.resetModalContainer}>
              <Text style={styles.resetModalTitle}>Confirm Reset</Text>
              <Text style={styles.resetModalText}>
                Are you sure you want to reset all data? This action cannot be
                undone.
              </Text>
              <View style={styles.resetModalButtons}>
                <TouchableOpacity
                  style={[styles.resetModalButton, styles.cancelButton]}
                  onPress={() => setResetModalVisible(false)}>
                  <Text style={styles.resetModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.resetModalButton, styles.confirmButton]}
                  onPress={resetAll}>
                  <Text style={styles.resetModalButtonText}>Reset</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  segmentContainer: {
    paddingHorizontal: 10,
    height: 50,
  },
  segmentButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginHorizontal: 3,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d756d',
    height: 40,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  segmentButtonActive: { backgroundColor: '#1d756d' },
  segmentButtonText: { color: '#1d756d', fontWeight: 'bold' },
  segmentButtonTextActive: { color: '#fff', fontWeight: 'bold' },
  notification: {
    position: 'absolute',
    alignSelf: 'center',
    top: 10,
    backgroundColor: '#1d756d',
    padding: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  notificationText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contentContainer: {
    paddingHorizontal: 10,
    backgroundColor: 'transparent',
    borderRadius: 10,
    height: '88%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 1,
  },
  modalOverlay2: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    // borderWidth: 1,
  },
  modalContent: {
    width: '50%',
    padding: 20,
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paywallModalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  paywallIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e6f2f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  paywallTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1d756d',
    marginBottom: 10,
    textAlign: 'center',
  },
  paywallText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  paywallButton: {
    backgroundColor: '#1d756d',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  paywallButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Add new styles for reset confirmation modal
  resetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetModalContainer: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  resetModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d756d',
    marginBottom: 10,
    textAlign: 'center',
  },
  resetModalText: {
    fontSize: 16,
    color: 'black',
    marginBottom: 20,
    textAlign: 'center',
  },
  resetModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resetModalButton: {
    padding: 10,
    borderRadius: 5,
    width: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#1d756d',
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#1d756d',
  },
  resetModalButtonText: {
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#1d756d',
  },
  confirmButtonText: {
    color: 'white',
  },
});

export default SegmentScreen;
