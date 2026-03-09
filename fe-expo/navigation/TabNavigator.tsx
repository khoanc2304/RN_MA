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

const Tab = createBottomTabNavigator();

// Screen bọc để tránh lỗi định danh t0 và xử lý logic phân quyền
const ChatTabScreen = () => {
  const { userInfo } = useContext(AuthContext);
  if (userInfo?.role === 'admin') {
    return <AdminChatListScreen />;
  }
  return <ChatRoomScreen />;
};

const TabNavigator: React.FC = () => {
  const { totalItems } = useContext(CartContext);
  // Không cần lấy userInfo ở đây nữa nếu không dùng cho logic render Tab trực tiếp


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
        headerShown: false, // Tắt Header của Tab (Dùng Header của Stack bên trong để thay thế)
      })}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={HomeScreen} 
        options={{ title: 'Trang chủ' }} 
      />
      <Tab.Screen 
        name="CartTab" 
        component={CartScreen} 
        options={{ 
          title: 'Giỏ hàng',
          tabBarBadge: totalItems > 0 ? totalItems : undefined 
        }} 
      />
      <Tab.Screen 
        name="ChatTab" 
        component={ChatTabScreen} 
        options={{ title: 'Chat' }} 
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ title: 'Tài khoản' }} 
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
