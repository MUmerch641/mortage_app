/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/self-closing-comp */
/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux'; import { RootStackParamList } from '../../navigationTypes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SplashScreen'>;

const SplashScreen: React.FC = () => {

  const navigation = useNavigation<SplashScreenNavigationProp>();
  const userToken = useSelector((state: any) => state.user.token);

  const userTokenRef = React.useRef(userToken);
  userTokenRef.current = userToken; // always keep ref up to date

  useEffect(() => {
    const timer = setTimeout(() => {
      // Read from ref to get the token at the time the redirect happens,
      // not the (potentially stale) token captured when this effect ran.
      console.log('🚀 [SplashScreen] Redirecting... token:', !!userTokenRef.current);
      navigation.replace(userTokenRef.current ? 'SegmentScreen' : 'LoginScreen', {});
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <View style={styles.scrollContainer}>
          <Image
            source={require('../../src/assets/logo.png')}
            style={styles.imageBackground}
            resizeMode="cover"
          />
          <Text style={{ fontSize: 15, fontWeight: '700' }}>
            Your handy mortgage eligibility calculator
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    padding: 16,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 10,
    height: 10,
  },
  imageBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 300, // Adjust this value
    width: 300,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
  },
  picker: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    marginTop: 8,
    borderRadius: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    // alignItems: 'center',
  },
  modalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    width: '100%',
    marginBottom: 16,
  },
  modalOption: {
    padding: 10,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
});

export default SplashScreen;
