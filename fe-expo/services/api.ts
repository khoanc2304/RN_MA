import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cấu hình URL backend
const API_URL = 'http://192.168.0.19:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Tự động gắn token vào mỗi request nếu có
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
