import {Picker} from '@react-native-picker/picker';
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  TextInput,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  findNodeHandle,
  Keyboard,
} from 'react-native';
import Box from '../components/Box';
import {useDispatch, useSelector} from 'react-redux';
import {layout3Form} from '../redux/slices/layout3Slice';
import Footer from '../components/Footer';
import {MainScreenProps} from '../utils/types';

const LayoutScreen3: React.FC<MainScreenProps> = ({
  navigateToTab,
  currentTab,
  totalTabs,
}) => {
  const dispatch = useDispatch();
  const allValuesFromLayout3 = useSelector((state: any) => state.layout3);

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [baseLifeInsuranceRate, setBaseLifeInsuranceRate] = useState(
    allValuesFromLayout3?.lifeInsuranceRate || 0,
  );

  const [form, setForm] = useState({
    interestType: allValuesFromLayout3?.interestType || 'Fixed',
    fixedInterestRate: allValuesFromLayout3?.fixedInterestRate || 0,
    numOfFixedYear: allValuesFromLayout3?.numOfFixedYear || 0,
    variableInterestRate: allValuesFromLayout3?.variableInterestRate || 0,
    IBOR: allValuesFromLayout3?.IBOR || 0,
    lifeInsuranceRate: allValuesFromLayout3?.lifeInsuranceRate || 0,
    propertyInsuranceRate: allValuesFromLayout3?.propertyInsuranceRate || 0,
    numberOfLiables: allValuesFromLayout3?.numberOfLiables || 0,
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const fields = [
    {field: 'fixedInterestRate', label: 'Fixed interest rate'},
    {field: 'numOfFixedYear', label: 'Number of fixed years'},
    {field: 'variableInterestRate', label: 'Variable interest rate'},
    {field: 'IBOR', label: 'IBOR (Interbank Offered Rate)'},
    {field: 'lifeInsuranceRate', label: 'Life insurance rate (Annual)'},
    {field: 'propertyInsuranceRate', label: 'Property insurance rate (Annual)'},
    {field: 'numberOfLiables', label: 'Number of liable applicants'},
  ];

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
        setFocusedField(null);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    if (allValuesFromLayout3) {
      setForm(allValuesFromLayout3);
      // Initialize base rate with the original value (divide by number of liables if it exists)
      const initialBaseRate = allValuesFromLayout3.numberOfLiables
        ? allValuesFromLayout3.lifeInsuranceRate /
          allValuesFromLayout3.numberOfLiables
        : allValuesFromLayout3.lifeInsuranceRate || 0;
      setBaseLifeInsuranceRate(initialBaseRate);
    }
  }, [allValuesFromLayout3]);

  const handleInputChange = (field: keyof typeof form, value: string) => {
    let sanitizedValue = value.trim();
    const rateFields = [
      'fixedInterestRate',
      'variableInterestRate',
      'IBOR',
      'lifeInsuranceRate',
      'propertyInsuranceRate',
    ];

    if (rateFields.includes(field)) {
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

    setForm(prevState => ({
      ...prevState,
      [field]: sanitizedValue,
    }));
  };

  // Save field to Redux when it loses focus
  const handleBlur = (field: keyof typeof form, value: string) => {
    setFocusedField(null);
    const numericValue = parseFloat(value.replace(/,/g, '')) || 0;
    let updatedForm;

    if (field === 'numberOfLiables') {
      console.log('Life Insurance Rate:', form.lifeInsuranceRate);
      const calculatedRate =
        numericValue > 0
          ? baseLifeInsuranceRate * numericValue
          : baseLifeInsuranceRate;
      updatedForm = {
        ...form,
        [field]: numericValue,
        lifeInsuranceRate: calculatedRate,
      };
    } else if (field === 'lifeInsuranceRate') {
      // When lifeInsuranceRate is directly edited, update the base rate
      setBaseLifeInsuranceRate(numericValue);
      updatedForm = {
        ...form,
        [field]: numericValue * (form.numberOfLiables || 1),
      };
    } else {
      updatedForm = {
        ...form,
        [field]: numericValue,
      };
    }
    setForm(updatedForm);
    dispatch(layout3Form({...updatedForm}));
  };

  const handleFocus = (
    event: NativeSyntheticEvent<TextInputFocusEventData>,
    ref: React.RefObject<TextInput | null>,
    field: string,
  ) => {
    setFocusedField(field);
    if (scrollViewRef.current && ref.current) {
      ref.current.measure((x, y, width, height, pageX, pageY) => {
        if (
          scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard
        ) {
          scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard(
            findNodeHandle(ref.current),
            350,
            true,
          );
        } else {
          scrollViewRef.current?.scrollTo({
            y: pageY - 100,
            animated: true,
          });
        }
      });
    }
  };

  const moveToNextField = (index: number) => {
    if (inputRefs.current[index + 1]) {
      // Use setTimeout to ensure the keyboard doesn't close during transition
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 100);
    }
  };

  // Format value for display (add % for rate fields when not focused)
  const formatDisplayValue = (field: string, value: number | string) => {
    const numericValue =
      typeof value === 'string'
        ? parseFloat(value.replace(/,/g, '')) || 0
        : value || 0;
    const rateFields = [
      'fixedInterestRate',
      'variableInterestRate',
      'IBOR',
      'lifeInsuranceRate',
      'propertyInsuranceRate',
    ];
    const isRateField = rateFields.includes(field);
    const isFocused =
      focusedField === field && (keyboardVisible || focusedField !== null);
    if (isRateField) {
      if (isFocused) {
        if (typeof value === 'string') {
          return value;
        }
        return numericValue === 0 ? '' : numericValue.toString();
      }
      return numericValue === 0 ? '' : `${numericValue}%`;
    }
    // For other fields, format with commas and keep decimals
    return numericValue === 0 ? '' : numericValue.toLocaleString();
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
          <Box
            style={{
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}>
            <Box
              style={{
                justifyContent: 'center',
                paddingHorizontal: 20,
                paddingVertical: 10,
                backgroundColor: '#1d756d',
                borderRadius: 10,
                alignItems: 'center',
              }}>
              <Text style={{fontSize: 20, fontWeight: 'bold', color: 'white'}}>
                Rates
              </Text>
            </Box>
          </Box>

          {/* Dropdown for Interest Type */}
          {/* <View style={{ marginVertical: 10 }}>
            <Text style={styles.label}>Calculate eligibility based on</Text>
            <Picker
              selectedValue={form.interestType}
              style={styles.picker}
              onValueChange={value => {
                setForm(prev => ({ ...prev, interestType: value }));
                dispatch(layout3Form({ ...form, interestType: value }));
              }}>
              <Picker.Item label="Fixed" value="Fixed" />
              <Picker.Item label="Variable" value="Variable" />
            </Picker>
          </View> */}

          {fields.map((item, index) => (
            <View key={item.field}>
              <Text style={styles.label}>{item.label}</Text>
              <TextInput
                ref={el => {
                  inputRefs.current[index + 1] = el;
                }}
                style={styles.input}
                keyboardType="decimal-pad"
                value={formatDisplayValue(
                  item.field,
                  form[item.field as keyof typeof form],
                )}
                onFocus={event =>
                  handleFocus(
                    event,
                    {current: inputRefs.current[index + 1]},
                    item.field,
                  )
                }
                onBlur={() =>
                  handleBlur(
                    item.field as keyof typeof form,
                    form[item.field as keyof typeof form].toString(),
                  )
                }
                onChangeText={value =>
                  handleInputChange(item.field as keyof typeof form, value)
                }
                returnKeyType={index < 6 ? 'next' : 'done'}
                onSubmitEditing={event => {
                  handleBlur(
                    item.field as keyof typeof form,
                    form[item.field as keyof typeof form].toString(),
                  );
                  setTimeout(() => {
                    moveToNextField(index + 1);
                  }, 50);
                }}
              />
            </View>
          ))}
          <Footer
            currentTab={currentTab}
            totalTabs={totalTabs}
            onBackPress={async () => {
              await dispatch(layout3Form(form));
              navigateToTab(2);
            }}
            onNextPress={async () => {
              await dispatch(layout3Form(form));
              navigateToTab(4);
            }}
          />
        </ScrollView>
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
    flexGrow: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 10,
  },
  picker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
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

export default LayoutScreen3;
