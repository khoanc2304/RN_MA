import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { userInfo, logout, token } = useContext(AuthContext);

  if (!token) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Vui lòng Đăng Nhập</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Đăng Nhập</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.outlineButtonText}>Chưa có tài khoản? Đăng ký</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hồ sơ cá nhân</Text>
      <Text style={styles.info}>Tên: {userInfo?.name}</Text>
      <Text style={styles.info}>Email: {userInfo?.email}</Text>
      <Text style={styles.info}>Vai trò: {userInfo?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</Text>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#3da9fc', marginTop: 20 }]} 
        onPress={() => navigation.navigate('OrderHistory')}
      >
        <Text style={styles.buttonText}>📦 Lịch Sử Đơn Hàng Của Tôi</Text>
      </TouchableOpacity>

      {userInfo?.role === 'admin' && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Quản Trị System</Text>
          <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('AddProduct')}>
            <Text style={styles.adminBtnText}>+ Thêm Sản Phẩm Mới</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('AdminOrders')}>
            <Text style={styles.adminBtnText}>📋 Quản Lý Đơn Hàng Tổng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('Revenue')}>
            <Text style={styles.adminBtnText}>📈 Xem Thống Kê / Doanh Thu</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: '#ef4565', marginTop: 30, shadowColor: '#ef4565' }]} onPress={logout}>
        <Text style={styles.buttonText}>Đăng Xuất</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f4f6f9',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
    color: '#2b2c34',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#5f6c7b',
    marginBottom: 30,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    marginBottom: 12,
    color: '#495057',
    fontWeight: '500',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  button: {
    backgroundColor: '#3da9fc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#3da9fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  outlineButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#3da9fc',
    backgroundColor: '#ffffff'
  },
  outlineButtonText: {
    color: '#3da9fc',
    fontSize: 16,
    fontWeight: '800',
  },
  adminSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1.5,
    borderTopColor: '#e9ecef'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 15,
    color: '#ef4565',
    letterSpacing: 0.5,
  },
  adminBtn: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  adminBtnText: {
    color: '#3da9fc',
    fontWeight: '800',
    fontSize: 15,
  }
});

export default ProfileScreen;
