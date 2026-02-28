/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Header from '../components/Header';
import { SvgXml } from 'react-native-svg';
import { backButton, arrowDown, arrowUp } from '../svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqs = [
  {
    question: 'What is the Monthly Fixed Income (MFI)?',
    answer:
      'MFI is your regular, guaranteed monthly salary. You can also add variable "Additional Income" like bonuses or incentives which the app will average out for you.',
  },
  {
    question: 'How does the app calculate rental income?',
    answer:
      'The app takes your total yearly rental income, applies your expected return on investment percentage, and caps it based on a percentage of your Monthly Fixed Income (MFI).',
  },
  {
    question: 'What is the Debt-Burden Ratio (DBR)?',
    answer:
      'The DBR represents the percentage of your monthly income that goes toward paying debts. The calculator uses this to ensure your proposed mortgage payments are affordable.',
  },
  {
    question: 'What is the "Buffer Period"?',
    answer:
      'The buffer period is an extra safety margin (in months) added to your calculations to account for unexpected delays or changes in your financial situation before or during the mortgage.',
  },
  {
    question: 'How is the New Finance Amount calculated?',
    answer:
      'It is calculated by taking your base property value, adding any extra percentage for registration/brokerage fees, and then applying the Loan-to-Value (LTV) ratio you qualify for.',
  },
  {
    question: 'What is Percentage of CC limit as liability?',
    answer:
      "It's a percentage of credit card limit that the bank consider it as a monthly liability (example: if credit card limit is AED 100,000 and the percentage is 5% then AED 5,000 will be considered as monthly liability.",
  },
  {
    question: 'What if there is no fixed interest rate?',
    answer:
      "Just input fixed interest rate same as variable interest rate and input number of fixed years as '0'",
  }
];

const AccordionItem = ({ question, answer }: { question: string; answer: string }) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={toggleExpand}
        activeOpacity={0.7}>
        <Text style={styles.questionText}>{question}</Text>
        <SvgXml
          xml={expanded ? arrowUp : arrowDown}
          width="24"
          height="24"
        />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.accordionBody}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

const Instructions: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform?.OS === 'android' ? { paddingTop: insets.top } : {},
      ]}>
      <Header
        mainHeadingText={'FAQ'}
        onLeftBtnPress={() => navigation.goBack()}
        onRightBtnPress={() => { }}
        leftIcon={<SvgXml width="16" height="16" xml={backButton} />}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.introContainer}>
            <Text style={styles.introHeader}>Frequently Asked Questions</Text>
            <Text style={styles.introSubtext}>
              Find answers to common questions about using the Mortgage
              Calculator below.
            </Text>
          </View>

          <View style={styles.faqListContainer}>
            {faqs.map((faq, index) => (
              <AccordionItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7f9',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  introContainer: {
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  introHeader: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  introSubtext: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  faqListContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  accordionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  accordionBody: {
    padding: 16,
    paddingTop: 0,
    backgroundColor: '#fff',
  },
  answerText: {
    fontSize: 15,
    color: '#555',
    lineHeight: 22,
  },
});

export default Instructions;
