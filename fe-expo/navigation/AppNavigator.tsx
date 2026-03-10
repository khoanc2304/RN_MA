import React, { useContext } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext } from '../context/AuthContext';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import RevenueScreen from '../screens/RevenueScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import AdminOrdersScreen from '../screens/AdminOrdersScreen';
import AdminChatRoomScreen from '../screens/AdminChatRoomScreen';

// Định nghĩa System Stack
export type RootStackParamList = {
  MainTabs: undefined;
  Login: undefined;
  Register: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  Revenue: undefined;
  Checkout: undefined;
  OrderHistory: undefined;
  AdminOrders: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* MainTabs (Màn hình chính chứa Bottom Navigation và các Stacks lồng nhau) */}
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        
        {/* Các màn hình Auth lấp đầy khung hình */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng Nhập' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng Ký' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
