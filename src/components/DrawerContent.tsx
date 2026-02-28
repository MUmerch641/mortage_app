import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
} from 'react-native';
import { DrawerContentScrollView, DrawerItem, useDrawerStatus } from '@react-navigation/drawer';
import { CommonActions, DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { SvgXml } from 'react-native-svg';
import { backButton } from '../svg';
import Box from './Box';
import { useDispatch, useSelector } from 'react-redux';
import { logoutUser } from '../redux/slices/userSlice';
import { resetState } from '../redux/store';

const DrawerContent = (props: any) => {
  // const { navigation } = props;
  const navigation: any = useNavigation();
  const dispatch = useDispatch();
  const currentRoute = navigation?.getState()?.routes[navigation.getState().index]?.name;
  const drawerStatus = useDrawerStatus();

  const isDrawerOpen = drawerStatus === 'open';
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (isDrawerOpen) {
          navigation.dispatch(DrawerActions.closeDrawer());
          return true; // Prevent default back button behavior
        }
        // navigation.goBack();
        return false; // Allow default back behavior
      };

      const backHandler = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => backHandler.remove();
    }, [navigation])
  );
  const handleLogout = () => {
    navigation.dispatch(DrawerActions.closeDrawer());
    // Clear user state first (sets token to null), then reset app state.
    dispatch(logoutUser());
    dispatch(resetState());
    // Explicitly reset navigation to SplashScreen so there is no race condition
    // between the conditional stack re-render and SegmentScreen's still-mounted state.
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'HomeDrawer' }],
      })
    );
  };


  const userDetails = useSelector((state: any) => state.user.details);
  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{ flex: 1, justifyContent: 'space-between' }}>
      <View>
        <View style={styles.header}>
          <Box style={{ flexDirection: 'column' }}>
            <Text style={styles.userName}>{userDetails?._user?.displayName || userDetails?._user?.name}</Text>
            <Text style={styles.emailText}>{userDetails?._user?.email || userDetails?.email}</Text>
          </Box>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.dispatch(DrawerActions.closeDrawer())}>
            <SvgXml xml={backButton} width={24} height={24} />
          </TouchableOpacity>
        </View>

        <DrawerItem
          label="Home"
          onPress={() => navigation.navigate('HomeDrawer')}
          labelStyle={currentRoute === 'HomeDrawer' ? styles.drawerItemLabel : styles.drawerItemLabel2}
          style={currentRoute === 'HomeDrawer' ? styles.homeDrawerItem : {}}
        />

        <DrawerItem
          label="Subscription"
          onPress={() => navigation.navigate('Subscription')}
          labelStyle={currentRoute === 'Subscription' ? styles.drawerItemLabel : styles.drawerItemLabel2}
          style={currentRoute === 'Subscription' ? styles.homeDrawerItem : {}}
        />

        <DrawerItem
          label="Contact Us"
          onPress={() => navigation.navigate('contactUs')}
          labelStyle={currentRoute === 'Contact Us' ? styles.drawerItemLabel : styles.drawerItemLabel2}
          style={currentRoute === 'Contact Us' ? styles.homeDrawerItem : {}}

        />
        <DrawerItem
          label="FAQ"
          onPress={() => navigation.navigate('instructions')}
          labelStyle={currentRoute === 'instructions' ? styles.drawerItemLabel : styles.drawerItemLabel2}
          style={currentRoute === 'instructions' ? styles.homeDrawerItem : {}}

        />
      </View>

      <View style={styles.logoutContainer}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d756d',
  },
  emailText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1d756d',
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  drawerItemLabel: {
    fontSize: 16,
    color: 'white',
  },
  drawerItemLabel2: {
    fontSize: 16,
  },
  homeDrawerItem: {
    backgroundColor: '#1d756d',
    borderRadius: 5,
    marginHorizontal: 10,
    marginVertical: 5,
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'red',
  },
});

export default DrawerContent;
