import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList } from '../../navigationTypes';

type LayoutScreenNavigationProp = DrawerNavigationProp<RootStackParamList>;

const LayoutScreen: React.FC = () => {
  const navigation = useNavigation<LayoutScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={{ padding: 10, flex: 1 }}>
        <View style={styles.buttonView}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.openDrawer()}>
            <Text style={styles.label}>Open Drawer</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonView}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('MainScreen', {})}>
            <Text style={styles.label}>Layout 1</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonView}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('LayoutScreen2')}>
            <Text style={styles.label}>Layout 2</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonView}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('LayoutScreen3')}>
            <Text style={styles.label}>Layout 3</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.buttonView}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('LayoutScreen4')}>
            <Text style={styles.label}>Layout 4</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexDirection: 'row',
  },

  scrollContainer: {
    // padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  label: {
    color: 'white',
    fontWeight: '600',
    fontSize: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
  },
  button: {
    // borderWidth: 1,
    width: '90%',
    padding: 15,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1d756d',
  },
  buttonView: { justifyContent: 'center', alignItems: 'center', padding: 10 },
});

export default LayoutScreen;
