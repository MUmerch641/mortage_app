import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  findNodeHandle,
  Keyboard,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { layout2Form } from '../redux/slices/layout2Slice';
import Box from '../components/Box';
import Footer from '../components/Footer';
import { MainScreenProps } from '../utils/types';

const LayoutScreen2: React.FC<MainScreenProps> = ({
  navigateToTab,
  currentTab,
  totalTabs,
}) => {
  const dispatch = useDispatch();
  const allValuesFromLayout1 = useSelector((state: any) => state.layout1); // Get income from Redux
  const allValuesFromLayout2 = useSelector((state: any) => state.layout2);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  // State for form fields
  const [form, setForm] = useState({
    monthlyInstallment1: allValuesFromLayout2?.monthlyInstallment1 || 0,
    monthlyInstallment2: allValuesFromLayout2?.monthlyInstallment2 || 0,
    monthlyInstallment3: allValuesFromLayout2?.monthlyInstallment3 || 0,
    monthlyInstallment4: allValuesFromLayout2?.monthlyInstallment4 || 0,
    monthlyInstallment5: allValuesFromLayout2?.monthlyInstallment5 || 0,
    monthlyInstallment6: allValuesFromLayout2?.monthlyInstallment6 || 0,
    percentLiability: allValuesFromLayout2?.percentLiability || 0,
    creditCardLimit1: allValuesFromLayout2?.creditCardLimit1 || 0,
    creditCardLimit2: allValuesFromLayout2?.creditCardLimit2 || 0,
    creditCardLimit3: allValuesFromLayout2?.creditCardLimit3 || 0,
    creditCardLimit4: allValuesFromLayout2?.creditCardLimit4 || 0,
    creditCardLimit5: allValuesFromLayout2?.creditCardLimit5 || 0,
    creditCardLimit6: allValuesFromLayout2?.creditCardLimit6 || 0,
    calculatedDBR: allValuesFromLayout2?.calculatedDBR || 0,
  });

  const scrollViewRef = useRef<ScrollView>(null); // To scroll to the focused input field
  const inputRefs = useRef<(TextInput | null)[]>([]); // To store references to input fields

  // Add keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setFocusedField(null); // Clear focused field when keyboard hides
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Calculate DBR Formula
  type FormState = typeof form;
  const calculateDBR = (form: FormState) => {
    // Sum all credit card limits (empty fields treated as 0)
    const totalCreditCardLimits = [
      form.creditCardLimit1,
      form.creditCardLimit2,
      form.creditCardLimit3,
      form.creditCardLimit4,
      form.creditCardLimit5,
      form.creditCardLimit6,
    ].reduce((sum, val) => sum + val, 0);
    // Sum all monthly installments (empty fields treated as 0)
    const totalMonthlyInstallments = [
      form.monthlyInstallment1,
      form.monthlyInstallment2,
      form.monthlyInstallment3,
      form.monthlyInstallment4,
      form.monthlyInstallment5,
      form.monthlyInstallment6,
    ].reduce((sum, val) => sum + val, 0);
    const liabilityPercent = form.percentLiability / 100;
    const { income, additionalIncome } = allValuesFromLayout1;
    const totalIncome = income + additionalIncome;
    if (totalIncome === 0 || isNaN(totalIncome)) {
      return 0.0; // Prevent NaN
    }
    const dbrResult =
      ((totalCreditCardLimits * liabilityPercent + totalMonthlyInstallments) /
        totalIncome) *
      100;
    return isNaN(dbrResult) ? 0 : parseFloat(dbrResult.toFixed(2));
  };

  // Handle Input Change and Format Fields
  const handleChange = (field: keyof typeof form, value: string) => {
    let sanitizedValue = value.trim();

    if (field === 'percentLiability') {
      sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, '');
    } else {
      sanitizedValue = value.replace(/[^0-9.,]/g, '');
      // Replace commas with empty string for processing but keep them for display
      const numericValue = sanitizedValue.replace(/,/g, '');
      // Format with commas and optional decimals
      if (numericValue === '') {
        sanitizedValue = '';
      } else if (numericValue.includes('.')) {
        // For decimal numbers, format the integer part with commas
        const [integerPart, decimalPart] = numericValue.split('.');
        const formattedInteger = Number(integerPart).toLocaleString();
        sanitizedValue = `${formattedInteger}.${decimalPart}`;
      } else {
        // For whole numbers, format with commas
        sanitizedValue = Number(numericValue).toLocaleString();
      }
    }

    setForm(prev => ({ ...prev, [field]: sanitizedValue }));
  };

  // Save Each Field to Redux & Trigger DBR Calculation
  const handleBlur = (field: keyof typeof form, value: string) => {
    const numericValue = parseFloat(value.replace(/,/g, '')) || 0;

    const updatedForm = {
      ...form,
      [field]: numericValue,
    };
    setForm(updatedForm);
    dispatch(layout2Form({ ...updatedForm }));

    const hasInstallment = [
      updatedForm.monthlyInstallment1,
      updatedForm.monthlyInstallment2,
      updatedForm.monthlyInstallment3,
      updatedForm.monthlyInstallment4,
      updatedForm.monthlyInstallment5,
      updatedForm.monthlyInstallment6,
    ].some(val => val > 0);
    const hasCreditCardLimit = [
      updatedForm.creditCardLimit1,
      updatedForm.creditCardLimit2,
      updatedForm.creditCardLimit3,
      updatedForm.creditCardLimit4,
      updatedForm.creditCardLimit5,
      updatedForm.creditCardLimit6,
    ].some(val => val > 0);
    const shouldCalculate = hasInstallment || hasCreditCardLimit;
    const calculatedResult = shouldCalculate
      ? calculateDBR(updatedForm)
      : 0.0;

    setForm({
      ...updatedForm,
      calculatedDBR: calculatedResult,
    });
    dispatch(layout2Form({ ...updatedForm, calculatedDBR: calculatedResult }));
  };

  const handleFocus = (
    event: NativeSyntheticEvent<TextInputFocusEventData>,
    ref: React.RefObject<TextInput | null>,
    field: string,
  ) => {
    setFocusedField(field);
  };

  // Move Focus to Next Field
  const moveToNextField = (index: number) => {
    if (inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Format value for display (add % for percentLiability when not focused)
  const formatDisplayValue = (field: string, value: number) => {
    if (field === 'percentLiability') {
      if (
        focusedField === field &&
        (keyboardVisible || focusedField !== null)
      ) {
        // When focused, show raw numeric value without formatting
        return value === 0 ? '' : value.toString();
      }
      // When not focused, show with % sign
      return value === 0 ? '' : `${value}%`;
    }
    // For other fields, format with commas and keep decimals
    return value === 0 ? '' : value.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}>
          {/* Monthly Installments */}
          <Box
            style={{
              justifyContent: 'center',
              width: 120,
              padding: 10,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              height: 50,
            }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffff' }}>
              Liabilities
            </Text>
          </Box>

          <View style={{ borderWidth: 0, marginTop: 10 }}>
            {[
              'monthlyInstallment1',
              'monthlyInstallment2',
              'monthlyInstallment3',
              'monthlyInstallment4',
              'monthlyInstallment5',
              'monthlyInstallment6',
            ].map((field, index) => (
              <View key={field}>
                <Text style={styles.label}>
                  Monthly Installment #{index + 1}
                </Text>
                <TextInput
                  ref={el => {
                    inputRefs.current[index] = el;
                  }}
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="Enter amount"
                  placeholderTextColor="black"
                  value={formatDisplayValue(
                    field as keyof typeof form,
                    form[field as keyof typeof form],
                  )}
                  onFocus={event =>
                    handleFocus(
                      event,
                      { current: inputRefs.current[index] },
                      field,
                    )
                  }
                  onBlur={() =>
                    handleBlur(
                      field as keyof typeof form,
                      form[field as keyof typeof form].toString(),
                    )
                  }
                  onChangeText={value =>
                    handleChange(field as keyof typeof form, value)
                  }
                  returnKeyType={index < 5 ? 'next' : 'done'}
                  blurOnSubmit={index >= 5}
                  onSubmitEditing={() => {
                    if (index < 5) {
                      setTimeout(() => moveToNextField(index), 50);
                    }
                  }}
                />
              </View>
            ))}
          </View>

          {/* Credit Card Limits */}
          <Box
            style={{
              justifyContent: 'center',
              width: 150,
              padding: 10,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              marginTop: 10,
              height: 50,
            }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffff' }}>
              Credit Cards
            </Text>
          </Box>

          <View style={{ borderWidth: 0 }}>
            {[
              'percentLiability',
              'creditCardLimit1',
              'creditCardLimit2',
              'creditCardLimit3',
              'creditCardLimit4',
              'creditCardLimit5',
              'creditCardLimit6',
            ].map((field, index) => (
              <View key={field}>
                <Text style={styles.label}>
                  {field === 'percentLiability'
                    ? 'Percentage of CC limit as liability'
                    : `Credit Card Limit #${index}`}
                </Text>
                <TextInput
                  ref={el => {
                    inputRefs.current[index + 6] = el;
                  }}
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder={field === 'percentLiability' ? 'Enter %' : 'Enter amount'}
                  placeholderTextColor="black"
                  value={formatDisplayValue(
                    field as keyof typeof form,
                    form[field as keyof typeof form],
                  )}
                  onFocus={event =>
                    handleFocus(
                      event,
                      { current: inputRefs.current[index + 6] },
                      field,
                    )
                  }
                  onBlur={() =>
                    handleBlur(
                      field as keyof typeof form,
                      form[field as keyof typeof form].toString(),
                    )
                  }
                  onChangeText={value =>
                    handleChange(field as keyof typeof form, value)
                  }
                  returnKeyType={index < 6 ? 'next' : 'done'}
                  blurOnSubmit={index >= 6}
                  onSubmitEditing={() => {
                    if (index < 6) {
                      setTimeout(() => moveToNextField(index + 6), 50);
                    }
                  }}
                />
              </View>
            ))}
          </View>

          {/* Display DBR Result */}
          {/* {form.calculatedDBR ? ( */}
          <Text
            style={{
              color: '#1d756d',
              padding: 5,
              marginVertical: 10,
              fontWeight: '900',
              fontSize: 16,
            }}>
            Current DBR is {form.calculatedDBR ? form.calculatedDBR : 0}%
          </Text>
          {/* // ) : (
          //   <Text style={{ color: 'red', padding: 5, marginVertical: 10, fontWeight: '600', fontSize: 16 }}>Current DBR (%) would be calculated as soon as you fill up all the necessary fields.</Text>
          // )} */}
        </ScrollView>
        <Footer
          currentTab={currentTab}
          totalTabs={totalTabs}
          onBackPress={async () => {
            await dispatch(layout2Form(form));
            navigateToTab(1);
          }}
          onNextPress={async () => {
            const fieldoBeBlurred = [
              'monthlyInstallment1',
              'monthlyInstallment2',
              'monthlyInstallment3',
              'monthlyInstallment4',
              'monthlyInstallment5',
              'monthlyInstallment6',
              'percentLiability',
              'creditCardLimit1',
              'creditCardLimit2',
              'creditCardLimit3',
              'creditCardLimit4',
              'creditCardLimit5',
              'creditCardLimit6',
            ].find((field, index) => focusedField === field);
            if (fieldoBeBlurred) {
              handleBlur(
                fieldoBeBlurred as keyof typeof form,
                form[fieldoBeBlurred as keyof typeof form].toString(),
              );
            }
            navigateToTab(3);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
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
    backgroundColor: '#fff',
  },
});

export default LayoutScreen2;
