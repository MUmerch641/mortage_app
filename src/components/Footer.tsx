import React, { useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { leftArrow, rightArrow } from '../assets/arrowIcons';

interface FooterProps {
    currentTab: number;
    totalTabs: number;
    onBackPress: () => void;
    onNextPress: () => void;
}

const Footer: React.FC<FooterProps> = ({
    currentTab,
    totalTabs,
    onBackPress,
    onNextPress,
}) => {
    const [isBackPressed, setIsBackPressed] = useState(false);
    const [isNextPressed, setIsNextPressed] = useState(false);
    const isFirstTab = currentTab === 1;
    const isLastTab = currentTab === totalTabs;

    return (
        <View style={styles.container}>
            {!isFirstTab && (
                <TouchableOpacity
                    style={[
                        styles.button,
                        styles.backButton,
                        isBackPressed && styles.buttonPressed
                    ]}
                    onPress={onBackPress}
                    onPressIn={() => setIsBackPressed(true)}
                    onPressOut={() => setIsBackPressed(false)}
                    activeOpacity={0.7}>
                    <View style={styles.buttonContent}>
                        <SvgXml
                            xml={leftArrow}
                            width={20}
                            height={20}
                            fill={isBackPressed ? '#fff' : '#1d756d'} />
                        <Text style={[
                            styles.buttonText,
                            isBackPressed && styles.buttonTextPressed
                        ]}>
                            Back
                        </Text>
                    </View>
                </TouchableOpacity>
            )}

            {!isLastTab && (
                <TouchableOpacity
                    style={[
                        styles.button,
                        styles.nextButton,
                        isNextPressed && styles.buttonPressed
                    ]}
                    onPress={onNextPress}
                    onPressIn={() => setIsNextPressed(true)}
                    onPressOut={() => setIsNextPressed(false)}
                    activeOpacity={0.7}>
                    <View style={styles.buttonContent}>
                        <Text style={[
                            styles.buttonText,
                            isNextPressed && styles.buttonTextPressed
                        ]}>
                            Next
                        </Text>
                        <SvgXml
                            xml={rightArrow}
                            width={20}
                            height={20}
                            fill={isNextPressed ? '#fff' : '#1d756d'} />
                    </View>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 16,
        borderTopWidth: 1,
        borderColor: '#ECECEC',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 25,
        borderColor: '#1d756d',
        flexDirection: 'row',
        alignItems: 'center',
        minWidth: 120,
        justifyContent: 'center',
    },
    backButton: {
        backgroundColor: '#fff',
        marginRight: 'auto', // Pushes to left
    },
    nextButton: {
        backgroundColor: '#fff',
        marginLeft: 'auto', // Pushes to right
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    buttonText: {
        color: '#1d756d',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonPressed: {
        backgroundColor: '#1d756d',
    },
    buttonTextPressed: {
        color: '#fff',
    },
});

export default Footer;