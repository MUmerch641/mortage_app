/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
  Keyboard,
} from 'react-native';
import Header from '../components/Header';
import { SvgXml } from 'react-native-svg';
import { backButton } from '../svg';
import TextFieldInput from '../components/TextInpurField';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import {
  collection,
  addDoc,
  getFirestore,
} from '@react-native-firebase/firestore';

const SUPPORT_EMAIL = 'support@mortgagecalculator.app';

const ContactUs: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const userDetails = useSelector((state: any) => state.user.details);

  const [name, setName] = useState(
    '',
  );
  const [email, setEmail] = useState(
    '',
  );
  const [message, setMessage] = useState('');
  const [mobile, setMobile] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (emailValue: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailValue);
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return false;
    }
    if (!email.trim()) {
      Alert.alert('Required', 'Please enter your email address.');
      return false;
    }
    if (!validateEmail(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    if (!message.trim()) {
      Alert.alert('Required', 'Please enter your question or message.');
      return false;
    }
    return true;
  };

  const handleSend = async () => {
    if (!validateForm()) return;

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      // Save a copy to Firestore as backup record
      const db = getFirestore();
      await addDoc(collection(db, 'contactMessages'), {
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        mobile: mobile.trim(),
        userId: userDetails?._user?.uid || null,
        platform: Platform.OS,
        createdAt: new Date().toISOString(),
        status: 'new',
      }).catch(() => { }); // Don't block if Firestore fails

      // Open email client to send actual email to client
      const subject = encodeURIComponent('Mortgage Calculator - Contact Us');
      // Format the body so it looks clean in the email client
      const body = encodeURIComponent(
        `Name: ${name.trim()}\nEmail: ${email.trim()}\nMobile: ${mobile.trim() || 'N/A'}\n\nMessage:\n${message.trim()}`
      );

      const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;

      try {
        // Note: On Android 11+, canOpenURL('mailto:...') returns false unless
        // the mailto scheme is declared in AndroidManifest <queries>. Instead,
        // we just call openURL directly — it will throw if no email app exists.
        await Linking.openURL(mailto);
        // Clear form after opening email successfully
        setMessage('');
        setMobile('');
      } catch (err) {
        console.error('Error opening email client:', err);
        Alert.alert(
          'No Email App Found',
          `We couldn't open an email app. Please send your message directly to:\n\n${SUPPORT_EMAIL}`,
          [{ text: 'OK' }]
        );
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Contact form error (outer):', error);
      setIsLoading(false);
      Alert.alert(
        'Error',
        `A system error occurred. Please send your message directly to:\n\n${SUPPORT_EMAIL}`,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform?.OS === 'android'
          ? { paddingTop: insets.top, paddingBottom: insets.bottom }
          : {},
      ]}>
      <Header
        mainHeadingText={'Contact Us'}
        onLeftBtnPress={() => navigation.goBack()}
        onRightBtnPress={() => { }}
        leftIcon={<SvgXml width="16" height="16" xml={backButton} />}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled">
          <Text style={styles.subtitle}>
            Have a question or feedback? We'd love to hear from you.
          </Text>

          <View style={{ borderWidth: 0 }}>
            <TextFieldInput
              placeHolder="Name"
              simpleInput={true}
              fullWidth={true}
              value={name}
              onChangeText={setName}
              labelColor="black"
              placeholderColor="#666"
            />
            <TextFieldInput
              placeHolder="Email"
              simpleInput={true}
              fullWidth={true}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              labelColor="black"
              placeholderColor="#666"
            />
            <TextFieldInput
              placeHolder="Mobile No (optional)"
              simpleInput={true}
              fullWidth={true}
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              labelColor="black"
              placeholderColor="#666"
            />
            <TextFieldInput
              placeHolder="Your Message"
              simpleInput={true}
              fullWidth={true}
              value={message}
              onChangeText={setMessage}
              multiline={true}
              labelColor="black"
              placeholderColor="#666"
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={handleSend}
              disabled={isLoading}
              style={[
                styles.sendButton,
                isLoading && { opacity: 0.7 },
              ]}>
              {isLoading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendButtonText}>Send</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.emailNote}>
            Or email us directly at{' '}
            <Text
              style={styles.emailLink}
              onPress={() =>
                Linking.openURL(`mailto:${SUPPORT_EMAIL}`).catch(() => { })
              }>
              {SUPPORT_EMAIL}
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
    width: '100%',
    backgroundColor: '#1d756d',
    borderRadius: 15,
    minHeight: 50,
  },
  sendButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  emailNote: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  emailLink: {
    color: '#1d756d',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default ContactUs;
