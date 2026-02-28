import React, { useState } from 'react';
import {
  Dimensions,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from 'react-native';
import Box from '../components/Box';
import { useTheme } from '@shopify/restyle';

interface TextFieldInputProps {
  placeHolder?: string;
  singleInput?: boolean;
  simpleInput?: boolean;
  headerText?: string;
  isMyProfile?: boolean;
  passwordChange?: boolean;
  nameError?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  fullWidth?: boolean;
  isDisabled?: boolean;
  value?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  labelColor?: string;
  placeholderColor?: string;
}

const { width } = Dimensions.get('window');

const TextFieldInput = ({
  placeHolder,
  singleInput,
  simpleInput,
  headerText,
  isMyProfile,
  passwordChange,
  onPress,
  onChangeText,
  nameError,
  fullWidth = false,
  isDisabled = false,
  value: externalValue,
  multiline = false,
  keyboardType = 'default',
  labelColor,
  placeholderColor,
}: TextFieldInputProps) => {
  const { colors } = useTheme();
  const [txt, setTxt] = useState('');
  const [isFocused, setIsFocused] = useState(false); // Add state for focus

  return (
    <Box style={{ padding: 0 }}>
      {/* Heading text for the input field */}
      {headerText && <Text style={styles.headingText}>{headerText}</Text>}
      {simpleInput && (
        <Text
          style={{
            // fontWeight: '400',
            // fontSize: 20,
            // color: 'black',
            // fontFamily: 'Outfit-Regular',

            fontSize: 16,
            fontWeight: 'bold',
            marginTop: 16,
            bottom: 10,
            color: labelColor || 'black', // Default fallback to black or passed prop
          }}>
          {placeHolder} {/* Using placeholder as a label */}
        </Text>
      )}
      <Box
        style={[
          styles.textInputStyle,
          {
            height: multiline ? 120 : 45,
            width: fullWidth ? '100%' : singleInput ? '100%' : 163,
            backgroundColor: 'white',
            borderColor: isFocused ? 'green' : '#ECECEC',
          },
        ]}>
        <TextInput
          style={[styles.textInput, multiline && { textAlignVertical: 'top', paddingTop: 8 }]}
          returnKeyLabel={multiline ? 'default' : 'done'}
          returnKeyType={multiline ? 'default' : 'done'}
          onChangeText={text => {
            setTxt(text);
            if (onChangeText) {
              onChangeText(text);
            }
          }}
          placeholder={simpleInput ? placeHolder : ''}
          value={externalValue !== undefined ? externalValue : txt}
          placeholderTextColor={placeholderColor || colors.bg_subtle}
          editable={!isDisabled}
          selectTextOnFocus={!isDisabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          multiline={multiline}
          keyboardType={keyboardType}
        />
      </Box>
      <Box
        style={{
          height: 20,
          width: singleInput ? width - 45 : 163,
        }}>
        {nameError ? (
          <Text style={styles.errorText}>Name: 2-20 chars.</Text>
        ) : null}
      </Box>
      {passwordChange ? (
        <TouchableOpacity style={styles.barBtn} onPress={onPress}>
          <Text>Change</Text>
        </TouchableOpacity>
      ) : null}
    </Box>
  );
};

const styles = StyleSheet.create({
  textInputStyle: {
    borderWidth: 1,
    borderColor: '#ECECEC', // Default border color
    borderRadius: 8,
    paddingLeft: 15,
    justifyContent: 'space-evenly',
    width: '90%',

    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    backgroundColor: '#fff',
  },
  textInput: {
    padding: 0,
    height: '100%',
    width: '100%',
    letterSpacing: 0.4,
    fontWeight: '400',
    fontSize: 16,
    color: 'black', // Ensure typing text is strictly black for white background
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
    paddingLeft: 10,
  },
  barBtn: {
    position: 'absolute',
    top: 10,
    justifyContent: 'center',
    right: '7%',
    height: '100%',
  },
  headingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
    marginLeft: 5,
  },
});

export default TextFieldInput;
