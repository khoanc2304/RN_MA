import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cấu hình URL backend
export const SOCKET_URL = 'http://10.218.157.111:5000';
export const API_URL = `${SOCKET_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
});

// Tự động gắn token vào mỗi request nếu có
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
