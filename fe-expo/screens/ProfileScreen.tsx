import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileStackParamList } from '../navigation/TabNavigator';
import { Ionicons } from '@expo/vector-icons';

type ProfileScreenNavigationProp = NativeStackNavigationProp<ProfileStackParamList, 'Profile'>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { userInfo, logout, token } = useContext(AuthContext);

  if (!token) {
    return (
      <View style={styles.container}>
        <View style={styles.authBox}>
          <Ionicons name="person-circle-outline" size={80} color="#3da9fc" />
          <Text style={styles.title}>Chào mừng bác!</Text>
          <Text style={styles.subtitle}>Đăng nhập để xem hồ sơ và quản lý đơn hàng</Text>
          <TouchableOpacity style={styles.button} onPress={() => navigation.getParent()?.navigate('Login')}>
            <Text style={styles.buttonText}>Đăng Nhập Ngay</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={() => navigation.getParent()?.navigate('Register')}>
            <Text style={styles.outlineButtonText}>Tạo tài khoản mới</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.headerBox}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{userInfo?.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.userName}>{userInfo?.name}</Text>
        <Text style={styles.userEmail}>{userInfo?.email}</Text>
        <View style={[styles.roleBadge, userInfo?.role === 'admin' && styles.adminBadge]}>
          <Text style={styles.roleText}>{userInfo?.role === 'admin' ? 'Quản trị viên' : 'Khách hàng'}</Text>
        </View>
      </View>

      <View style={styles.menuBox}>
         <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('OrderHistory')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#e3f2fd' }]}>
            <Ionicons name="receipt-outline" size={22} color="#3da9fc" />
          </View>
          <Text style={styles.menuText}>Lịch sử đơn hàng của tôi</Text>
          <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
        </TouchableOpacity>
      </View>

      {userInfo?.role === 'admin' && (
        <View style={styles.adminBox}>
          <Text style={styles.sectionTitle}>Bảng điều khiển Admin</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminProducts')}>
            <View style={[styles.menuIcon, { backgroundColor: '#f0f4f8' }]}>
              <Ionicons name="cube-outline" size={22} color="#3da9fc" />
            </View>
            <Text style={styles.menuText}>Quản lý sản phẩm</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AdminOrders')}>
            <View style={[styles.menuIcon, { backgroundColor: '#fff8e1' }]}>
              <Ionicons name="list-outline" size={22} color="#ffc107" />
            </View>
            <Text style={styles.menuText}>Quản lý đơn hàng</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Revenue')}>
            <View style={[styles.menuIcon, { backgroundColor: '#e8f5e9' }]}>
              <Ionicons name="bar-chart-outline" size={22} color="#4caf50" />
            </View>
            <Text style={styles.menuText}>Báo cáo doanh thu</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('AddProduct')}>
            <View style={[styles.menuIcon, { backgroundColor: '#f3e5f5' }]}>
              <Ionicons name="add-circle-outline" size={22} color="#9c27b0" />
            </View>
            <Text style={styles.menuText}>Thêm sản phẩm mới</Text>
            <Ionicons name="chevron-forward" size={20} color="#cbd5e0" />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={22} color="#ef4565" />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  authBox: {
    flex: 1,
    padding: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#2b2c34',
    marginTop: 20,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a1b2',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 30,
    lineHeight: 22,
  },
  headerBox: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 35,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#3da9fc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '900',
    color: '#ffffff',
  },
  userName: {
    fontSize: 22,
    fontWeight: '900',
    color: '#2b2c34',
  },
  userEmail: {
    fontSize: 14,
    color: '#94a1b2',
    marginTop: 4,
    fontWeight: '500',
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#e2e8f0',
    marginTop: 12,
  },
  adminBadge: {
    backgroundColor: '#dcfce7',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
  },
  menuBox: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  adminBox: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#2b2c34',
    marginBottom: 15,
    marginLeft: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#495057',
  },
  button: {
    backgroundColor: '#3da9fc',
    width: '100%',
    height: 56,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 4,
    shadowColor: '#3da9fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  outlineButton: {
    width: '100%',
    height: 56,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#3da9fc',
  },
  outlineButtonText: {
    color: '#3da9fc',
    fontSize: 16,
    fontWeight: '800',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    backgroundColor: '#fff1f2',
    marginHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ffe4e6',
  },
  logoutText: {
    color: '#ef4565',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },
});

export default ProfileScreen;
