import React, { useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';

import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import AdminChatListScreen from '../screens/AdminChatListScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import AdminOrdersScreen from '../screens/AdminOrdersScreen';
import AdminProductsScreen from '../screens/AdminProductsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import EditProductScreen from '../screens/EditProductScreen';
import RevenueScreen from '../screens/RevenueScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import AdminChatRoomScreen from '../screens/AdminChatRoomScreen';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Khai báo ParamList cho Home Stack
export type HomeStackParamList = {
  Home: undefined;
  ProductDetail: { productId: string };
};

const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const HomeStackScreen = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
      <HomeStack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen} 
        options={{ title: 'Chi tiết sản phẩm' }} 
      />
    </HomeStack.Navigator>
  );
};

// Khai báo ParamList cho Cart Stack
export type CartStackParamList = {
  Cart: undefined;
  Checkout: undefined;
};

const CartStack = createNativeStackNavigator<CartStackParamList>();

const CartStackScreen = () => {
  return (
    <CartStack.Navigator>
      <CartStack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
      <CartStack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Thanh toán' }} />
    </CartStack.Navigator>
  );
};

// Khai báo ParamList cho Profile Stack
export type ProfileStackParamList = {
  Profile: undefined;
  OrderHistory: undefined;
  AdminOrders: undefined;
  AdminProducts: undefined;
  AddProduct: undefined;
  EditProduct: { productId: string };
  Revenue: undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const ProfileStackScreen = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: 'Lịch sử đơn hàng' }} />
      <ProfileStack.Screen name="AdminOrders" component={AdminOrdersScreen} options={{ title: 'Quản lý đơn hàng' }} />
      <ProfileStack.Screen name="AdminProducts" component={AdminProductsScreen} options={{ title: 'Quản lý sản phẩm' }} />
      <ProfileStack.Screen name="AddProduct" component={AddProductScreen} options={{ title: 'Thêm sản phẩm' }} />
      <ProfileStack.Screen name="EditProduct" component={EditProductScreen} options={{ title: 'Sửa sản phẩm' }} />
      <ProfileStack.Screen name="Revenue" component={RevenueScreen} options={{ title: 'Thống kê doanh thu' }} />
    </ProfileStack.Navigator>
  );
};

// Khai báo ParamList cho Chat Stack
export type ChatStackParamList = {
  AdminChatList: undefined;
  AdminChatRoom: { userId: string; userName: string };
  ChatRoom: undefined;
};

const ChatStack = createNativeStackNavigator<ChatStackParamList>();

const ChatTabScreen = () => {
  const { userInfo, token } = useContext(AuthContext);

  return (
    <ChatStack.Navigator>
      {userInfo?.role === 'admin' ? (
        <>
          <ChatStack.Screen 
            name="AdminChatList" 
            component={AdminChatListScreen} 
            options={{ headerShown: false }} 
          />
          <ChatStack.Screen 
            name="AdminChatRoom" 
            component={AdminChatRoomScreen} 
            options={({ route }) => ({ title: `Chat: ${route.params?.userName}` })} 
          />
        </>
      ) : (
        <ChatStack.Screen 
          name="ChatRoom" 
          component={ChatRoomScreen} 
          options={{ headerShown: false }} 
        />
      )}
    </ChatStack.Navigator>
  );
};

const Tab = createBottomTabNavigator();

const TabNavigator: React.FC = () => {
  const { totalItems } = useContext(CartContext);
  const { userInfo, token } = useContext(AuthContext);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'HomeTab') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'CartTab') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'ChatTab') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline';
          } else if (route.name === 'ProfileTab') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'ellipse';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3da9fc',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeStackScreen} 
        options={{ title: 'Trang chủ' }} 
      />
      <Tab.Screen 
        name="CartTab" 
        component={CartStackScreen} 
        options={{ 
          title: 'Giỏ hàng',
          tabBarBadge: totalItems > 0 ? totalItems : undefined 
        }} 
      />
      {token && (
        <Tab.Screen 
          name="ChatTab" 
          component={ChatTabScreen} 
          options={{ title: 'Chat' }} 
        />
      )}
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStackScreen} 
        options={{ title: 'Tài khoản' }} 
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
