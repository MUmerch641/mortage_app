import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  TouchableOpacity,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  findNodeHandle,
  Modal,
} from 'react-native';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {SvgXml} from 'react-native-svg';
import Header from '../components/Header';
import {backButton, reset} from '../svg/index';
import Box from '../components/Box';
import {useDispatch, useSelector} from 'react-redux';
import {
  incomeDetailFormValue,
  resetIncomeDetail,
} from '../redux/slices/incomeDetailSlice';
import {layout1Form} from '../redux/slices/layout1Slice';
import {RootStackParamList} from '../../navigationTypes';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type NavigationProps = NavigationProp<RootStackParamList, 'SegmentScreen'>;

const IncomeDetailsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProps>();
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  // Redux state for stored values
  const allValuesFromLayout1 = useSelector((state: any) => state.layout1);
  const savedFormData = useSelector(
    (state: any) => state.incomeDetail.savedFormData,
  );

  // Track focus state for percentage fields
  const [isModalVisible2, setModalVisible2] = useState(false);
  const [isCapLimitFocused, setIsCapLimitFocused] = useState(false);
  const [isResetModalVisible, setResetModalVisible] = useState(false);
  const [isPercentageAvgFocused, setIsPercentageAvgFocused] = useState(false);
  const [isReturnInvestmentFocused, setIsReturnInvestmentFocused] =
    useState(false);
  const [isPercentageAvgIncFocused, setIsPercentageAvgIncFocused] =
    useState(false);
  const [isTicketPercentageFocused, setIsTicketPercentageFocused] =
    useState(false);
  const [isPercentageConsideredFocused, setIsPercentageConsideredFocused] =
    useState(false);
  const localInitialState = {
    rental: {yearlyIncome: 0, returnInvestment: 0, capLimit: 0, addedSalary: 0},
    bonus: {
      input1: 0,
      input2: 0,
      input3: 0,
      average: 0,
      percentageAvg: 0,
      addedSalary: 0,
    },
    incentive: {
      input1: 0,
      input2: 0,
      input3: 0,
      input4: 0,
      input5: 0,
      input6: 0,
      average: 0,
      percentageAvg: 0,
      addedSalary: 0,
    },
    schoolingAllowance: {
      yearlyAllowance: 0,
      percentageConsidered: 0,
      addedSalary: 0,
    },
    ticketAllowance: {
      yearlyAllowance: 0,
      percentageConsidered: 0,
      addedSalary: 0,
    },
  };
  const [formState, setFormState] = useState(localInitialState);

  const scrollViewRef = useRef<ScrollView>(null);

  const yearlyIncomeRef = useRef<TextInput>(null);
  const returnInvestmentRef = useRef<TextInput>(null);
  const capLimitRef = useRef<TextInput>(null);

  const input1Ref = useRef<TextInput>(null);
  const input2Ref = useRef<TextInput>(null);
  const input3Ref = useRef<TextInput>(null);
  const percentageAvgRef = useRef<TextInput>(null);

  const input1RefInc = useRef<TextInput>(null);
  const input2RefInc = useRef<TextInput>(null);
  const input3RefInc = useRef<TextInput>(null);
  const input4RefInc = useRef<TextInput>(null);
  const input5RefInc = useRef<TextInput>(null);
  const input6RefInc = useRef<TextInput>(null);
  const percentageAvgRefInc = useRef<TextInput>(null);

  const input1RefSA = useRef<TextInput>(null);
  const input2RefSA = useRef<TextInput>(null);

  const input1RefTA = useRef<TextInput>(null);
  const input2RefTA = useRef<TextInput>(null);

  // Load saved data from Redux when component mounts
  useEffect(() => {
    if (savedFormData) {
      setFormState(prevState => ({
        ...prevState,
        rental: {...prevState.rental, ...savedFormData.rental},
        bonus: {...prevState.bonus, ...savedFormData.bonus},
        incentive: {...prevState.incentive, ...savedFormData.incentive},
        schoolingAllowance: {
          ...prevState.schoolingAllowance,
          ...savedFormData.schoolingAllowance,
        },
        ticketAllowance: {
          ...prevState.ticketAllowance,
          ...savedFormData.ticketAllowance,
        },
      }));
    }
  }, [savedFormData]);

  // Helper function to format numbers with commas and optional decimals
  const formatNumber = (value: number) => {
    // Convert to number if it's a string and handle NaN cases
    const numValue =
      typeof value === 'string' ? parseFloat(value) : Number(value);
    if (isNaN(numValue)) {
      return '0.00';
    }
    // Format with commas and exactly 2 decimal places
    return numValue.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const isFormComplete = (form: Record<string, number>) => {
    return Object.entries(form)
      .filter(
        ([key]) =>
          key !== 'addedSalary' && key !== 'average' && key !== 'capLimit',
      ) // Ignore addedSalary & average
      .every(([, value]) => value > 0); // Ensure all other values are greater than 0
  };

  const handleInputChange = (
    category: keyof typeof formState,
    field: string,
    value: string,
    isPercentage: boolean = false,
  ) => {
    let sanitizedValue = value.trim();

    if (isPercentage) {
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
    setFormState(prevState => {
      // Update form state dynamically
      const updatedForm = {
        ...prevState,
        [category]: {...prevState[category], [field]: sanitizedValue},
      };

      return updatedForm; // Ensure state is always updated
    });
  };

  // Save data to Redux on field submission
  const handleBlur = (
    category: keyof typeof formState,
    field: string,
    value: string,
  ) => {
    const numericValue = parseFloat(value.replace(/,/g, '')) || 0;

    const updatedForm = {
      ...formState,
      [category]: {...formState[category], [field]: numericValue},
    };

    // Special handling for bonus and incentive categories
    if (category === 'bonus' || category === 'incentive') {
      calculateAndUpdate(updatedForm, category);
    } else {
      if (isFormComplete(updatedForm[category])) {
        calculateAndUpdate(updatedForm, category);
      } else {
        updatedForm[category].addedSalary = 0; // Reset calculation if inputs are incomplete
        dispatch(incomeDetailFormValue(updatedForm)); // Save to Redux
      }
    }
  };

  const handleFocus = (
    event: NativeSyntheticEvent<TextInputFocusEventData>,
    ref: React.RefObject<TextInput | null>,
  ) => {
    if (scrollViewRef.current && ref.current) {
      ref.current.measure((x, y, width, height, pageX, pageY) => {
        if (
          scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard
        ) {
          scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard(
            findNodeHandle(ref.current),
            // Additional padding above the keyboard
            350, // extraHeight (adjust as needed)
            true, // preventNegativeScrollOffset
          );
        } else {
          // Fallback for older RN versions
          scrollViewRef.current?.scrollTo({
            y: pageY - 100,
            animated: true,
          });
        }
      });
    }
  };

  const calculateAndUpdate = useCallback(
    (updatedState: typeof formState, category: keyof typeof formState) => {
      let addedSalary = 0;
      let average = 0;

      switch (category) {
        case 'rental':
          {
            const {yearlyIncome, returnInvestment, capLimit} =
              updatedState.rental;
            const monthlyIncome =
              (yearlyIncome * (returnInvestment / 100)) / 12;
            const capAmount = (capLimit / 100) * allValuesFromLayout1?.income;
            addedSalary = capAmount
              ? Math.min(monthlyIncome, capAmount)
              : monthlyIncome; // Apply cap limit
          }
          break;

        case 'bonus':
        case 'incentive':
          {
            const categoryData = updatedState[category] as Record<
              string,
              number
            >;
            const inputs = Object.keys(categoryData)
              .filter(key => key.startsWith('input')) // Get all input fields dynamically
              .map(key => categoryData[key] || 0); // Treat undefined/null as 0

            // Filter out zero or falsy values
            const filledInputs = inputs.filter(value => value > 0);
            // Check if at least one input has a value > 0
            const hasAtLeastOneValue = filledInputs.some(num => num > 0);

            if (hasAtLeastOneValue) {
              // Calculate average considering all inputs (including zeros)
              average =
                filledInputs.reduce((a, b) => a + b, 0) / filledInputs.length;
              const percentage = categoryData.percentageAvg || 0;
              addedSalary =
                category === 'incentive'
                  ? (average * percentage) / 100
                  : (average * percentage) / 100 / 12;
            } else {
              // No values provided, reset calculations
              average = 0;
              addedSalary = 0;
            }
          }
          break;

        case 'schoolingAllowance':
        case 'ticketAllowance':
          {
            const {yearlyAllowance, percentageConsidered} =
              updatedState[category];
            addedSalary = (yearlyAllowance * percentageConsidered) / 100 / 12;
          }
          break;

        default:
          return;
      }

      // Update State & Redux with Calculated Value
      const updatedCategory = {
        ...updatedState[category],
        addedSalary: parseFloat(addedSalary.toFixed(2)), // Convert back to number
        ...(category === 'bonus' || category === 'incentive'
          ? {
              average: parseFloat(average.toFixed(2)), // Convert back to number
            }
          : {}),
      };

      // For local form state (can keep as string for display purposes)
      const formCategory = {
        ...updatedCategory,
        addedSalary: addedSalary.toFixed(2),
        ...(category === 'bonus' || category === 'incentive'
          ? {
              average: average.toFixed(2),
            }
          : {}),
      };

      setFormState(prevState => ({
        ...prevState,
        [category]: formCategory,
      }));

      // Dispatch numeric values to Redux store
      dispatch(
        incomeDetailFormValue({
          ...updatedState,
          [category]: updatedCategory,
        }),
      );
    },
    [allValuesFromLayout1?.income, dispatch],
  );

  const moveToNextField = (nextField: React.RefObject<TextInput | null>) => {
    if (nextField?.current) {
      nextField.current.focus();
    }
  };

  const rentalIncomeForm = () => {
    return (
      <>
        <Box
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            padding: 10,
          }}>
          <Box
            style={{
              justifyContent: 'center',
              padding: 10,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              height: 50,
            }}>
            <Text style={{fontSize: 20, fontWeight: 'bold', color: 'white'}}>
              Rental Income
            </Text>
          </Box>
        </Box>

        <Text style={styles.label}>Total yearly rental income (RI)</Text>
        <TextInput
          ref={yearlyIncomeRef}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.rental.yearlyIncome
              ? formState.rental.yearlyIncome.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, yearlyIncomeRef)}
          onChangeText={text =>
            handleInputChange('rental', 'yearlyIncome', text)
          }
          onBlur={() =>
            handleBlur(
              'rental',
              'yearlyIncome',
              formState.rental.yearlyIncome.toString(),
            )
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(returnInvestmentRef)}
        />
        <Text style={styles.label}>Percentage to be considered</Text>
        <TextInput
          ref={returnInvestmentRef}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            isReturnInvestmentFocused && formState.rental.returnInvestment
              ? formState.rental.returnInvestment.toString()
              : formState.rental.returnInvestment
              ? `${formState.rental.returnInvestment}%`
              : ''
          }
          onFocus={e => {
            handleFocus(e, returnInvestmentRef);
            setIsReturnInvestmentFocused(true);
          }}
          onBlur={() => {
            handleBlur(
              'rental',
              'returnInvestment',
              formState.rental.returnInvestment.toString(),
            );
            setIsReturnInvestmentFocused(false);
          }}
          onChangeText={text =>
            handleInputChange('rental', 'returnInvestment', text, true)
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(capLimitRef)}
        />
        <Text style={styles.label}>(RI) cap percentage of (MFI)</Text>
        <TextInput
          ref={capLimitRef}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            isCapLimitFocused && formState.rental.capLimit
              ? formState.rental.capLimit.toString()
              : formState.rental.capLimit
              ? `${formState.rental.capLimit}%`
              : ''
          }
          onFocus={e => {
            handleFocus(e, capLimitRef);
            setIsCapLimitFocused(true);
          }}
          onBlur={() => {
            handleBlur(
              'rental',
              'capLimit',
              formState.rental.capLimit.toString(),
            );
            setIsCapLimitFocused(false);
          }}
          onChangeText={text =>
            handleInputChange('rental', 'capLimit', text, true)
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input1Ref)}
        />
        <Text style={styles.label}>Amount will be added on (MFI)</Text>
        <View style={styles.calculatedInput}>
          <Text style={{fontSize: 16, fontWeight: '700', color: 'black'}}>
            {formatNumber(formState.rental.addedSalary)}
          </Text>
        </View>
      </>
    );
  };

  const handleBonusForm = () => {
    return (
      <>
        <Box
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            padding: 10,
          }}>
          <Box
            style={{
              justifyContent: 'center',
              padding: 10,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              height: 50,
            }}>
            <Text style={{fontSize: 20, fontWeight: 'bold', color: 'white'}}>
              Yearly Bonus
            </Text>
          </Box>
        </Box>

        <Text style={styles.label}>Bonus # 1</Text>
        <TextInput
          ref={input1Ref}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.bonus.input1
              ? formState.bonus.input1.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input1Ref)}
          onChangeText={text => handleInputChange('bonus', 'input1', text)}
          onBlur={() =>
            handleBlur('bonus', 'input1', formState.bonus.input1.toString())
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input2Ref)}
        />
        <Text style={styles.label}>Bonus # 2</Text>
        <TextInput
          ref={input2Ref}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.bonus.input2
              ? formState.bonus.input2.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input2Ref)}
          onChangeText={text => handleInputChange('bonus', 'input2', text)}
          onBlur={() =>
            handleBlur('bonus', 'input2', formState.bonus.input2.toString())
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input3Ref)}
        />
        <Text style={styles.label}>Bonus # 3</Text>
        <TextInput
          ref={input3Ref}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.bonus.input3
              ? formState.bonus.input3.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input3Ref)}
          onChangeText={text => handleInputChange('bonus', 'input3', text)}
          onBlur={() =>
            handleBlur('bonus', 'input3', formState.bonus.input3.toString())
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(percentageAvgRef)}
        />
        <Text style={styles.label}>Average</Text>
        <View style={styles.calculatedInput}>
          <Text style={{fontSize: 16, fontWeight: '700', color: 'black'}}>
            {formatNumber(formState.bonus.average)}
          </Text>
        </View>
        <Text style={styles.label}>Percentage of average to be considered</Text>
        <TextInput
          ref={percentageAvgRef}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            isPercentageAvgFocused && formState.bonus.percentageAvg
              ? formState.bonus.percentageAvg.toString()
              : formState.bonus.percentageAvg
              ? `${formState.bonus.percentageAvg}%`
              : ''
          }
          onFocus={e => {
            handleFocus(e, percentageAvgRef);
            setIsPercentageAvgFocused(true);
          }}
          onBlur={() => {
            handleBlur(
              'bonus',
              'percentageAvg',
              formState.bonus.percentageAvg.toString(),
            );
            setIsPercentageAvgFocused(false);
          }}
          onChangeText={text =>
            handleInputChange('bonus', 'percentageAvg', text, true)
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input1RefInc)}
        />
        <Text style={styles.label}>Amount will be added on (MFI)</Text>
        <View style={styles.calculatedInput}>
          <Text style={{fontSize: 16, fontWeight: '700', color: 'black'}}>
            {formatNumber(formState.bonus.addedSalary)}
          </Text>
        </View>
      </>
    );
  };

  const handleIncentiveForm = () => {
    return (
      <>
        <Box
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            padding: 10,
          }}>
          <Box
            style={{
              justifyContent: 'center',
              padding: 10,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              height: 50,
            }}>
            <Text style={{fontSize: 20, fontWeight: 'bold', color: 'white'}}>
              Monthly Incentive
            </Text>
          </Box>
        </Box>

        <Text style={styles.label}>Incentive # 1</Text>
        <TextInput
          ref={input1RefInc}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.incentive.input1
              ? formState.incentive.input1.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input1RefInc)}
          onChangeText={text => handleInputChange('incentive', 'input1', text)}
          onBlur={() =>
            handleBlur(
              'incentive',
              'input1',
              formState.incentive.input1.toString(),
            )
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input2RefInc)}
        />

        <Text style={styles.label}>Incentive # 2</Text>
        <TextInput
          ref={input2RefInc}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.incentive.input2
              ? formState.incentive.input2.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input2RefInc)}
          onChangeText={text => handleInputChange('incentive', 'input2', text)}
          onBlur={() =>
            handleBlur(
              'incentive',
              'input2',
              formState.incentive.input2.toString(),
            )
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input3RefInc)}
        />
        <Text style={styles.label}>Incentive # 3</Text>
        <TextInput
          ref={input3RefInc}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.incentive.input3
              ? formState.incentive.input3.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input3RefInc)}
          onChangeText={text => handleInputChange('incentive', 'input3', text)}
          onBlur={() =>
            handleBlur(
              'incentive',
              'input3',
              formState.incentive.input3.toString(),
            )
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input4RefInc)}
        />
        <Text style={styles.label}>Incentive # 4</Text>
        <TextInput
          ref={input4RefInc}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.incentive.input4
              ? formState.incentive.input4.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input4RefInc)}
          onChangeText={text => handleInputChange('incentive', 'input4', text)}
          onBlur={() =>
            handleBlur(
              'incentive',
              'input4',
              formState.incentive.input4.toString(),
            )
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input5RefInc)}
        />
        <Text style={styles.label}>Incentive # 5</Text>
        <TextInput
          ref={input5RefInc}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.incentive.input5
              ? formState.incentive.input5.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input5RefInc)}
          onChangeText={text => handleInputChange('incentive', 'input5', text)}
          onBlur={() =>
            handleBlur(
              'incentive',
              'input5',
              formState.incentive.input5.toString(),
            )
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input6RefInc)}
        />
        <Text style={styles.label}>Incentive # 6</Text>
        <TextInput
          ref={input6RefInc}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.incentive.input6
              ? formState.incentive.input6.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input6RefInc)}
          onChangeText={text => handleInputChange('incentive', 'input6', text)}
          onBlur={() =>
            handleBlur(
              'incentive',
              'input6',
              formState.incentive.input6.toString(),
            )
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(percentageAvgRefInc)}
        />
        <Text style={styles.label}>Average</Text>
        <View style={styles.calculatedInput}>
          <Text style={{fontSize: 16, fontWeight: '700', color: 'black'}}>
            {formatNumber(formState.incentive.average)}
          </Text>
        </View>
        <Text style={styles.label}>Percentage of average to be considered</Text>
        <TextInput
          ref={percentageAvgRefInc}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            isPercentageAvgIncFocused && formState.incentive.percentageAvg
              ? formState.incentive.percentageAvg.toString()
              : formState.incentive.percentageAvg
              ? `${formState.incentive.percentageAvg}%`
              : ''
          }
          onFocus={e => {
            handleFocus(e, percentageAvgRefInc);
            setIsPercentageAvgIncFocused(true);
          }}
          onBlur={() => {
            handleBlur(
              'incentive',
              'percentageAvg',
              formState.incentive.percentageAvg.toString(),
            );
            setIsPercentageAvgIncFocused(false);
          }}
          onChangeText={text =>
            handleInputChange('incentive', 'percentageAvg', text, true)
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input1RefSA)}
        />
        <Text style={styles.label}>Amount will be added on (MFI)</Text>
        <View style={styles.calculatedInput}>
          <Text style={{fontSize: 16, fontWeight: '700', color: 'black'}}>
            {formatNumber(formState.incentive.addedSalary)}
          </Text>
        </View>
      </>
    );
  };

  const handleSchoolingAllowanceForm = () => {
    return (
      <>
        <Box
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            padding: 10,
          }}>
          <Box
            style={{
              justifyContent: 'center',
              padding: 10,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              height: 50,
            }}>
            <Text style={{fontSize: 20, fontWeight: 'bold', color: 'white'}}>
              Schooling Allowance
            </Text>
          </Box>
        </Box>

        <Text style={styles.label}>Total Yearly Schooling Allowance</Text>
        <TextInput
          ref={input1RefSA}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            formState.schoolingAllowance.yearlyAllowance
              ? formState.schoolingAllowance.yearlyAllowance.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input1RefSA)}
          onChangeText={text =>
            handleInputChange('schoolingAllowance', 'yearlyAllowance', text)
          }
          onBlur={() =>
            handleBlur(
              'schoolingAllowance',
              'yearlyAllowance',
              formState.schoolingAllowance.yearlyAllowance.toString(),
            )
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input2RefSA)}
        />
        <Text style={styles.label}>Percentage to be considered</Text>
        <TextInput
          ref={input2RefSA}
          style={styles.input}
          keyboardType="decimal-pad"
          value={
            isPercentageConsideredFocused &&
            formState.schoolingAllowance.percentageConsidered
              ? formState.schoolingAllowance.percentageConsidered.toString()
              : formState.schoolingAllowance.percentageConsidered
              ? `${formState.schoolingAllowance.percentageConsidered}%`
              : ''
          }
          onFocus={e => {
            handleFocus(e, input2RefSA);
            setIsPercentageConsideredFocused(true);
          }}
          onBlur={() => {
            handleBlur(
              'schoolingAllowance',
              'percentageConsidered',
              formState.schoolingAllowance.percentageConsidered.toString(),
            );
            setIsPercentageConsideredFocused(false);
          }}
          onChangeText={text =>
            handleInputChange(
              'schoolingAllowance',
              'percentageConsidered',
              text,
              true,
            )
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input1RefTA)}
        />
        <Text style={styles.label}>Amount will be added on (MFI)</Text>
        <View style={styles.calculatedInput}>
          <Text style={{fontSize: 16, fontWeight: '700', color: 'black'}}>
            {formatNumber(formState.schoolingAllowance.addedSalary)}
          </Text>
        </View>
      </>
    );
  };

  const handleTicketAllowanceForm = () => {
    return (
      <>
        <Box
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
            padding: 10,
          }}>
          <Box
            style={{
              justifyContent: 'center',
              // width: 160,
              padding: 10,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              height: 50,
            }}>
            <Text style={{fontSize: 20, fontWeight: 'bold', color: 'white'}}>
              Ticket Allowance
            </Text>
          </Box>
        </Box>

        <Text style={styles.label}>Total Yearly Ticket allowance</Text>
        <TextInput
          style={styles.input}
          ref={input1RefTA}
          keyboardType="decimal-pad"
          value={
            formState.ticketAllowance.yearlyAllowance
              ? formState.ticketAllowance.yearlyAllowance.toLocaleString()
              : ''
          }
          onFocus={e => handleFocus(e, input1RefTA)}
          onChangeText={text =>
            handleInputChange('ticketAllowance', 'yearlyAllowance', text)
          }
          onBlur={() =>
            handleBlur(
              'ticketAllowance',
              'yearlyAllowance',
              formState.ticketAllowance.yearlyAllowance.toString(),
            )
          }
          returnKeyType="next"
          onSubmitEditing={() => moveToNextField(input2RefTA)}
        />
        <Text style={styles.label}>Percentage to be considered</Text>
        <TextInput
          style={styles.input}
          ref={input2RefTA}
          keyboardType="decimal-pad"
          value={
            isTicketPercentageFocused &&
            formState.ticketAllowance.percentageConsidered
              ? formState.ticketAllowance.percentageConsidered.toString()
              : formState.ticketAllowance.percentageConsidered
              ? `${formState.ticketAllowance.percentageConsidered}%`
              : ''
          }
          onFocus={e => {
            handleFocus(e, input2RefTA);
            setIsTicketPercentageFocused(true);
          }}
          onBlur={() => {
            handleBlur(
              'ticketAllowance',
              'percentageConsidered',
              formState.ticketAllowance.percentageConsidered.toString(),
            );
            setIsTicketPercentageFocused(false);
          }}
          onChangeText={text =>
            handleInputChange(
              'ticketAllowance',
              'percentageConsidered',
              text,
              true,
            )
          }
          returnKeyType="done"
        />
        <Text style={styles.label}>Amount will be added on (MFI)</Text>
        <View style={styles.calculatedInput}>
          <Text style={{fontSize: 16, fontWeight: '700', color: 'black'}}>
            {formatNumber(formState.ticketAllowance.addedSalary)}
          </Text>
        </View>
      </>
    );
  };

  // Calculate the total
  const calculateTotal = useCallback(() => {
    const total = Object.values(formState).reduce((sum, category) => {
      const numericAddedSalary =
        typeof category.addedSalary === 'string'
          ? parseFloat(category.addedSalary) || 0
          : category.addedSalary || 0;
      return sum + numericAddedSalary;
    }, 0);
    // Store the total in finalValue
    dispatch(layout1Form({...allValuesFromLayout1, additionalIncome: total}));

    navigation.navigate('SegmentScreen', {
      additionalIncome: total,
    });
  }, [formState, allValuesFromLayout1, dispatch, navigation]);

  const handleResetPress = () => {
    setResetModalVisible(true); // Show confirmation modal
  };

  const resetAll = () => {
    setResetModalVisible(false);
    dispatch(resetIncomeDetail());
    dispatch(layout1Form({...allValuesFromLayout1, additionalIncome: 0}));
    setFormState(localInitialState);

    setModalVisible2(true);
    setTimeout(() => setModalVisible2(false), 3000);
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        Platform?.OS === 'android' ? {paddingTop: insets.top} : {},
      ]}>
      <Header
        mainHeadingText={'Income Details'}
        onLeftBtnPress={calculateTotal}
        onRightBtnPress={handleResetPress}
        leftIcon={<SvgXml width="16" height="16" xml={backButton} />}
        rightIcon={<SvgXml width="48" height="48" xml={reset} />}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.select({ios: 60, android: 0})}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled" // Changed from "never"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior="never">
          <View style={{paddingBottom: 25}}>
            {rentalIncomeForm()}
            {handleBonusForm()}
            {handleIncentiveForm()}
            {handleSchoolingAllowanceForm()}
            {handleTicketAllowanceForm()}
            <View
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                // padding: 10,
                paddingTop: 20,
                // bottom: 10,
              }}>
              <TouchableOpacity
                onPress={calculateTotal}
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: 10,
                  width: '100%',
                  //   borderWidth: 1,
                  backgroundColor: '#1d756d',
                  borderRadius: 15,
                }}>
                <Text style={{fontSize: 20, fontWeight: '700', color: 'white'}}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <Modal
          visible={isModalVisible2}
          animationType="slide"
          transparent
          onRequestClose={() => setModalVisible2(false)}>
          <View style={styles.modalOverlay2}>
            <View style={styles.modalContent}>
              <Text style={{color: 'black', fontSize: 20, fontWeight: '500'}}>
                Refreshed
              </Text>
              {/* <Button title="close" onPress={() => setModalVisible(false)} /> */}
            </View>
          </View>
        </Modal>
        <Modal
          visible={isResetModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setResetModalVisible(false)}>
          <View style={styles.resetModalOverlay}>
            <View style={styles.resetModalContainer}>
              <Text style={styles.resetModalTitle}>Confirm Reset</Text>
              <Text style={styles.resetModalText}>
                Are you sure you want to reset all data against Additional
                Income? This action cannot be undone.
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  scrollContainer: {
    paddingBottom: 70,
    flexGrow: 1,
  },
  label: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4}, // Higher height for a subtle downward shadow
    shadowOpacity: 0.5, // Lower opacity for a softer shadow
    shadowRadius: 4, // Adjust radius for softer shadow edges
    elevation: 10, // Adjust elevation to match the shadow effect across platforms
  },
  calculatedInput: {
    backgroundColor: '#94bcb4',
    paddingHorizontal: 8,
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 4,
    marginLeft: 4,
    minWidth: 50,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4}, // Higher height for a subtle downward shadow
    shadowOpacity: 0.5, // Lower opacity for a softer shadow
    shadowRadius: 4, // Adjust radius for softer shadow edges
    elevation: 10, // Adjust elevation to match the shadow effect across platforms
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
});

export default IncomeDetailsScreen;
