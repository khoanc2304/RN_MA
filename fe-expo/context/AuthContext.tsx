import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Định nghĩa kiểu dữ liệu cho User
export interface UserInfo {
  _id: string;
  name: string;
  email: string;
  role: string;
  token?: string;
}

// Định nghĩa kiểu cho các hàm cung cấp bởi Context
interface AuthContextType {
  isLoading: boolean;
  userInfo: UserInfo | null;
  token: string | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
}

// Khởi tạo Context với giá trị mặc định trống ép kiểu
export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Kiểm tra token khi mở app
  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      const userToken = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('userInfo');
      
      if (userToken && userData) {
        setToken(userToken);
        setUserInfo(JSON.parse(userData));
      }
    } catch (error) {
      console.log(`Lỗi khi đọc token: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = true): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { data } = await api.post('/auth/login', { email, password });
      
      if (data.token) {
        if (rememberMe) {
          await AsyncStorage.setItem('userToken', data.token);
          await AsyncStorage.setItem('userInfo', JSON.stringify(data));
        }
        setToken(data.token);
        setUserInfo(data);
        return true;
      }
      return false;
    } catch (error: any) {
      console.log('Lỗi đăng nhập:', error?.response?.data?.message || error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      setToken(null);
      setUserInfo(null);
    } catch (error) {
      console.log('Lỗi đăng xuất:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      isLoading,
      userInfo,
      token,
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
