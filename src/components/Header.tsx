import React from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
  StyleSheet,
} from 'react-native';
import {useDispatch} from 'react-redux';
import {layout2Form} from '../redux/slices/layout2Slice';
import {layout3Form} from '../redux/slices/layout3Slice';
import {layout4Form} from '../redux/slices/layout4Slice';
import {mortageTableValue} from '../redux/slices/mortageTableSlice';
import {layout1Form} from '../redux/slices/layout1Slice';

interface Props {
  onLeftBtnPress: () => void;
  onRightBtnPress: () => void;
  // resetAll: () => void;

  hideLeftBtn?: boolean;
  hideText?: boolean;
  hideRightBtn?: boolean;
  leftIcon?: any;
  headingText?: any;
  subHeadingText?: string;
  mainHeadingText?: string;
  rightIcon?: any;
  containerStyle?: ViewStyle;
  filterArray?: any;
  rightButton?: boolean;
  text?: any;
  paddingHorizontal?: String;
  dualRightButtons?: boolean;
  dualRightIcon?: any;
  CustomRightComponent?: React.ReactElement;
}
const Header = ({
  onLeftBtnPress,
  onRightBtnPress,
  // resetAll,
  hideLeftBtn,
  hideRightBtn,
  text,
  leftIcon,
  headingText,
  rightIcon,
  subHeadingText,
  mainHeadingText,
  rightButton = true,
  dualRightButtons,
  dualRightIcon,
  CustomRightComponent,
}: Props) => {
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingHorizontal: 10,
          paddingTop: 20,
          borderWidth: 0,
          width: '100%',
        }}
        //   flexDirection="row"
        //   justifyContent="space-between"
      >
        <View>
          <TouchableOpacity onPress={onLeftBtnPress} disabled={hideLeftBtn}>
            {!hideLeftBtn && leftIcon}
          </TouchableOpacity>
        </View>
        <View
          style={[
            styles.headingContainer,
            dualRightButtons && styles.dualRightPadding,
          ]}>
          {mainHeadingText ? (
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                // marginBottom: 16,
                right: 20,
                textAlign: 'center',
              }}>
              {mainHeadingText}
            </Text>
          ) : (
            headingText
          )}
          {subHeadingText && <Text>{subHeadingText}</Text>}
        </View>
        {CustomRightComponent ? (
          CustomRightComponent
        ) : dualRightButtons ? (
          <View style={styles.dualRightContainer}>
            <TouchableOpacity disabled={!!text}>
              {dualRightIcon}
            </TouchableOpacity>
            <TouchableOpacity disabled={!!text}>
              {dualRightIcon}
            </TouchableOpacity>
          </View>
        ) : rightButton ? (
          <View>
            <TouchableOpacity
              onPress={onRightBtnPress}
              disabled={text ? true : false}>
              {hideRightBtn ? '' : rightIcon}
              {/* {!hideRightBtn && filterArray > 0 && (
                 <View>
                   <Text>{filterArray}</Text>
                 </View>
              )} */}
            </TouchableOpacity>
            {/* <TouchableOpacity onPress={onRightBtnPress} disabled={!!text}>
              {!hideRightBtn && rightIcon}
            </TouchableOpacity> */}
          </View>
        ) : (
          <View>
            <View />
          </View>
        )}
        {/* <View>
          <TouchableOpacity
            onPress={onRightBtnPress}
            disabled={text ? true : false}>
            {hideRightBtn ? '' : rightIcon}
          </TouchableOpacity>
        </View> */}
      </View>
      <View
        style={{
          borderBottomWidth: 1,
          borderColor: '#ECECEC',
          width: '100%',
          paddingTop: 20,
          opacity: 1,
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 20,
    borderWidth: 0,
    width: '100%',
  },
  headingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '60%',
    bottom: 5,
    // borderWidth:1,
    paddingLeft: 25,
  },
  dualRightPadding: {
    paddingLeft: 50,
  },
  dualRightContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 10,
    width: 70,
  },
  mainHeadingText: {
    fontWeight: '400',
    fontSize: 14,
    color: 'black',
    fontFamily: 'Outfit-Regular',
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: '#ECECEC',
    width: '100%',
    paddingTop: 20,
    opacity: 1,
  },
});

export default Header;
