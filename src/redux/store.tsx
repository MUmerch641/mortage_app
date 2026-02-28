import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import layout1Reducer from './slices/layout1Slice';
import layout2Reducer from './slices/layout2Slice';
import layout3Reducer from './slices/layout3Slice';
import layout4Reducer from './slices/layout4Slice';
import layout5Reducer from './slices/layout5Slice';
import mortageTableReducer from './slices/mortageTableSlice';
import incomeDetailReducer from '../redux/slices/incomeDetailSlice';
import propertyValueReducer from '../redux/slices/propertyValueSlice';
import lexiconReducer from '../redux/slices/userLexiconList';
import languageReducer from '../redux/slices/languageSlice';
import userReducer from '../redux/slices/userSlice';
import subscriptionReducer from '../redux/slices/subscriptionSlice';


const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const appReducer = combineReducers({
  layout1: layout1Reducer,
  layout2: layout2Reducer,
  layout3: layout3Reducer,
  layout4: layout4Reducer,
  layout5: layout5Reducer,
  user: userReducer,
  subscription: subscriptionReducer,
  mortageTable: mortageTableReducer,
  propertyValue: propertyValueReducer,
  userLexiconList: lexiconReducer,
  language: languageReducer,
  incomeDetail: incomeDetailReducer,
});


export const rootReducer = (state: any, action: any) => {
  if (action.type === 'RESET_STATE') {
    // Clear persisted data from AsyncStorage
    AsyncStorage.removeItem('persist:root');

    // Return undefined to let ALL reducers initialize with their default state
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'RESET_STATE'],
        // Ignore these paths in the actions
        ignoredActionPaths: ['payload.details'],
        // Optionally ignore these paths in the state if needed
        ignoredPaths: ['user.details']
      },
    }),
});

export const resetState = () => ({ type: 'RESET_STATE' });

export const persistor = persistStore(store);
