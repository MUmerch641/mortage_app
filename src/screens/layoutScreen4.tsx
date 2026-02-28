/* eslint-disable react/self-closing-comp */
/* eslint-disable react-native/no-inline-styles */
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Platform,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  findNodeHandle,
  Keyboard,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { tick } from '../svg';
import Box from '../components/Box';
import { useDispatch, useSelector } from 'react-redux';
import { layout4Form } from '../redux/slices/layout4Slice';
import { RootStackParamList } from '../../navigationTypes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { generateAmortizationSchedule } from '../utils/ammortizationTable';
import { formatValue } from '../utils/helpers';
import Footer from '../components/Footer';
import { EligibilityFormState, MainScreenProps } from '../utils/types';
import { MAX_TENURE_MONTHS } from '../utils/mortgageConstants';

type PropertyValueScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PropertyValue'
>;

const LayoutScreen4: React.FC<MainScreenProps> = ({
  navigateToTab,
  currentTab,
  totalTabs,
}) => {
  const dispatch = useDispatch();

  const navigation = useNavigation<PropertyValueScreenNavigationProp>();

  const allValuesFromLayout1 = useSelector((state: any) => state.layout1);
  const allValuesFromLayout2 = useSelector((state: any) => state.layout2);
  const allValuesFromLayout3 = useSelector((state: any) => state.layout3);
  const allValuesFromLayout4 = useSelector((state: any) => state.layout4);
  const allValuesFromPropertyValue = useSelector(
    (state: any) => state.propertyValue,
  );

  // Extract necessary values from the Redux store
  const { newPropertyValue, newFinanceAmount } = allValuesFromPropertyValue || {};
  const income = allValuesFromLayout1?.income || 0;
  const additionalIncome = allValuesFromLayout1?.additionalIncome || 0;
  const dbr = allValuesFromLayout1?.dbr || 0;
  const dob = allValuesFromLayout1?.dob || '';
  const ageAtMaturity = allValuesFromLayout1?.ageAtMaturity || 0;
  const bufferPeriod = allValuesFromLayout1?.bufferPeriod || 0;
  const interestType = allValuesFromLayout3?.interestType || '';
  const fixedInterestRate = allValuesFromLayout3?.fixedInterestRate || 0;
  const variableInterestRate = allValuesFromLayout3?.variableInterestRate || 0;
  const lifeInsuranceRate = allValuesFromLayout3?.lifeInsuranceRate || 0;
  const propertyInsuranceRate = allValuesFromLayout3.propertyInsuranceRate || 0;
  const IBOR = allValuesFromLayout3?.IBOR || 0;
  const fixedYears = allValuesFromLayout3?.numOfFixedYear || 0;
  const calculatedNewDBR = allValuesFromLayout4?.newDBR || 0;

  const [maxTenure, setMaxTenure] = useState<number | string>(0);
  const [isChecked, setIsChecked] = useState(
    newPropertyValue > 0 && newFinanceAmount > 0,
  );
  const [displayValue, setDisplayValue] = useState('');
  const [maxTenorFormat, setMaxTenorFormat] = useState('0');
  const [convertToYears, setConvertToYears] = useState(false);
  const [maxValuePurchasedLtv, setMaxValuePurchasedLtv] =
    useState<string>('0.00');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [financeEligibility, setFinanceEligibility] = useState<number | string>(
    0,
  );
  const [keyboardVisible, setKeyboardVisible] = useState<boolean>(false);
  const [rawTenureValue, setRawTenureValue] = useState<string>('');
  const parseNumericValue = useCallback((value: number | string) => {
    if (typeof value === 'string') {
      const cleaned = value.replace(/,/g, '');
      return cleaned === '' ? 0 : parseFloat(cleaned) || 0;
    }
    return value || 0;
  }, []);

  const [form, setForm] = useState({
    LTV:
      typeof allValuesFromLayout4?.LTV === 'string'
        ? parseFloat(allValuesFromLayout4.LTV.replace(/%/g, '')) || 0
        : allValuesFromLayout4?.LTV || 0,
    totalTenureMonth:
      Math.min(
        typeof allValuesFromLayout4?.totalTenureMonth === 'string'
          ? parseFloat(
            allValuesFromLayout4.totalTenureMonth.replace(/,/g, ''),
          ) || 0
          : allValuesFromLayout4?.totalTenureMonth || 0,
        MAX_TENURE_MONTHS,
      ),
    financeAmount:
      typeof allValuesFromLayout4?.financeAmount === 'string'
        ? parseFloat(allValuesFromLayout4.financeAmount.replace(/,/g, '')) || 0
        : allValuesFromLayout4?.financeAmount || 0,
    propertyValue:
      typeof allValuesFromLayout4?.propertyValue === 'string'
        ? parseFloat(allValuesFromLayout4.propertyValue.replace(/,/g, '')) || 0
        : allValuesFromLayout4?.propertyValue || 0,
  });

  const rawInputRef = useRef<{ [key: string]: string }>({
    LTV: '',
    totalTenureMonth: '',
    financeAmount: '',
    propertyValue: '',
  });

  const rows = useMemo(() => {
    const finance =
      isChecked && newFinanceAmount
        ? parseFloat(newFinanceAmount)
        : parseNumericValue(form.financeAmount);
    const tenureMonths = Math.min(
      parseNumericValue(form.totalTenureMonth),
      MAX_TENURE_MONTHS,
    );
    const property =
      isChecked && newPropertyValue
        ? parseFloat(newPropertyValue)
        : parseNumericValue(form.propertyValue);

    return generateAmortizationSchedule({
      loanAmount: finance,
      tenureMonths,
      fixedInterestRate: parseFloat(fixedInterestRate),
      variableInterestRate: parseFloat(variableInterestRate + IBOR),
      propertyValue: property,
      numOfFixedYear: parseFloat(fixedYears),
      lifeInsuranceRate: parseFloat(lifeInsuranceRate),
      propertyInsuranceRate: parseFloat(propertyInsuranceRate),
    });
  }, [
    isChecked,
    newFinanceAmount,
    newPropertyValue,
    form.financeAmount,
    form.totalTenureMonth,
    fixedInterestRate,
    variableInterestRate,
    form.propertyValue,
    fixedYears,
    lifeInsuranceRate,
    propertyInsuranceRate,
    parseNumericValue,
  ]);

  // Memoize the data that depends on the amortization schedule
  const data = useMemo(() => {
    const loanAmount =
      isChecked && newFinanceAmount
        ? parseFloat(newFinanceAmount)
        : parseNumericValue(form.financeAmount);
    // 1. Fixed Period installment (including insurance)
    const fixedPeriodInstallmentWithInsurance =
      parseFloat(rows[0]?.grandTotal.replace(/,/g, '')) || 0.0;
    // 2. Variable period Installment (including insurance)
    // For example, if fixed years are 3 (36 months), get the 37th month (index 36)
    const variablePeriodInstallmentWithInsurance =
      parseFloat(rows[fixedYears * 12]?.grandTotal.replace(/,/g, '')) || 0.0;
    // 3. Total Interest (including insurance)
    const totalPaymentWithInsurance = rows?.reduce(
      (sum, row) => sum + parseFloat(row.grandTotal.replace(/,/g, '')),
      0,
    );
    // - (isChecked ? newFinanceAmount : form.financeAmount)) || 0.0;
    // 4. Fixed period installment (excluding insurance)
    const fixedPeriodInstallmentWithoutInsurance =
      parseFloat(rows[0]?.payment.replace(/,/g, '')) || 0.0;
    // 5. Variable period Installment (excluding insurance)
    const variablePeriodInstallmentWithoutInsurance =
      parseFloat(rows[fixedYears * 12]?.payment.replace(/,/g, '')) || 0.0;
    // 6. Total Interest (excluding insurance)
    const totalPaymentWithoutInsurance = rows?.reduce(
      (sum, row) => sum + parseFloat(row.payment.replace(/,/g, '')),
      0,
    );

    return [
      {
        label: 'Fixed monthly inst. (Incl. ins):',
        value:
          interestType === 'Fixed'
            ? formatValue(fixedPeriodInstallmentWithInsurance)
            : 'Not Eligible',
      },
      {
        label: 'Variable monthly inst. (Incl. ins):',
        value: formatValue(variablePeriodInstallmentWithInsurance),
      },
      {
        label: 'Total Interest (Incl. ins):',
        value: formatValue(totalPaymentWithInsurance - loanAmount),
      },
      {
        label: 'Fixed monthly inst. (Excl. ins):',
        value: formatValue(fixedPeriodInstallmentWithoutInsurance),
      },
      {
        label: 'Variable monthly inst. (Excl. ins):',
        value: formatValue(variablePeriodInstallmentWithoutInsurance),
      },
      {
        label: 'Total Interest (Excl. ins):',
        value: formatValue(totalPaymentWithoutInsurance - loanAmount),
      },
    ];
  }, [
    rows,
    isChecked,
    newFinanceAmount,
    form.financeAmount,
    fixedYears,
    interestType,
    parseNumericValue,
  ]);

  const newData = useMemo(
    () => [
      {
        label: 'Finance Amount (Based on variable int. rate)',
        value:
          typeof financeEligibility === 'number'
            ? formatValue(financeEligibility)
            : financeEligibility,
      },
      {
        label: 'Tenure (Months)',
        value: maxTenure,
      },
      {
        label: 'Tenure (YY/MM)',
        value: maxTenorFormat,
      },
    ],
    [financeEligibility, maxTenure, maxTenorFormat],
  );

  const ltvData = useMemo(
    () => ({
      label: 'Purchasable property price based on LTV & Loan eligibility',
      value:
        typeof maxValuePurchasedLtv === 'number'
          ? formatValue(maxValuePurchasedLtv, 0)
          : maxValuePurchasedLtv,
    }),
    [maxValuePurchasedLtv],
  );

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRefs = {
    LTV: useRef<TextInput>(null),
    totalTenureMonth: useRef<TextInput>(null),
    financeAmount: useRef<TextInput>(null),
    propertyValue: useRef<TextInput>(null),
  };

  const toggleConversion = useCallback(() => {
    saveFieldToRedux('totalTenureMonth');
    // Get the current value (use raw value if field is focused, otherwise use form value)
    const currentValue =
      focusedInput === 'totalTenureMonth'
        ? parseFloat(rawTenureValue.replace(/,/g, '')) || 0
        : typeof form.totalTenureMonth === 'string'
          ? parseFloat(String(form.totalTenureMonth).replace(/,/g, '')) || 0
          : form.totalTenureMonth;
    const cappedValue = Math.min(currentValue, MAX_TENURE_MONTHS);

    if (!convertToYears) {
      // Convert to years immediately
      const years = Math.floor(cappedValue / 12);
      const remainingMonths = cappedValue % 12;
      setDisplayValue(
        `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} months`,
      );
    } else {
      // When switching back to months input, ensure we show the numeric value
      setForm(prev => ({
        ...prev,
        totalTenureMonth: cappedValue,
      }));
    }

    setConvertToYears(!convertToYears);
    dispatch(layout4Form({ ...form, totalTenureMonth: cappedValue }));
  }, [convertToYears, focusedInput, form, rawTenureValue]);

  // Function to calculate the result based on the provided values
  const calculateMaxEligibility = useCallback(() => {
    // 1. Caculating maximum Tenure Eligibility
    // a. Replicate EDATE: Add (ageAtMaturity * 12) months to the birthdate
    const [day, month, year] = dob.split('/').map(Number);
    const dobDate = new Date(year, month - 1, day); // Months are 0-indexed
    const futureDate = new Date(dobDate);
    futureDate.setMonth(dobDate.getMonth() + ageAtMaturity * 12);
    // b. Replicate DATEDIF: Calculate months between today and futureDate
    const today = new Date();
    let monthsDiff = (futureDate.getFullYear() - today.getFullYear()) * 12;
    monthsDiff += futureDate.getMonth() - today.getMonth();

    // Adjust if futureDate's day is earlier than today's day (e.g., futureDate=March 1, today=March 15)
    if (futureDate.getDate() < today.getDate()) {
      monthsDiff--;
    }

    // c. Apply buffer period (subtract 6 months)
    const maxTenureEligibility = monthsDiff - bufferPeriod;
    const cappedMaxTenureEligibility = Math.min(
      maxTenureEligibility,
      MAX_TENURE_MONTHS,
    );

    // Format the result
    if (cappedMaxTenureEligibility > 0) {
      const years = Math.floor(cappedMaxTenureEligibility / 12);
      const months = Math.floor(cappedMaxTenureEligibility % 12);
      const formattedValue = formatValue(cappedMaxTenureEligibility);
      setMaxTenure(formattedValue);
      setMaxTenorFormat(`${years} Years ${months} Months`);
    } else {
      setMaxTenure('Age Limitation');
      setMaxTenorFormat('0 Years 0 Months');
    }

    // 2. Calculate the monthly fixed interest rate
    const fixedRate = parseFloat(fixedInterestRate);
    const variableRate = parseFloat(variableInterestRate);
    const iborRate = parseFloat(IBOR);
    const totalIncome = income + additionalIncome;
    const dbrPercent = parseFloat(dbr as string);
    const totalMonthlyInstallments =
      allValuesFromLayout2.monthlyInstallment1 +
      allValuesFromLayout2.monthlyInstallment2 +
      allValuesFromLayout2.monthlyInstallment3 +
      allValuesFromLayout2.monthlyInstallment4 +
      allValuesFromLayout2.monthlyInstallment5 +
      allValuesFromLayout2.monthlyInstallment6;
    const totalCreditCardLimits =
      allValuesFromLayout2.creditCardLimit1 +
      allValuesFromLayout2.creditCardLimit2 +
      allValuesFromLayout2.creditCardLimit3 +
      allValuesFromLayout2.creditCardLimit4 +
      allValuesFromLayout2.creditCardLimit5 +
      allValuesFromLayout2.creditCardLimit6;
    const percentLiability = allValuesFromLayout2.percentLiability / 100;
    const monthlyPayment =
      (dbrPercent / 100) * totalIncome -
      (totalMonthlyInstallments + totalCreditCardLimits * percentLiability);
    const monthlyInterestRate = (variableRate + iborRate) / 12 / 100;
    // const monthlyInterestRate = interestType === 'Fixed' ? fixedRate / 12 / 100 : (variableRate + iborRate) / 12 / 100;
    // log all above values

    if (!income || !dbrPercent || !bufferPeriod || !ageAtMaturity || !dob) {
      setFinanceEligibility('Missing Input');
      return;
    } else if (
      isNaN(monthlyInterestRate) ||
      isNaN(cappedMaxTenureEligibility) ||
      isNaN(monthlyPayment) ||
      monthlyInterestRate === 0
    ) {
      setFinanceEligibility('Not Eligible');
      return;
    }
    // PV = -PMT × ((1 - (1 + r)^-n) / r)
    const pv =
      monthlyPayment *
      ((1 - Math.pow(1 + monthlyInterestRate, -cappedMaxTenureEligibility)) /
        monthlyInterestRate);

    // Handle eligibility properly
    if (pv < 1 || isNaN(pv)) {
      setFinanceEligibility('Not Eligible');
    } else {
      setFinanceEligibility(pv); // Store as number
    }
  }, [
    dob,
    ageAtMaturity,
    bufferPeriod,
    fixedInterestRate,
    variableInterestRate,
    IBOR,
    income,
    additionalIncome,
    allValuesFromLayout1?.dbr,
    allValuesFromLayout2,
    interestType,
  ]);

  const calculateNewDBR = useCallback(() => {
    // Calculation of New DBR value needs to be added here.
    const isFixed = interestType === 'Fixed' ? true : false;
    const totalIncome = income + additionalIncome;
    const totalMonthlyInstallments =
      allValuesFromLayout2.monthlyInstallment1 +
      allValuesFromLayout2.monthlyInstallment2 +
      allValuesFromLayout2.monthlyInstallment3 +
      allValuesFromLayout2.monthlyInstallment4 +
      allValuesFromLayout2.monthlyInstallment5 +
      allValuesFromLayout2.monthlyInstallment6;
    const totalCreditCardLimits =
      allValuesFromLayout2.creditCardLimit1 +
      allValuesFromLayout2.creditCardLimit2 +
      allValuesFromLayout2.creditCardLimit3 +
      allValuesFromLayout2.creditCardLimit4 +
      allValuesFromLayout2.creditCardLimit5 +
      allValuesFromLayout2.creditCardLimit6;
    const percentLiability = allValuesFromLayout2.percentLiability / 100;
    // const fixedPeriodInstallment = parseFloat(data[3]?.value.replace(/,/g, ''));
    const variablePeriodInstallment = parseFloat(
      data[4]?.value.replace(/,/g, ''),
    );
    try {
      const newDBR =
        (isChecked && newFinanceAmount && newPropertyValue) || !isChecked
          ? (totalMonthlyInstallments +
            totalCreditCardLimits * percentLiability +
            variablePeriodInstallment) /
          totalIncome
          : 0;
      dispatch(
        layout4Form({
          ...form,
          newDBR: (newDBR * 100).toFixed(2), // Store as percentage
        }),
      ); // Save new DBR to Redux store
    } catch (error) {
      dispatch(layout4Form({ ...form, newDBR: 0 }));
    }
  }, [
    interestType,
    income,
    additionalIncome,
    allValuesFromLayout2,
    data,
    form,
  ]);

  useEffect(() => {
    if (allValuesFromLayout4) {
      const rawMonths =
        typeof allValuesFromLayout4.totalTenureMonth === 'string'
          ? parseFloat(
            allValuesFromLayout4.totalTenureMonth.replace(/,/g, ''),
          ) || 0
          : allValuesFromLayout4.totalTenureMonth || 0;
      const months = Math.min(rawMonths, MAX_TENURE_MONTHS);
      if (rawMonths > MAX_TENURE_MONTHS) {
        setForm(prev => ({ ...prev, totalTenureMonth: months }));
        dispatch(layout4Form({ ...allValuesFromLayout4, totalTenureMonth: months }));
      }
      if (!isNaN(months)) {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12; // Keep 2 decimal places
        setDisplayValue(
          `${years} ${years === 1 ? 'year' : 'years'
          } ${remainingMonths} months`,
        );
      } else {
        setDisplayValue('0 years 0 months');
      }

      const numericLTV =
        typeof allValuesFromLayout4.LTV === 'string'
          ? parseFloat(allValuesFromLayout4.LTV.replace(/%/g, '')) || 0
          : allValuesFromLayout4.LTV || 0;
      if (
        !isNaN(numericLTV) &&
        numericLTV !== 0 &&
        financeEligibility !== 'Not Eligible' &&
        typeof financeEligibility === 'number' &&
        financeEligibility > 0
      ) {
        const maxValuePurchased = (financeEligibility / numericLTV) * 100;
        setMaxValuePurchasedLtv(
          maxValuePurchased.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          }),
        );
      } else {
        setMaxValuePurchasedLtv('0');
      }
    }
  }, [allValuesFromLayout4, allValuesFromPropertyValue]);

  useEffect(() => {
    calculateMaxEligibility();
    if (
      form.totalTenureMonth &&
      (form.financeAmount || newFinanceAmount) &&
      (form.propertyValue || newPropertyValue)
    ) {
      calculateNewDBR();
    }
  }, [
    isChecked,
    calculateMaxEligibility,
    calculateNewDBR,
    form,
    newFinanceAmount,
    newPropertyValue,
  ]);

  useEffect(() => {
    setIsChecked(newPropertyValue > 0 && newFinanceAmount > 0);
  }, [newPropertyValue, newFinanceAmount]);

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
        setFocusedInput(null); // Clear focused field when keyboard hides
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleFocus = useCallback(
    (
      event: NativeSyntheticEvent<TextInputFocusEventData>,
      ref: React.RefObject<TextInput | null>,
      field: string,
    ) => {
      setFocusedInput(field);
      if (scrollViewRef.current && ref.current) {
        ref.current.measure((x, y, width, height, pageX, pageY) => {
          if (
            scrollViewRef.current?.scrollResponderScrollNativeHandleToKeyboard
          ) {
            scrollViewRef.current.scrollResponderScrollNativeHandleToKeyboard(
              findNodeHandle(ref.current),
              // Additional padding above the keyboard
              470, // extraHeight (adjust as needed)
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
    },
    [],
  );

  const handleChange = useCallback(
    (field: keyof EligibilityFormState, value: string) => {
      let sanitizedValue = value.trim();
      if (field === 'LTV') {
        sanitizedValue = sanitizedValue.replace(/[^0-9.]/g, '');
        if (sanitizedValue.startsWith('.'))
          sanitizedValue = '0' + sanitizedValue;
      } else {
        if (field === 'totalTenureMonth') {
          // Handle empty case specifically
          if (value === '') {
            setRawTenureValue('');
            setForm(prevState => ({
              ...prevState,
              [field]: 0, // or '' depending on your needs
            }));
            rawInputRef.current[field] = '';
            return;
          }

          // Only proceed with formatting if there's actual content
          sanitizedValue = value.replace(/[^0-9.,]/g, '');
          const numericValue = sanitizedValue.replace(/,/g, '');

          if (numericValue === '') {
            setRawTenureValue('');
            setForm(prevState => ({
              ...prevState,
              [field]: 0,
            }));
            rawInputRef.current[field] = '';
            return;
          }

          const cappedValue = Math.min(
            parseFloat(numericValue) || 0,
            MAX_TENURE_MONTHS,
          );

          // Format the number with commas
          let formattedValue;
          if (numericValue.includes('.')) {
            const [integerPart, decimalPart] = cappedValue
              .toString()
              .split('.');
            const formattedInteger = Number(integerPart).toLocaleString();
            formattedValue = `${formattedInteger}.${decimalPart}`;
          } else {
            formattedValue = Number(cappedValue).toLocaleString();
          }

          setRawTenureValue(formattedValue);
          rawInputRef.current[field] = formattedValue;
          setForm(prevState => ({
            ...prevState,
            [field]: cappedValue,
          }));
          return;
        }
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
      rawInputRef.current[field] = sanitizedValue;
      setForm(prevState => ({
        ...prevState,
        [field]: sanitizedValue,
      }));
    },
    [],
  );

  const handleBlur = useCallback(
    (field: keyof typeof form, value: string) => {
      setFocusedInput(null);
      // Use the ref value which is always up-to-date
      const rawValue = rawInputRef.current[field] || form[field].toString();
      let numericValue;

      if (field === 'LTV') {
        // For LTV, remove '%' and parse as number
        numericValue = parseFloat(rawValue.replace(/%/g, '')) || 0;
      } else {
        numericValue = parseFloat(rawValue.replace(/,/g, '')) || 0;
      }
      if (field === 'totalTenureMonth') {
        numericValue = Math.min(numericValue, MAX_TENURE_MONTHS);
        const formattedValue = Number(numericValue).toLocaleString();
        rawInputRef.current[field] = formattedValue;
        setRawTenureValue(formattedValue);
      }
      // If it's propertyValue field and checkbox is checked, keep the existing value
      if (field === 'propertyValue' && isChecked) {
        numericValue =
          typeof form.propertyValue === 'string'
            ? parseFloat(form.propertyValue.replace(/,/g, '')) || 0
            : form.propertyValue;
      }

      const updatedForm = {
        ...form,
        [field]: numericValue,
      };
      setForm(updatedForm);
      dispatch(layout4Form(updatedForm)); // Save to Redux immediately
      saveFieldToRedux(field);
      // If in years mode, update the display
      if (field === 'totalTenureMonth' && convertToYears) {
        const years = Math.floor(numericValue / 12);
        const remainingMonths = numericValue % 12;
        setDisplayValue(
          `${years} ${years === 1 ? 'year' : 'years'
          } ${remainingMonths} months`,
        );
      }

      // Clear raw input value if field is empty
      if (rawValue === '' || numericValue === 0) {
        rawInputRef.current[field] = '';
        if (field === 'totalTenureMonth') {
          setRawTenureValue('');
        }
      }
    },
    [convertToYears, form, isChecked],
  );

  const saveFieldToRedux = useCallback(
    (field: string) => {
      const updatedForm = {
        ...form,
        LTV:
          typeof form.LTV === 'string'
            ? parseFloat(form.LTV.replace(/%/g, '')) || 0
            : form.LTV,
        totalTenureMonth:
          Math.min(
            typeof form.totalTenureMonth === 'string'
              ? parseFloat(String(form.totalTenureMonth).replace(/,/g, '')) || 0
              : form.totalTenureMonth,
            MAX_TENURE_MONTHS,
          ),
        financeAmount:
          typeof form.financeAmount === 'string'
            ? parseFloat(form.financeAmount.replace(/,/g, '')) || 0
            : form.financeAmount,
        propertyValue:
          typeof form.propertyValue === 'string'
            ? parseFloat(form.propertyValue.replace(/,/g, '')) || 0
            : form.propertyValue,
      };
      // LTV logic
      if (field === 'LTV') {
        const numericLTV = updatedForm.LTV;
        if (
          numericLTV > 0 &&
          financeEligibility !== 'Not Eligible' &&
          typeof financeEligibility === 'number' &&
          financeEligibility > 0
        ) {
          const maxValuePurchased = (financeEligibility / numericLTV) * 100;
          setMaxValuePurchasedLtv(
            maxValuePurchased.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }),
          );
        } else {
          setMaxValuePurchasedLtv('0');
        }
      }

      if (field === 'totalTenureMonth') {
        const months = updatedForm.totalTenureMonth;
        if (!isNaN(months)) {
          const years = Math.floor(months / 12);
          const remainingMonths = months % 12; // Keep 2 decimal places
          setDisplayValue(
            `${years} ${years === 1 ? 'year' : 'years'
            } ${remainingMonths} months`,
          );
        } else {
          setDisplayValue('0 years 0 months');
        }
      }
      // Save to Redux
      dispatch(layout4Form(updatedForm));

      // Calculate new DBR if needed
      if (
        (updatedForm.totalTenureMonth &&
          (updatedForm.financeAmount || newFinanceAmount) &&
          updatedForm.propertyValue) ||
        newPropertyValue
      ) {
        calculateNewDBR();
      } else {
        dispatch(layout4Form({ ...updatedForm, newDBR: 0 }));
      }
    },
    [
      form,
      financeEligibility,
      newFinanceAmount,
      newPropertyValue,
      calculateNewDBR,
    ],
  );
  // Remove old handleInputSubmit and use this instead
  const handleFieldSubmit = useCallback(
    (field: string) => {
      saveFieldToRedux(field);
      // Move to next field if needed
      switch (field) {
        case 'LTV':
          moveToNextField('totalTenureMonth');
          break;
        case 'totalTenureMonth':
          moveToNextField('financeAmount');
          break;
        case 'financeAmount':
          moveToNextField('propertyValue');
          break;
      }
    },
    [saveFieldToRedux],
  );

  const moveToNextField = useCallback((nextField: keyof typeof inputRefs) => {
    const nextInput = inputRefs[nextField];
    if (nextInput && nextInput.current) {
      nextInput.current.focus();
    }
  }, []);

  const formatDisplayValue = useCallback(
    (field: string, value: number | string) => {
      const numericValue =
        typeof value === 'string'
          ? parseFloat(value.replace(/,/g, '')) || 0
          : value || 0;
      if (field === 'LTV') {
        if (focusedInput === field && keyboardVisible) {
          if (typeof value === 'string') {
            return value;
          }
          return numericValue === 0 ? '' : numericValue.toString();
        }
        return numericValue === 0 ? '' : `${numericValue}%`;
      }
      return numericValue === 0 ? '' : numericValue.toLocaleString();
    },
    [focusedInput, keyboardVisible],
  );

  // Update the Property Value input section to maintain consistent width
  const renderPropertyValueInput = useCallback(() => {
    if (isChecked) {
      return (
        <TouchableOpacity
          style={[
            styles.calculatedInput,
            {
              flex: 1,
              marginRight: 10,
              backgroundColor: newPropertyValue ? '#1d756d' : '#fff',
            },
          ]} // Full width
          onPress={() => {
            navigation.navigate('PropertyValue', {
              ltv: form.LTV,
            });
          }}>
          <Text
            style={{
              fontSize: 14,
              color: newPropertyValue ? '#fff' : '#1d756d',
              fontWeight: newPropertyValue ? 'bold' : '500',
            }}>
            {newPropertyValue
              ? newPropertyValue.toLocaleString()
              : 'Tap to add Registration and brokerage fee'}
          </Text>
        </TouchableOpacity>
      );
    } else {
      return (
        <TextInput
          style={[
            styles.input,
            { flex: 1, marginRight: 10 },
            focusedInput === 'propertyValue' && styles.inputFocused,
          ]}
          ref={inputRefs.propertyValue}
          keyboardType="decimal-pad"
          placeholder="Enter property value"
          value={formatDisplayValue('propertyValue', form.propertyValue)}
          editable={!isChecked}
          onFocus={e =>
            handleFocus(e, inputRefs.propertyValue, 'propertyValue')
          }
          onBlur={() =>
            handleBlur('propertyValue', form.propertyValue.toString())
          }
          onChangeText={text => handleChange('propertyValue', text)}
          returnKeyType="done"
        />
      );
    }
  }, [
    isChecked,
    newPropertyValue,
    form,
    focusedInput,
    formatDisplayValue,
    handleFocus,
    handleBlur,
    handleChange,
  ]);

  const financeValueForDownPayment =
    isChecked && newFinanceAmount
      ? Number(newFinanceAmount)
      : parseNumericValue(form.financeAmount);
  const propertyValueForDownPayment =
    isChecked && newPropertyValue
      ? Number(newPropertyValue)
      : parseNumericValue(form.propertyValue);
  const downPaymentValue =
    propertyValueForDownPayment && financeValueForDownPayment
      ? (propertyValueForDownPayment - financeValueForDownPayment).toLocaleString()
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}></View>
          <Box
            style={{
              justifyContent: 'center',
              width: '62%',
              padding: 10,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              height: 50,
            }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffff' }}>
              Maximum Eligibility
            </Text>
          </Box>
          <Box
            style={{
              borderWidth: 1,
              padding: 10,
              borderColor: 'grey',
              borderRadius: 10,
              marginTop: 15,
            }}>
            {newData.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  paddingTop: 15,
                }}>
                {/* Label Text with Truncation */}
                <Text style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>
                  {item.label}
                </Text>

                {/* Value with background on the right */}
                <View
                  style={{
                    backgroundColor: '#94bcb4',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                    marginLeft: 4,
                    minWidth: 50, // Fixed width to align values in a column
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{ fontSize: 17, fontWeight: '700', color: 'black' }}>
                    {item.value ?? '0.00'}
                  </Text>
                </View>
              </View>
            ))}
          </Box>
          <Box
            style={{
              justifyContent: 'center',
              width: '62%',
              top: 7,
              padding: 10,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              height: 50,
            }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffff' }}>
              Loan to value (LTV)
            </Text>
          </Box>
          <Box
            style={{
              borderWidth: 1,
              padding: 10,
              borderColor: 'grey',
              borderRadius: 10,
              marginTop: 15,
            }}>
            <Text style={styles.label}>Loan to value (LTV)</Text>

            <TextInput
              style={[
                styles.input,
                focusedInput === 'LTV' && styles.inputFocused,
              ]}
              ref={inputRefs.LTV}
              keyboardType="decimal-pad"
              value={formatDisplayValue('LTV', form.LTV)}
              onFocus={e => handleFocus(e, inputRefs.LTV, 'LTV')}
              onBlur={() => handleBlur('LTV', form.LTV.toString())}
              onChangeText={text => handleChange('LTV', text)}
              returnKeyType="next"
              onSubmitEditing={() => handleFieldSubmit('LTV')}
            />

            <View
              style={{
                justifyContent: 'center',
                marginBottom: 10,
                paddingTop: 15,
              }}>
              <Text style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>
                {ltvData.label}
              </Text>
              <View
                style={{
                  backgroundColor: '#94bcb4',
                  paddingHorizontal: 8,
                  marginTop: 10,
                  paddingVertical: 4,
                  borderRadius: 4,
                  marginLeft: 4,
                  minWidth: 50,
                  alignItems: 'center',
                }}>
                <Text style={{ fontSize: 17, fontWeight: '700', color: 'black' }}>
                  {ltvData.value}
                </Text>
              </View>
            </View>
          </Box>

          <Box
            style={{
              justifyContent: 'center',
              width: 220,
              padding: 15,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              height: 55,
              marginTop: 20,
            }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffff' }}>
              Customer Request:
            </Text>
          </Box>
          <Box
            style={{
              borderWidth: 1,
              padding: 10,
              borderColor: 'grey',
              borderRadius: 10,
              marginTop: 15,
            }}>
            <Text style={styles.label}>Total Tenure(months)</Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              {!convertToYears ? (
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, marginRight: 20 },
                    focusedInput === 'totalTenureMonth' && styles.inputFocused,
                  ]}
                  ref={inputRefs.totalTenureMonth}
                  keyboardType="decimal-pad"
                  value={
                    convertToYears
                      ? displayValue
                      : focusedInput === 'totalTenureMonth'
                        ? rawTenureValue
                        : form.totalTenureMonth && form.totalTenureMonth !== 0
                          ? form.totalTenureMonth.toLocaleString()
                          : ''
                  }
                  onFocus={e => {
                    setRawTenureValue(
                      form.totalTenureMonth && form.totalTenureMonth !== 0
                        ? form.totalTenureMonth.toString()
                        : '',
                    );
                    handleFocus(
                      e,
                      inputRefs.totalTenureMonth,
                      'totalTenureMonth',
                    );
                  }}
                  onBlur={() => {
                    const finalValue =
                      rawTenureValue === ''
                        ? 0
                        : parseFloat(rawTenureValue.replace(/,/g, '')) || 0;
                    handleBlur('totalTenureMonth', finalValue.toString());
                  }}
                  onChangeText={text => handleChange('totalTenureMonth', text)}
                  returnKeyType="next"
                  onSubmitEditing={() => handleFieldSubmit('totalTenureMonth')}
                  editable={!convertToYears}
                />
              ) : (
                <View
                  style={{
                    flex: 1,
                    backgroundColor: '#94bcb4',
                    marginTop: 10,
                    marginRight: 20,
                    padding: 10,
                    borderRadius: 4,
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{ fontSize: 14, fontWeight: '700', color: 'black' }}>
                    {displayValue}
                  </Text>
                </View>
              )}
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  bottom: 8,
                }}>
                <Text style={{ paddingLeft: 7 }}>Years</Text>
                <TouchableOpacity onPress={toggleConversion}>
                  <Box style={styles.checkboxContainer}>
                    {convertToYears ? (
                      <SvgXml xml={tick} width={24} height={24} />
                    ) : (
                      <View style={styles.emptyCheckbox} />
                    )}
                  </Box>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.label}>
              {isChecked ? 'New Finance Amount' : 'Finance Amount'}
            </Text>
            {!isChecked ? (
              <TextInput
                style={[
                  styles.input,
                  focusedInput === 'financeAmount' && styles.inputFocused,
                ]}
                ref={inputRefs.financeAmount}
                keyboardType="decimal-pad"
                value={
                  form.financeAmount ? form.financeAmount.toLocaleString() : ''
                }
                onFocus={e =>
                  handleFocus(e, inputRefs.financeAmount, 'financeAmount')
                }
                onBlur={() =>
                  handleBlur('financeAmount', form.financeAmount.toString())
                }
                onChangeText={text => handleChange('financeAmount', text)}
                returnKeyType="next"
                onSubmitEditing={() => handleFieldSubmit('financeAmount')}
              />
            ) : (
              <View
                style={{
                  flex: 1,
                  backgroundColor: '#94bcb4',
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 4,
                  alignItems: 'center',
                }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: 'black' }}>
                  {newFinanceAmount > 0
                    ? newFinanceAmount.toLocaleString()
                    : '0.00'}
                </Text>
              </View>
            )}
            <Text style={styles.label}>
              {isChecked ? 'New Property Value' : 'Property Value'}
            </Text>
            <Box style={{ borderWidth: 0 }}>
              <Box
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderWidth: 0,
                }}>
                {/* This will now maintain full width */}
                <View style={{ flex: 1, marginRight: 10 }}>
                  {renderPropertyValueInput()}
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setIsChecked(!isChecked);
                    // handleBlur('propertyValue', form.propertyValue.toString())
                  }}>
                  <Box style={styles.checkboxContainer}>
                    {isChecked ? (
                      <SvgXml xml={tick} width={24} height={24} />
                    ) : (
                      <View style={styles.emptyCheckbox} />
                    )}
                  </Box>
                </TouchableOpacity>
              </Box>

              {/* Display New DBR Result */}
              {/* {!isNaN(calculatedNewDBR) && calculatedNewDBR ? ( */}
              <Text
                style={{
                  color: '#1d756d',
                  padding: 5,
                  marginVertical: 10,
                  fontWeight: '900',
                  fontSize: 16,
                }}>
                New DBR is{' '}
                {!isNaN(calculatedNewDBR) && calculatedNewDBR
                  ? calculatedNewDBR
                  : 0}
                %
              </Text>
              <Text
                style={{
                  color: '#1d756d',
                  padding: 5,
                  marginVertical: 10,
                  fontWeight: '900',
                  fontSize: 16,
                }}>
                Down payment {downPaymentValue}
              </Text>
              {/* ) : (
                <Text style={{ color: 'red', padding: 5, marginVertical: 10, fontWeight: '600', fontSize: 16 }}>New DBR (%) would be calculated as soon as you fill up all the necessary fields.</Text>
              )} */}
            </Box>
          </Box>

          <Box
            style={{
              justifyContent: 'center',
              width: 160,
              padding: 13,
              backgroundColor: '#1d756d',
              borderRadius: 10,
              alignItems: 'center',
              height: 50,
              marginTop: 20,
            }}>
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#ffff' }}>
              Installments
            </Text>
          </Box>
          <Box
            style={{
              borderWidth: 1,
              padding: 10,
              borderColor: 'grey',
              borderRadius: 10,
              marginTop: 15,
            }}>
            {data.map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  paddingTop: 15,
                }}>
                {/* Label Text with Truncation */}
                <Text style={{ flex: 1, fontSize: 16, fontWeight: 700 }}>
                  {item.label}
                </Text>

                {/* Value with background on the right */}
                <View
                  style={{
                    backgroundColor: '#94bcb4',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 4,
                    marginLeft: 4,
                    minWidth: 50, // Fixed width to align values in a column
                    alignItems: 'center',
                  }}>
                  <Text
                    style={{ fontSize: 17, fontWeight: '700', color: 'black' }}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </Box>
          <Footer
            currentTab={currentTab}
            totalTabs={totalTabs}
            onBackPress={async () => {
              await dispatch(layout4Form(form));
              navigateToTab(3);
            }}
            onNextPress={async () => {
              await dispatch(layout4Form(form));
              navigateToTab(5);
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
    elevation: 3, // Lower elevation for a subtle shadow
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
  inputFocused: {
    borderColor: 'green', // Green border color for active input
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

export default LayoutScreen4;
