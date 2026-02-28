import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg'; // For SVG icons
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { login } from '../redux/slices/userSlice';
import { useDispatch } from 'react-redux';
import { CommonActions, useNavigation } from '@react-navigation/native';
import { UserModel } from '../models/UserModel';

// Define types for formData and visibility
interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface Visibility {
  password: boolean;
  confirmPassword: boolean;
}

interface SignUpScreenProps {
  navigation: {
    navigate: (screen: string) => void;
  };
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ }) => {
  const navigation: any = useNavigation();
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const dispatch = useDispatch();
  const [visibility, setVisibility] = useState<Visibility>({
    password: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState<boolean>(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleVisibility = (field: keyof Visibility) => {
    setVisibility({ ...visibility, [field]: !visibility[field] });
  };

  const createUserDocument = async (userData: UserModel) => {
    try {
      await firestore().collection('users').doc(userData.uid).set(userData);
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  };

  const handleSignUp = async () => {
    const { fullName, email, password, confirmPassword } = formData;

    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );
      await userCredential.user.updateProfile({
        displayName: fullName,
      });

      const userData: UserModel = {
        uid: userCredential.user.uid,
        email: email,
        displayName: fullName,
        signupDate: new Date().toISOString(),
        isPremium: false, // Must complete IAP to get access
        isSubscribed: false,
      };

      await createUserDocument(userData);

      dispatch(
        login({
          details: {
            _user: userData,
          },
          token: userCredential?.user?.uid,
        }),
      );
      // New users must go through the IAP paywall — no free access
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Subscription' }],
        }),
      );
      // Alert.alert('Success', 'Account created successfully!');
      // navigation.navigate('LoginScreen');
    } catch (error: any) {
      handleFirebaseError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFirebaseError = (error: { code: string }) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        Alert.alert('Error', 'The email address is already in use.');
        break;
      case 'auth/invalid-email':
        Alert.alert('Error', 'The email address is badly formatted.');
        break;
      case 'auth/weak-password':
        Alert.alert('Error', 'The password is too weak.');
        break;
      default:
        Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  // Eye Icon component
  const EyeIcon: React.FC<{ isVisible: boolean }> = ({ isVisible }) => (
    <Svg width={24} height={20} viewBox="0 0 20 20">
      <Path
        d={
          isVisible
            ? 'M12 4.5C7.5 4.5 3.6 7.36 2 12c1.6 4.64 5.5 7.5 10 7.5s8.4-2.86 10-7.5c-1.6-4.64-5.5-7.5-10-7.5zm0 13.25c-2.87 0-5.5-2.07-6.78-5.25C6.5 8.82 9.13 6.75 12 6.75s5.5 2.07 6.78 5.25c-1.28 3.18-3.91 5.25-6.78 5.25zm0-9a3.75 3.75 0 0 0-3.75 3.75A3.75 3.75 0 0 0 12 15.5a3.75 3.75 0 0 0 3.75-3.75A3.75 3.75 0 0 0 12 8.75zm0 6a2.25 2.25 0 0 1-2.25-2.25A2.25 2.25 0 0 1 12 10.25a2.25 2.25 0 0 1 2.25 2.25A2.25 2.25 0 0 1 12 14.75z'
            : 'M12 4.5c4.5 0 8.4 2.86 10 7.5-1.6 4.64-5.5 7.5-10 7.5-4.5 0-8.4-2.86-10-7.5 1.6-4.64 5.5-7.5 10-7.5zM12 6.75c-2.87 0-5.5 2.07-6.78 5.25C6.5 15.18 9.13 17.25 12 17.25s5.5-2.07 6.78-5.25C17.5 8.82 14.87 6.75 12 6.75zM12 8.75a3.75 3.75 0 0 1 3.75 3.75A3.75 3.75 0 0 1 12 15.5a3.75 3.75 0 0 1-3.75-3.75A3.75 3.75 0 0 1 12 8.75zM2.5 4.5l19 15M3 19l18-15'
        }
        fill="none"
        stroke="#00000060"
        strokeWidth={1.5}
      />
    </Svg>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Sign Up</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor={'#00000050'}
            value={formData.fullName}
            onChangeText={text => handleInputChange('fullName', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={'#00000050'}
            keyboardType="email-address"
            value={formData.email}
            onChangeText={text => handleInputChange('email', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={'#00000050'}
              secureTextEntry={!visibility.password}
              value={formData.password}
              onChangeText={text => handleInputChange('password', text)}
            />
            <TouchableOpacity onPress={() => toggleVisibility('password')}>
              <EyeIcon isVisible={visibility.password} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor={'#00000050'}
              secureTextEntry={!visibility.confirmPassword}
              value={formData.confirmPassword}
              onChangeText={text => handleInputChange('confirmPassword', text)}
            />
            <TouchableOpacity onPress={() => toggleVisibility('confirmPassword')}>
              <EyeIcon isVisible={visibility.confirmPassword} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleSignUp}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>SIGN UP</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text
              style={styles.link}
              onPress={() => navigation.navigate('LoginScreen')}>
              Login
            </Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f9f9f9',
  },
  input: {
    width: '90%',
    fontSize: 16,
    color: '#000',
    paddingVertical: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  button: {
    backgroundColor: '#1d756d',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  link: {
    color: '#1d756d',
    fontWeight: 'bold',
  },
});

export default SignUpScreen;
