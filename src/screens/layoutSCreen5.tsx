/* eslint-disable react-hooks/rules-of-hooks */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Modal,
  Alert,
  NativeSyntheticEvent,
  TextInputFocusEventData,
  findNodeHandle,
} from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import Pdf from 'react-native-pdf';
import { useDispatch, useSelector } from 'react-redux';
import RNFS from 'react-native-fs';
import { layout5Form } from '../redux/slices/layout5Slice';
import { generateAmortizationSchedule } from '../utils/ammortizationTable';
import { formatValue } from '../utils/helpers';
import Footer from '../components/Footer';
import { MainScreenProps, MortgageRow } from '../utils/types';
import { SvgXml } from 'react-native-svg';
import { tick } from '../svg';
import { MAX_TENURE_MONTHS } from '../utils/mortgageConstants';

const LayoutScreen5: React.FC<MainScreenProps> = ({
  navigateToTab,
  currentTab,
  totalTabs,
}) => {
  const dispatch = useDispatch();

  const allValuesFromLayout3 = useSelector((state: any) => state.layout3);
  const allValuesFromLayout4 = useSelector((state: any) => state.layout4);
  const allValuesFromLayout5 = useSelector((state: any) => state.layout5);
  const allValuesFromPropertyValue = useSelector(
    (state: any) => state.propertyValue,
  );
  const { newPropertyValue, newFinanceAmount } = allValuesFromPropertyValue || {};
  const {
    interestType,
    fixedInterestRate,
    variableInterestRate,
    numOfFixedYear,
    IBOR,
    lifeInsuranceRate,
    propertyInsuranceRate,
  } = allValuesFromLayout3 || {};
  const { financeAmount, propertyValue, totalTenureMonth } =
    allValuesFromLayout4 || {};

  const nameRef = useRef<TextInput>(null);
  const mobileRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const companyRef = useRef<TextInput>(null);
  const remarksRef = useRef<TextInput>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [isChecked, setIsChecked] = useState(
    newPropertyValue > 0 && newFinanceAmount > 0,
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: allValuesFromLayout5?.name ? allValuesFromLayout5?.name : '',
    mobile: allValuesFromLayout5?.mobile ? allValuesFromLayout5?.mobile : '',
    email: allValuesFromLayout5?.email ? allValuesFromLayout5?.email : '',
    company: allValuesFromLayout5?.company ? allValuesFromLayout5?.company : '',
    remarks: allValuesFromLayout5?.remarks ? allValuesFromLayout5?.remarks : '',
  });

  const rows = useMemo(() => {
    const loanAmount =
      parseFloat(isChecked ? newFinanceAmount : financeAmount) || 0;
    const tenureMonths = Math.min(
      parseFloat(totalTenureMonth) || 0,
      MAX_TENURE_MONTHS,
    );
    const propertyVal =
      parseFloat(isChecked ? newPropertyValue : propertyValue) || 0;

    return generateAmortizationSchedule({
      loanAmount,
      tenureMonths,
      fixedInterestRate: parseFloat(fixedInterestRate),
      variableInterestRate: parseFloat(variableInterestRate + IBOR),
      propertyValue: propertyVal,
      numOfFixedYear: parseFloat(numOfFixedYear),
      lifeInsuranceRate: parseFloat(lifeInsuranceRate),
      propertyInsuranceRate: parseFloat(propertyInsuranceRate),
    });
  }, [
    isChecked,
    financeAmount,
    newFinanceAmount,
    totalTenureMonth,
    fixedInterestRate,
    variableInterestRate,
    propertyValue,
    newPropertyValue,
    numOfFixedYear,
    lifeInsuranceRate,
    propertyInsuranceRate,
  ]);

  // Memoize the data that depends on the amortization schedule
  const data = useMemo(() => {
    const loanAmount =
      parseFloat(isChecked ? newFinanceAmount : financeAmount) || 0;
    const cappedTenureMonths = Math.min(
      parseFloat(totalTenureMonth) || 0,
      MAX_TENURE_MONTHS,
    );
    // 1. Fixed Period installment (including insurance)
    const fixedPeriodInstallmentWithInsurance =
      parseFloat(rows[0]?.grandTotal.replace(/,/g, '')) || 0.0;
    // 2. Variable period Installment (including insurance)
    // For example, if fixed years are 3 (36 months), get the 37th month (index 36)
    const variablePeriodInstallmentWithInsurance =
      parseFloat(rows[numOfFixedYear * 12]?.grandTotal.replace(/,/g, '')) ||
      0.0;
    // 3. Total Interest (including insurance)
    const totalPaymentWithInsurance = rows?.reduce(
      (sum, row) => sum + parseFloat(row.grandTotal.replace(/,/g, '')),
      0,
    );
    // - parseFloat(loan_Amount)) || 0.0;
    // 4. Fixed period installment (excluding insurance)
    const fixedPeriodInstallmentWithoutInsurance =
      parseFloat(rows[0]?.payment.replace(/,/g, '')) || 0.0;
    // 5. Variable period Installment (excluding insurance)
    const variablePeriodInstallmentWithoutInsurance =
      parseFloat(rows[numOfFixedYear * 12]?.payment.replace(/,/g, '')) || 0.0;
    // 6. Total Interest (excluding insurance)
    const totalPaymentWithoutInsurance = rows?.reduce(
      (sum, row) => sum + parseFloat(row.payment.replace(/,/g, '')),
      0,
    );

    return [
      {
        label: 'Finance Amount',
        value: formatValue(loanAmount),
      },
      {
        label: 'Tenure',
        value: formatValue(cappedTenureMonths),
      },
      {
        label: 'Fixed Interest Rate',
        value: formatValue(fixedInterestRate, 2, true),
      },
      {
        label: 'No. of Fixed years',
        value: formatValue(numOfFixedYear),
      },
      {
        label: 'Variable Interest Rate',
        value: formatValue(variableInterestRate, 2, true),
      },
      {
        label: 'IBOR used for calculation',
        value: formatValue(IBOR, 2, true),
      },
      {
        label: 'Life insurance rate (Annual)',
        value: formatValue(lifeInsuranceRate, 5, true),
      },
      {
        label: 'Property insurance rate (Annual)',
        value: formatValue(propertyInsuranceRate, 5, true),
      },
      {
        label: 'Fixed monthly inst. (Incl. ins)',
        value:
          interestType === 'Fixed'
            ? formatValue(fixedPeriodInstallmentWithInsurance)
            : 'Not Eligible',
      },
      {
        label: 'Variable monthly inst. (Incl. ins)',
        value: formatValue(variablePeriodInstallmentWithInsurance),
      },
      {
        label: 'Fixed monthly inst. (Excl. ins)',
        value: formatValue(fixedPeriodInstallmentWithoutInsurance),
      },
      {
        label: 'Variable monthly inst. (Excl. ins)',
        value: formatValue(variablePeriodInstallmentWithoutInsurance),
      },
      {
        label: 'Total Interest (Incl. ins)',
        value: formatValue(totalPaymentWithInsurance - loanAmount),
      },
      {
        label: 'Total Interest (Excl. ins)',
        value: formatValue(totalPaymentWithoutInsurance - loanAmount),
      },
    ];
  }, [
    rows,
    isChecked,
    financeAmount,
    newFinanceAmount,
    propertyValue,
    newPropertyValue,
    numOfFixedYear,
    interestType,
    totalTenureMonth,
  ]);

  useEffect(() => {
    if (allValuesFromLayout5) {
      setForm({
        name: allValuesFromLayout5?.name ? allValuesFromLayout5?.name : '',
        mobile: allValuesFromLayout5?.mobile
          ? allValuesFromLayout5?.mobile
          : '',
        email: allValuesFromLayout5?.email ? allValuesFromLayout5?.email : '',
        company: allValuesFromLayout5?.company
          ? allValuesFromLayout5?.company
          : '',
        remarks: allValuesFromLayout5?.remarks
          ? allValuesFromLayout5?.remarks
          : '',
      });
    }
  }, [allValuesFromLayout5]);

  const handleFocus = (
    event: NativeSyntheticEvent<TextInputFocusEventData>,
    ref: React.RefObject<TextInput | null>,
    field: string,
  ) => {
    setFocusedInput(field);
  };

  // Modified handleBlur to save data
  const handleBlur = (field: string) => {
    setFocusedInput(null);
    saveFieldToRedux(field);
  };

  // Unified save function
  const saveFieldToRedux = (field: string) => {
    const updatedForm = { ...form };
    dispatch(layout5Form(updatedForm));
  };

  const handleChange = (field: string, value: string) => {
    setForm(prevState => ({
      ...prevState,
      [field]: value,
    }));
  };

  // Remove old handleInputSubmit and use this instead
  const handleFieldSubmit = (field: string) => {
    saveFieldToRedux(field);
    // Move to next field if needed
    switch (field) {
      case 'name':
        mobileRef.current?.focus();
        break;
      case 'mobile':
        emailRef.current?.focus();
        break;
      case 'email':
        companyRef.current?.focus();
        break;
      case 'company':
        remarksRef.current?.focus();
        break;
    }
  };

  const generatePDF = async () => {
    const htmlContent = `
      <html>
        <head>
          <style>
            .amortization-table th {
              border: 2px solid #ddd;
              padding: 8px;
              text-align: center;
              word-wrap: break-word;
            }
            .amortization-table td {
              border: 2px solid #ddd;
              padding: 8px;
              text-align: center;
              word-wrap: break-word;
            }
            td {
              border: 2px solid #ddd;
              padding: 5px;
            }
          </style>
        </head>
        <body>
          <h1 style="text-align: center;">Summary & Amortization Table</h1>
                 <div style="border: 1px solid black; padding: 0px 10px; margin: 0px; border-radius: 5px;">
  <p><strong>Remarks:</strong> ${form.remarks}</p>
  <p style="font-weight:700; color:#1d756d;">BELOW FIGURES ARE ILLUSTRATIVE ONLY</p>
</div>

             <p><strong>Mortgage consultant:</strong> ${form.name}</p>
          <p><strong>Mobile:</strong> ${form.mobile}</p>
          <p><strong>Email:</strong> ${form.email}</p>
          <p><strong>Company:</strong> ${form.company}</p>
          <table border="1" style="width: 100%; text-align: left; border-collapse: collapse;">

            <tbody>
              ${data
        .map(
          item => `
                  <tr>
                    <td>${item.label}</td>
                    <td>${item.value}</td>
                  </tr>`,
        )
        .join('')}
            </tbody>
          </table>
       
  
          <!-- New Mortgage Table Section -->
          <h2>Mortgage Amortization Table</h2>
          <table class="amortization-table" border="1" style="width: 100%; text-align: center; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr>
                <th>Month</th>
                <th>Interest Rate</th>
                <th>Payment</th>
                <th>Interest</th>
                <th>Principal</th>
                <th>Outstanding</th>
                <th>Life Insurance</th>
                <th>Property Insurance</th>
                <th>Grand Total EMI</th>
              </tr>
            </thead>
            <tbody>
              ${rows
        .map(
          (row: MortgageRow) => `
                  <tr>
                    <td>${row.month}</td>
                    <td>${row.interestRate}</td>
                    <td>${row.payment.split('.')[0]}</td>
                    <td>${row.interest.split('.')[0]}</td>
                    <td>${row.principal.split('.')[0]}</td>
                    <td>${row.outstanding.split('.')[0]}</td>
                    <td>${row.lifeInsurance.split('.')[0]}</td>
                    <td>${row.propertyInsurance.split('.')[0]}</td>
                    <td>${row.grandTotal.split('.')[0]}</td>
                  </tr>`,
        )
        .join('')}
            </tbody>
          </table>
   
        </body>
      </html>
    `;

    try {
      const options = {
        html: htmlContent,
        fileName: 'Mortgage Finance',
        directory: 'Documents',
      };

      const file = await RNHTMLtoPDF.convert(options);
      setPdfPath(file?.filePath ?? '');
      setModalVisible(true); // Open modal after PDF is generated
    } catch (error) {
      console.error('Error generating PDF:', error);
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  const downloadPDF = async () => {
    if (!pdfPath) {
      Alert.alert('Error', 'PDF not available to download.');
      return;
    }

    try {
      // iOS: Use DocumentDirectoryPath (sandboxed, accessible via Files app)
      // Android: Use DownloadDirectoryPath (public Downloads folder)
      const directory =
        Platform.OS === 'ios'
          ? RNFS.DocumentDirectoryPath
          : RNFS.DownloadDirectoryPath;
      const baseFileName = 'Mortgage Eligibility';
      const fileExtension = '.pdf';
      let fileName = `${baseFileName}${fileExtension}`;
      let destPath = `${directory}/${fileName}`;
      let counter = 1;

      // Check if file already exists and rename if necessary
      while (await RNFS.exists(destPath)) {
        fileName = `${baseFileName}(${counter})${fileExtension}`;
        destPath = `${directory}/${fileName}`;
        counter++;
      }

      // Copy the file to the destination directory
      await RNFS.copyFile(pdfPath, destPath);

      Alert.alert(
        'Download Successful',
        Platform.OS === 'ios'
          ? `PDF saved as ${fileName}. Access it via the Files app.`
          : `PDF saved as ${fileName} in Downloads folder`,
      );
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      Alert.alert('Error', `Failed to download the PDF: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        {newPropertyValue > 0 && newFinanceAmount > 0 && (
          <View style={styles.floatingCheckboxWrapper}>
            <Text style={styles.checkboxLabel}>
              Calculate with New Property and Finance Amount
            </Text>
            <TouchableOpacity onPress={() => setIsChecked(!isChecked)}>
              <View style={styles.checkboxContainer}>
                {isChecked ? (
                  <SvgXml xml={tick} width={24} height={24} />
                ) : (
                  <View style={styles.emptyCheckbox} />
                )}
              </View>
            </TouchableOpacity>
          </View>
        )}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}>
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
                <Text style={{ fontSize: 17, fontWeight: '700', color: 'black' }}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}

          <Text style={styles.label}>Advisor Name</Text>
          <TextInput
            ref={nameRef}
            style={[
              styles.input,
              focusedInput === 'name' && styles.inputFocused, // Green border if active
            ]}
            placeholder="Enter name"
            placeholderTextColor="black"
            onFocus={e => handleFocus(e, nameRef, 'name')}
            onBlur={() => handleBlur('name')}
            value={form.name ? form.name : ''}
            onChangeText={text => handleChange('name', text)}
            returnKeyType="next"
            onSubmitEditing={() => handleFieldSubmit('name')} // Focus on Mobile
          />

          <Text style={styles.label}>Mobile</Text>
          <TextInput
            ref={mobileRef}
            style={[
              styles.input,
              focusedInput === 'mobile' && styles.inputFocused, // Green border if active
            ]}
            placeholder="Enter mobile"
            placeholderTextColor="black"
            onFocus={e => handleFocus(e, mobileRef, 'mobile')}
            onBlur={() => handleBlur('mobile')}
            value={form.mobile}
            onChangeText={text => handleChange('mobile', text)}
            returnKeyType="next"
            keyboardType="phone-pad"
            onSubmitEditing={() => handleFieldSubmit('mobile')}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            ref={emailRef}
            style={[
              styles.input,
              focusedInput === 'email' && styles.inputFocused, // Green border if active
            ]}
            placeholder="Enter email"
            placeholderTextColor="black"
            value={form.email}
            onFocus={e => handleFocus(e, emailRef, 'email')}
            onBlur={() => handleBlur('email')}
            onChangeText={text => handleChange('email', text)}
            returnKeyType="next"
            keyboardType="email-address"
            onSubmitEditing={() => handleFieldSubmit('email')}
          />

          <Text style={styles.label}>Company</Text>
          <TextInput
            ref={companyRef}
            style={[
              styles.input,
              focusedInput === 'company' && styles.inputFocused, // Green border if active
            ]}
            placeholder="Enter company"
            placeholderTextColor="black"
            value={form.company}
            onFocus={e => handleFocus(e, companyRef, 'company')}
            onBlur={() => handleBlur('company')}
            onChangeText={text => handleChange('company', text)}
            returnKeyType="next"
            onSubmitEditing={() => handleFieldSubmit('company')}
          />

          <Text style={styles.label}>Remarks</Text>
          <Text style={{ marginTop: 4, fontWeight: '600', color: '#1d756d' }}>
            BELOW FIGURES ARE ILLUSTRATIVE ONLY
          </Text>
          <TextInput
            ref={remarksRef}
            style={[
              styles.input,
              focusedInput === 'remarks' && styles.inputFocused, // Green border if active
            ]}
            placeholder="Enter remarks"
            placeholderTextColor="black"
            value={form.remarks}
            onFocus={e => handleFocus(e, remarksRef, 'remarks')}
            onBlur={() => handleBlur('remarks')}
            onChangeText={text => handleChange('remarks', text)}
            returnKeyType="done"
            onSubmitEditing={() => handleFieldSubmit('remarks')}
          />

          <TouchableOpacity style={styles.button} onPress={generatePDF}>
            <Text style={styles.buttonText}>Generate & View PDF</Text>
          </TouchableOpacity>
          <Footer
            currentTab={currentTab}
            totalTabs={totalTabs}
            onBackPress={async () => {
              await dispatch(layout5Form(form));
              navigateToTab(4);
            }}
            onNextPress={() => { }}
          />
        </ScrollView>
      </View>

      <Modal visible={modalVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <Pdf
            source={pdfPath ? { uri: pdfPath } : { uri: '' }}
            style={styles.pdfViewer}
            onError={error => console.error('PDF Load Error:', error)}
          />

          {/* Download Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.pdfButtons} onPress={downloadPDF}>
              <Text style={styles.buttonText}>Download PDF</Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.pdfButtons}
              onPress={() => setModalVisible(false)}>
              <Text style={styles.buttonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContainer: { padding: 16, flexGrow: 1 },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 16 },
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
  button: {
    backgroundColor: '#1d756d',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingBottom: 65,
  },
  pdfViewer: {
    flex: 1,
    width: '100%',
    marginBottom: 65,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: 'center', // Vertically center buttons
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    // backgroundColor: 'rgba(255, 255, 255, 0.9)', // Semi-transparent
    // zIndex: 10, // Ensures buttons stay above PDF
  },
  pdfButtons: {
    backgroundColor: '#1d756d',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
  },
  inputFocused: {
    borderColor: 'green', // Green border color for active input
  },
  checkboxContainer: {
    flex: 1,
    height: 45,
    width: 45,
    borderRadius: 10,
    backgroundColor: '#1D756D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCheckbox: {
    width: 25,
    height: 25,
    borderWidth: 2,
    borderColor: '#ccc',
    borderRadius: 5,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  floatingCheckboxWrapper: {
    position: 'relative',
    top: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#94bcb4',
    marginBottom: 10,
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderColor: '#1D756D',
    borderWidth: 2,
    borderRadius: 5,
  },
});

export default LayoutScreen5;
