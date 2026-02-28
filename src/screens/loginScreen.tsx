import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import auth, { getAuth, signInWithEmailAndPassword } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { SvgXml } from 'react-native-svg';
import { useDispatch } from 'react-redux';
import { login } from '../redux/slices/userSlice';
import { google } from '../svg';
import { GOOGLE_WEB_CLIENT_ID } from '../utils/constants';
import { UserModel } from '../models/UserModel';

interface SignInScreenProps {
  navigation: {
    navigate: (screen: string) => void;
    replace: (screen: string) => void;
  };
}

const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const dispatch = useDispatch();

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  const fetchUserData = async (userId: string, userEmail?: string) => {
    console.log('📦 [fetchUserData] START - userId:', userId, 'userEmail:', userEmail);
    try {
      console.log('📦 [fetchUserData] Querying Firestore for user doc...');
      const userDoc = await firestore().collection('users').doc(userId).get();
      console.log('📦 [fetchUserData] Firestore query complete. Doc exists?', userDoc.exists);

      if (!userDoc.exists) {
        console.log('📦 [fetchUserData] User doc NOT found. Creating new user...');
        const newUser: UserModel = {
          uid: userId,
          email: userEmail || email, // Use passed email (from Google) or text input
          signupDate: new Date().toISOString(),
          isPremium: false, // Must complete IAP to get access
          isSubscribed: false,
        };
        console.log('📦 [fetchUserData] New user object:', JSON.stringify(newUser));

        await firestore().collection('users').doc(userId).set(newUser);
        console.log('📦 [fetchUserData] ✅ New user doc created successfully!');

        return newUser;
      }

      const existingData = userDoc.data() as UserModel;
      console.log('📦 [fetchUserData] ✅ Existing user found:', JSON.stringify(existingData));
      return existingData;
    } catch (error) {
      console.error('📦 [fetchUserData] ❌ ERROR:', error);
      throw error;
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required.');
      return;
    }

    try {
      setLoading(true);
      const authInstance = getAuth();
      const response = await signInWithEmailAndPassword(authInstance, email, password);
      const userData = await fetchUserData(response.user.uid);
      dispatch(
        login({
          details: { _user: userData },
          token: response?.user?.uid,
        }),
      );
      // Navigation is handled automatically by App.tsx conditional rendering
    } catch (error: any) {
      handleFirebaseError(error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    if (loading) return; // Prevent double-click
    try {
      setLoading(true);
      console.log('🔵 [Google SignIn] Step 1: Checking Play Services...');
      await GoogleSignin.hasPlayServices();
      console.log('🔵 [Google SignIn] Step 2: Play Services OK. Opening Google Sign-In...');
      const response = await GoogleSignin.signIn();
      console.log('🔵 [Google SignIn] Step 3: Google Sign-In response received. Success?', isSuccessResponse(response));

      if (isSuccessResponse(response)) {
        const { idToken, user } = response.data;
        console.log('🔵 [Google SignIn] Step 4: idToken present?', !!idToken, '| User email:', user.email, '| User name:', user.name, '| Google User ID:', user.id);

        if (!idToken) {
          throw new Error('No ID token found from Google Sign-In');
        }

        console.log('🔵 [Google SignIn] Step 5: Creating Firebase credential from Google token...');
        const googleCredential = auth.GoogleAuthProvider.credential(idToken);
        console.log('🔵 [Google SignIn] Step 6: Signing into Firebase with credential...');
        const fbAuthResult = await auth().signInWithCredential(googleCredential);
        console.log('🔵 [Google SignIn] Step 7: ✅ Firebase auth success! Firebase UID:', fbAuthResult.user.uid, '| Firebase email:', fbAuthResult.user.email);

        // Fetch user data using the FIREBASE user ID
        console.log('🔵 [Google SignIn] Step 8: Fetching/creating user data in Firestore...');
        const userData = await fetchUserData(fbAuthResult.user.uid, user.email);
        console.log('🔵 [Google SignIn] Step 9: ✅ User data ready:', JSON.stringify(userData));

        dispatch(
          login({
            details: {
              _user: {
                ...userData,
                displayName: user.name,
                email: user.email,
              },
            },
            token: idToken || fbAuthResult.user.uid,
          }),
        );
        console.log('🔵 [Google SignIn] Step 10: ✅ Redux dispatch done. Navigation will happen automatically.');
        // Navigation is handled automatically by App.tsx conditional rendering
      } else {
        console.log('🔵 [Google SignIn] ⚠️ Response was NOT a success response:', JSON.stringify(response));
      }
    } catch (error: any) {
      console.error('🔵 [Google SignIn] ❌ ERROR at some step:', error);
      console.error('🔵 [Google SignIn] ❌ Error code:', error?.code, '| Error message:', error?.message);
      if (isErrorWithCode(error)) {
        handleGoogleSignInError(error);
      } else {
        // Show alert for ANY other error (Firestore, Firebase Auth, network, etc.)
        Alert.alert('Login Error', `${error?.message || 'Something went wrong during Google sign-in. Please try again.'}`);
      }
    } finally {
      setLoading(false);
      console.log('🔵 [Google SignIn] DONE - Loading set to false.');
    }
  };

  const handleFirebaseError = (error: any) => {
    switch (error.code) {
      case 'auth/invalid-email':
        Alert.alert('Error', 'The email address is badly formatted.');
        break;
      case 'auth/user-not-found':
        Alert.alert('Error', 'No user found with this email.');
        break;
      case 'auth/wrong-password':
        Alert.alert('Error', 'The password is incorrect.');
        break;
      default:
        Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const handleGoogleSignInError = (error: any) => {
    switch (error.code) {
      case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
        Alert.alert('Error', 'Play Services are not available.');
        break;
      default:
        Alert.alert('Error', `Google sign-in failed: ${error.message || 'Unknown error'} (${error.code || 'No code'})`);
    }
  };

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
        <Text style={styles.title}>Welcome</Text>
        <Text style={styles.subtitle}>Enter your email and password</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>LOGIN</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('SignUpScreen')}>
            <Text style={styles.signupLink}>Sign up</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.signInWithText}>Sign In with</Text>
        <View style={styles.socialIconsContainer}>
          <SvgXml
            onPress={signInWithGoogle}
            xml={google}
            width={40}
            height={40}
          />
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
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1d756d',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 30,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    fontSize: 16,
    color: '#000',
    paddingVertical: 12,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  forgotPassword: {
    fontSize: 14,
    color: '#ff9900',
    textAlign: 'right',
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: '#1d756d',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonDisabled: {
    backgroundColor: '#aaa',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  signupText: {
    fontSize: 14,
    color: '#888',
  },
  signupLink: {
    fontSize: 14,
    color: '#1d756d',
  },
  signInWithText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#888',
    marginBottom: 25,
  },
  socialIconsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  skipText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#f39c12',
  },
});

export default SignInScreen;
