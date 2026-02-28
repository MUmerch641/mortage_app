import {DrawerNavigationProp} from '@react-navigation/drawer';

export type RootStackParamList = {
  HomeDrawer: undefined;
  Subscription: undefined;
  SegmentScreen: {
    additionalIncome?: number;
    propertyValue?: number;
    financeAmount?: number;
    initialTab?: number;
  };
  LayoutScreen: undefined;
  LayoutScreen2: undefined;
  LayoutScreen3: undefined;
  LayoutScreen4: undefined;
  LayoutScreen5: undefined;
  PropertyValue: {ltv: number};
  MortgageTable: {
    months: number;
    interestRate: number;
    initialData: any;
  };
  MainScreen: {
    additionalIncome?: number;
  };
  LoginScreen: {
    additionalIncome?: number;
  };
  IncomeDetailsScreen: {
    option?: string;
  };
  SplashScreen: undefined;
  SignUpScreen: undefined;
};

export type DrawerNavigation = DrawerNavigationProp<
  RootStackParamList,
  'HomeDrawer'
>;
