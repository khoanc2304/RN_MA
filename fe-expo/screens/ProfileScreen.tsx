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

      {userInfo?.role === 'admin' && (
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Quản Trị System</Text>
          <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('AddProduct')}>
            <Text style={styles.adminBtnText}>+ Thêm Sản Phẩm Mới</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('Revenue')}>
            <Text style={styles.adminBtnText}>📈 Xem Thống Kê / Doanh Thu</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: '#dc3545', marginTop: 30 }]} onPress={logout}>
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
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  info: {
    fontSize: 18,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  outlineButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007bff'
  },
  outlineButtonText: {
    color: '#007bff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  adminSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#d9534f'
  },
  adminBtn: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  adminBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default ProfileScreen;
