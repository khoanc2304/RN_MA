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

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AdminChatRoomScreen from '../screens/AdminChatRoomScreen';

// Khai báo ParamList cho Chat Stack
export type ChatStackParamList = {
  AdminChatList: undefined;
  AdminChatRoom: { userId: string; userName: string };
  ChatRoom: undefined;
};

const ChatStack = createNativeStackNavigator<ChatStackParamList>();

const Tab = createBottomTabNavigator();

const ChatTabScreen = () => {
  const { userInfo } = useContext(AuthContext);

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
