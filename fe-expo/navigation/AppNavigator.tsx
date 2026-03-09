import React, { useContext } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthContext } from '../context/AuthContext';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
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
  ProductDetail: { productId: string };
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
        {/* MainTabs (Màn hình chính chứa Bottom Navigation) */}
        <Stack.Screen 
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        
        {/* Các màn hình Auth lấp đầy khung hình */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Đăng Nhập' }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Đăng Ký' }} />
        
        {/* Màn hình hiển thị cho Cả Guest & User */}
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Chi tiết sản phẩm' }} />
        
        {/* Checkout */}
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Thanh Toán Đơn Hàng' }} />
        
        {/* Các màn hình dành riêng cho Admin (Được truy cập an toàn từ Profile) */}
        <Stack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Thêm Chủng Loại Giày' }} />
        <Stack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Sửa Thông Tin Giày' }} />
        <Stack.Screen name="Revenue" component={RevenueScreen} options={{ title: 'Báo Cáo Doanh Thu' }} />
        <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'Lịch Sử Đơn Hàng' }} />
        <Stack.Screen name="AdminOrders" component={AdminOrdersScreen} options={{ title: 'Quản Lý Đơn Hàng' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
