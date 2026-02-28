/* eslint-disable react-native/no-inline-styles */
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Platform,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  findNodeHandle,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { tick } from '../svg';
import Box from '../components/Box';
import { layout1Form } from '../redux/slices/layout1Slice';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList } from '../../navigationTypes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { validateDate } from '../utils/helpers';
import Footer from '../components/Footer';
import { IncomeFormState, MainScreenProps } from '../utils/types';

type IncomeDetaitsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'IncomeDetailsScreen'>;

const MainScreen: React.FC<MainScreenProps> = ({ navigateToTab, currentTab, totalTabs }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation<IncomeDetaitsScreenNavigationProp>();
  const allValuesFromLayout1 = useSelector((state: any) => state.layout1);
  const [error, setError] = useState('');
  const [isChecked, setIsChecked] = useState(true);
  const [isDbrFocused, setIsDbrFocused] = useState(false);

  const [form, setForm] = useState<IncomeFormState>({
    interestType: 'Ready property',
    income: allValuesFromLayout1?.income || 0,
    additionalIncome: allValuesFromLayout1?.additionalIncome || 0,
    dbr: allValuesFromLayout1?.dbr || 0,
    product: allValuesFromLayout1?.product || 'Ready property',
    dob: allValuesFromLayout1?.dob || '',
    ageAtMaturity: allValuesFromLayout1?.ageAtMaturity || 0,
    bufferPeriod: allValuesFromLayout1?.bufferPeriod || 0,
  });

  const dbrRef = useRef<TextInput | null>(null);
  const dobRef = useRef<TextInput | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const incomeRef = useRef<TextInput | null>(null);
  const bufferPeriodRef = useRef<TextInput | null>(null);
  const ageAtMaturityRef = useRef<TextInput | null>(null);
  const additionalIncomeRef = useRef<TextInput | null>(null);

  const handleInputChange = (field: keyof IncomeFormState, value: string) => {
    let sanitizedValue = value.trim();

    if (field === 'dob') {
      // Existing DOB logic remains unchanged
      sanitizedValue = sanitizedValue.replace(/[^0-9/]/g, '');

      // Handle deletion of slashes
      if (
        sanitizedValue.length < form.dob.length &&
        form.dob[sanitizedValue.length] === '/'
      ) {
        sanitizedValue = sanitizedValue.slice(0, -1);
      }

      // Format input as DD/MM/YYYY
      if (sanitizedValue.length === 2 && !sanitizedValue.includes('/')) {
        sanitizedValue += '/';
      } else if (
        sanitizedValue.length === 5 &&
        !sanitizedValue.slice(-1).includes('/')
      ) {
        sanitizedValue += '/';
      }

      // Check for errors in date format
      if (sanitizedValue.length < 10) {
        setError('Date is incomplete. Use DD/MM/YYYY format.');
      } else {
        const isValid = validateDate(sanitizedValue);
        if (!isValid) {
          setError(
            'Invalid date. Use DD/MM/YYYY with valid day, month, and year.',
          );
        } else {
          setError('');
        }
      }
    } else if (field === 'dbr') {
      // For DBR field, we've already sanitized in onChangeText
      sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, '');
    } else {
      // For numeric fields (including decimal numbers)
      // Allow numbers, single decimal point, and commas
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

    // Update local state immediately for a smooth UI update
    setForm(prevState => ({ ...prevState, [field]: sanitizedValue }))
  };

  // Handles Redux update on blur
  const handleBlur = (field: keyof typeof form, value: string) => {
    if (field === 'dob' || field === 'product') {
      dispatch(layout1Form({ ...form, [field]: value }));
      return;
    }
    // For numeric fields, convert to number
    const numericValue = parseFloat(value.replace(/,/g, '')) || 0;
    setForm(prev => ({ ...prev, [field]: numericValue }));
    dispatch(layout1Form({ ...form, [field]: numericValue }));
  };

  const handleFocus = (event: NativeSyntheticEvent<TextInputFocusEventData>, ref: React.RefObject<TextInput | null>) => {
    if (scrollViewRef.current && ref.current) {
      ref.current.measure((x, y, width, height, pageX, pageY) => {
        if (scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard) {
          scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard(
            findNodeHandle(ref.current),
            // Additional padding above the keyboard
            120, // extraHeight
            true // preventNegativeScrollOffset
          );
        } else {
          // Fallback for older RN versions
          scrollViewRef.current?.scrollTo({
            y: pageY - 100,
            animated: true
          });
        }
      });
    }
  };

  const moveToNextField = (nextField: React.RefObject<TextInput | null>) => {
    if (nextField?.current) {
      nextField.current.focus();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <Text style={styles.label}>Monthly fixed income (MFI)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.income ? form.income.toLocaleString() : ''}
            onFocus={(e) => handleFocus(e, incomeRef)}
            onChangeText={text => handleInputChange('income', text)}
            onBlur={() => handleBlur('income', form.income.toString())}
            returnKeyType="next"
            onSubmitEditing={() => moveToNextField(isChecked ? dbrRef : additionalIncomeRef)}
            ref={incomeRef}
          />

          {/* Additional Income Field */}
          <Text style={styles.label}>Additional Income</Text>
          {/* <Box style={styles.row}> */}
          <Box
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            {isChecked ? (
              <TouchableOpacity
                style={[styles.calculatedInput, { flex: 1, marginRight: 10, backgroundColor: form.additionalIncome ? '#1d756d' : '#fff', }]}
                onPress={() => navigation.navigate('IncomeDetailsScreen', { option: '' })}>
                <Text style={{ fontSize: 14, color: form.additionalIncome ? '#fff' : '#1d756d', fontWeight: form.additionalIncome ? 'bold' : '500' }}>
                  {form.additionalIncome ? form.additionalIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
                    'Tap to enter additional variable income'}
                </Text>
              </TouchableOpacity>
            ) : (
              <TextInput
                style={[
                  styles.input,
                  { flex: 1, marginRight: 10 },
                  isChecked && { backgroundColor: '#e0e0e0' }, // Gray out if checked
                ]}
                keyboardType='decimal-pad'
                placeholder="Enter additional income"
                editable={!isChecked}
                value={form.additionalIncome ? form.additionalIncome.toLocaleString() : ''}
                onFocus={(e) => handleFocus(e, additionalIncomeRef)}
                onChangeText={text => handleInputChange('additionalIncome', text)}
                onBlur={() => handleBlur('additionalIncome', form.additionalIncome.toString())}
                returnKeyType="next"
                onSubmitEditing={() => moveToNextField(dbrRef)}
                ref={additionalIncomeRef}
              />
            )}
            <TouchableOpacity onPress={() => setIsChecked(!isChecked)}>
              <Box style={styles.checkboxContainer}>
                {isChecked ? (
                  <SvgXml xml={tick} width={24} height={24} />
                ) : (
                  <View style={styles.emptyCheckbox} />
                )}
              </Box>
            </TouchableOpacity>
          </Box>

          {/* Other Input Fields */}
          <Text style={styles.label}>Debt-burden ratio (DBR%)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={isDbrFocused && form.dbr ? form.dbr.toString() : form.dbr ? `${form.dbr}%` : ''}
            onFocus={(e) => {
              handleFocus(e, dbrRef);
              setIsDbrFocused(true);
            }}
            onBlur={() => {
              handleBlur('dbr', form.dbr.toString());
              setIsDbrFocused(false);
            }}
            onChangeText={text => {
              handleInputChange('dbr', text);
            }}
            returnKeyType="next"

            onSubmitEditing={() => moveToNextField(dobRef)}
            ref={dbrRef}
          />

          {/* <View style={{ marginVertical: 10 }}>
            <Text style={styles.label}>Product</Text>
            <Picker
              selectedValue={form.product}
              style={styles.picker}
              onValueChange={value => {
                handleInputChange('product', value);
                handleBlur('product', value)
                moveToNextField(dobRef)
              }}>
              <Picker.Item label="Ready property" value="Ready property" />
              <Picker.Item
                label="Under construction"
                value="Under construction"
              />
            </Picker>
          </View> */}

          <Text style={styles.label}>Date of Birth (DD/MM/YYYY)</Text>
          <TextInput
            style={[styles.input, error ? styles.inputError : null]}
            placeholder="DD/MM/YYYY"
            value={form.dob}
            onFocus={(e) => handleFocus(e, dobRef)}
            onChangeText={text => handleInputChange('dob', text)}
            onBlur={() => handleBlur('dob', form.dob)}
            keyboardType="decimal-pad"
            maxLength={10}
            returnKeyType="next"
            onSubmitEditing={() => moveToNextField(ageAtMaturityRef)}
            ref={dobRef}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>Age at maturity (Years)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.ageAtMaturity ? form.ageAtMaturity.toString() : ''}
            onFocus={(e) => handleFocus(e, ageAtMaturityRef)}
            onChangeText={text => handleInputChange('ageAtMaturity', text)}
            onBlur={() => handleBlur('ageAtMaturity', form.ageAtMaturity.toString())}
            returnKeyType="next"
            onSubmitEditing={() => moveToNextField(bufferPeriodRef)}
            ref={ageAtMaturityRef}
          />

          <Text style={styles.label}>Buffer period (Months)</Text>
          <TextInput
            style={styles.input}
            keyboardType="decimal-pad"
            value={form.bufferPeriod ? form.bufferPeriod.toString() : ''}
            onFocus={(e) => handleFocus(e, bufferPeriodRef)}
            onChangeText={text => handleInputChange('bufferPeriod', text)}
            onBlur={() => handleBlur('bufferPeriod', form.bufferPeriod.toString())}
            returnKeyType="done"
            ref={bufferPeriodRef}
          />
        </ScrollView>
        <Footer
            currentTab={currentTab}
            totalTabs={totalTabs}
            onBackPress={() => { }} // No action needed for first tab
            onNextPress={async () => {
              await dispatch(layout1Form(form));
              navigateToTab(2)
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
  calculatedInput: {
    marginTop: 8,
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1d756d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  inputError: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
    borderColor: 'red', // Highlight the border in red
    backgroundColor: '#ffe6e6', // Light red background for better visibility
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginBottom: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  checkboxContainer: {
    marginTop: 8,
    height: 40,
    width: 40,
    borderRadius: 10,
    marginLeft: 10,
    backgroundColor: '#1D756D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 4,
  },
});

export default MainScreen;
