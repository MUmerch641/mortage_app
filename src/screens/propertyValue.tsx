import { RouteProp, useNavigation } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from 'react-native';
import Header from '../components/Header';
import { SvgXml } from 'react-native-svg';
import { backButton } from '../svg';
import { RootStackParamList } from '../../navigationTypes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { propertyValueForm } from '../redux/slices/propertyValueSlice';
import { formatValue } from '../utils/helpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Define prop types
type PropertyValueProps = {
  route: RouteProp<RootStackParamList, 'PropertyValue'>;
};

interface FormState {
  propertyValue: number;
  propertyValueAddedPercent: number,
  newPropertyValue: number,
  newFinanceAmount: number
}

const PropertyValue: React.FC<PropertyValueProps> = ({ route }) => {
  const { ltv } = route.params;

  const dispatch = useDispatch();
  const savedFormData = useSelector((state: any) => state.propertyValue);
  const insets = useSafeAreaInsets();

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [focusedInput, setFocusedInput] = useState(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [form, setForm] = useState<FormState>({
    propertyValue: savedFormData?.propertyValue || 0,
    propertyValueAddedPercent: savedFormData?.propertyValueAddedPercent || 0,
    newPropertyValue: savedFormData?.newPropertyValue || 0,
    newFinanceAmount: savedFormData?.newFinanceAmount || 0,
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRefs = {
    propertyValue: useRef<TextInput>(null),
    propertyValueAddedPercent: useRef<TextInput>(null),
  };

  const newData = [
    { label: 'New Property value', value: formatValue(form.newPropertyValue) },
    { label: 'New finance amount', value: formatValue(form.newFinanceAmount) },
  ];


  // Add keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setFocusedInput(null); // Clear focused field when keyboard hides
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const isFormComplete = (form: Record<string, number>) => {
    return Object.entries(form)
      .filter(([key]) => key !== "newPropertyValue" && key !== "newFinanceAmount") // Ignore addedSalary & average
      .every(([, value]) => value > 0); // Ensure all other values are greater than 0
  };

  const handleFocus = (field: any) => setFocusedInput(field);

  const handleChange = (field: keyof FormState, value: string) => {
    let sanitizedValue = value.trim();
    if (field === 'propertyValueAddedPercent') {
      sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, '');
    } else {
      sanitizedValue = value.replace(/[^0-9.,]/g, '');
      const numericValue = sanitizedValue.replace(/,/g, '');
      if (numericValue === '') {
        sanitizedValue = '';
      } else if (numericValue.includes('.')) {
        const [integerPart, decimalPart] = numericValue.split('.');
        const formattedInteger = Number(integerPart).toLocaleString();
        sanitizedValue = `${formattedInteger}.${decimalPart}`;
      } else {
        sanitizedValue = Number(numericValue).toLocaleString();
      }
    }
    setForm(prev => ({
      ...prev,
      [field]: sanitizedValue,
    }));
  };

  const handleBlur = (field: keyof FormState, value: string) => {
    setFocusedInput(null);
    const numericValue = parseFloat(value.replace(/,/g, '')) || 0;

    const updatedForm = {
      ...form,
      [field]: numericValue
    };

    if (isFormComplete(updatedForm)) {
      const updatedPropertyValue = updatedForm.propertyValue + (updatedForm.propertyValue * (updatedForm.propertyValueAddedPercent / 100));
      const finalResult = updatedPropertyValue * (ltv / 100); // Assuming LTV is a percentage (e.g., 80 for 80%)
      const newFormState = {
        propertyValue: updatedForm.propertyValue, // Keep formatted display value
        propertyValueAddedPercent: updatedForm.propertyValueAddedPercent, // Keep formatted
        newPropertyValue: updatedPropertyValue,
        newFinanceAmount: finalResult,
      };
      setForm(newFormState);
      dispatch(propertyValueForm(newFormState));
    } else {
      // Update both local state and Redux store when form is incomplete
      const resetForm = {
        ...updatedForm,
        newPropertyValue: 0,
        newFinanceAmount: 0
      };
      setForm(resetForm); // This line was previously commented out
      dispatch(propertyValueForm(resetForm));
    }
  };

  const handleSave = () => {
    navigation.navigate('SegmentScreen', {
      propertyValue: form.newPropertyValue,
      financeAmount: form.newFinanceAmount,
    });
  };

  const moveToNextField = (nextField: keyof typeof inputRefs) => {
    const nextInput = inputRefs[nextField];
    if (nextInput?.current) {
      nextInput.current.focus();
    }
  };

  const formatDisplayValue = (field: string, value: number) => {
    if (field === 'propertyValueAddedPercent') {
      if (focusedInput === field && (keyboardVisible || focusedInput !== null)) {
        return value === 0 ? '' : value.toString();
      }
      return value === 0 ? '' : `${value}%`;
    }
    return value === 0 ? '' : value.toLocaleString();
  };

  return (
    <SafeAreaView style={[styles.container, Platform?.OS === 'android' ? { paddingTop: insets.top } : {}]}>
      <Header
        mainHeadingText={' Add Registration and Brokerage fees'}
        onLeftBtnPress={() => navigation.goBack()}
        onRightBtnPress={() => { }}
        leftIcon={<SvgXml width="16" height="16" xml={backButton} />}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      >
        <ScrollView ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled" // Changed from "never"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never"
        >
          <Text style={styles.label}>Property Value</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'propertyValue' && styles.inputFocused,
            ]}
            ref={inputRefs.propertyValue}
            keyboardType="decimal-pad"
            value={formatDisplayValue('propertyValue', form.propertyValue)}
            onFocus={() => handleFocus('propertyValue')}
            onBlur={() => handleBlur('propertyValue', form.propertyValue.toString())}
            onChangeText={text => handleChange('propertyValue', text)}
            returnKeyType="next"
            onSubmitEditing={() => {
              handleBlur('propertyValue', form.propertyValue.toString())
              setTimeout(() => {
                moveToNextField('propertyValueAddedPercent')
              }, 50);
            }}
          />

          <Text style={styles.label}>% Added on actual value</Text>
          <TextInput
            style={[
              styles.input,
              focusedInput === 'propertyValueAddedPercent' &&
              styles.inputFocused,
            ]}
            ref={inputRefs.propertyValueAddedPercent}
            keyboardType="decimal-pad"
            value={formatDisplayValue('propertyValueAddedPercent', form.propertyValueAddedPercent)}
            onFocus={() => handleFocus('propertyValueAddedPercent')}
            onBlur={() => handleBlur('propertyValueAddedPercent', form.propertyValueAddedPercent.toString())}
            onChangeText={text =>
              handleChange('propertyValueAddedPercent', text)
            }
            returnKeyType="done"
          />

          {newData.map((item, index) => (
            <View key={index} style={styles.row}>
              <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
                {item.label}
              </Text>

              <View style={styles.valueContainer}>
                <Text style={styles.valueText}>{item.value}</Text>
              </View>
            </View>
          ))}

          <View style={styles.saveButtonContainer}>
            <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, // Increase height for downward shadow
    shadowOpacity: 0.3, // Adjust opacity to make it subtle
    shadowRadius: 3, // Adjust radius for soft shadow edges
    // Shadow for Android
    elevation: 3, // Lower elevation for a subtle shadow
    // Background color is necessary for shadow effect to be visible
    backgroundColor: '#fff',
  },
  inputFocused: {
    borderColor: 'green', // Green border color for active input
  },
  valueText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'black',
  },
  saveButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  saveButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    width: '100%',
    backgroundColor: '#1d756d',
    borderRadius: 15,
  },
  saveButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 15,
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  valueContainer: {
    backgroundColor: '#94bcb4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 4,
    minWidth: 50,
    alignItems: 'center',
  },
});

export default PropertyValue;
