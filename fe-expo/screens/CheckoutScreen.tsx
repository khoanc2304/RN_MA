import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { RootStackParamList } from '../navigation/AppNavigator';
import api from '../services/api';

type CheckoutScreenRouteProp = RouteProp<RootStackParamList, 'Checkout'>;

const CheckoutScreen: React.FC = () => {
  const { userInfo } = useContext(AuthContext);
  const { cartItems, totalPrice, clearCart } = useContext(CartContext);
  const navigation = useNavigation();

  const [name, setName] = useState(userInfo?.name || '');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ Tên, Số điện thoại và Địa chỉ giao hàng.');
      return;
    }

    try {
      setLoading(true);
      const orderItems = cartItems.map(item => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        size: item.size,
        quantity: item.quantity
      }));

      await api.post('/orders', {
        orderItems,
        shippingAddress: { name, phone, address },
        paymentMethod: 'COD',
        totalPrice
      });

      clearCart();
      Alert.alert('Gửi đơn thành công', 'Đơn hàng của bạn đang được xử lý!', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs' as never) }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi Đặt hàng', error?.response?.data?.message || 'Không thể tạo đơn hàng lúc này');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Thông Tin Giao Hàng</Text>

      <Text style={styles.label}>Họ và tên người nhận *</Text>
      <TextInput 
        style={styles.input} 
        value={name} 
        onChangeText={setName} 
        placeholder="Nguyễn Văn A" 
      />

      <Text style={styles.label}>Số điện thoại *</Text>
      <TextInput 
        style={styles.input} 
        value={phone} 
        onChangeText={setPhone} 
        placeholder="0912345678" 
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Địa chỉ giao hàng (Chi tiết) *</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        value={address} 
        onChangeText={setAddress} 
        placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/TP" 
        multiline
      />

      <View style={styles.summaryBox}>
        <Text style={styles.summaryTitle}>Tóm tắt đơn hàng</Text>
        <Text style={styles.summaryText}>Số lượng sản phẩm: {cartItems.reduce((acc, item) => acc + item.quantity, 0)}</Text>
        <Text style={styles.summaryText}>Tổng tiền thanh toán: <Text style={styles.price}>{totalPrice.toLocaleString('vi-VN')} đ</Text></Text>
        <Text style={styles.summaryText}>Phương thức: Thanh toán khi nhận hàng (COD)</Text>
      </View>

      <TouchableOpacity 
        style={[styles.checkoutBtn, loading && styles.checkoutBtnDisabled]} 
        onPress={handlePlaceOrder}
        disabled={loading}
      >
        <Text style={styles.checkoutBtnText}>{loading ? 'ĐANG TIẾN HÀNH...' : 'XÁC NHẬN ĐẶT HÀNG'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#5f6c7b',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
    color: '#2b2c34',
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#495057',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    marginBottom: 20,
    color: '#2b2c34',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  summaryBox: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 10,
    color: '#2b2c34',
  },
  summaryText: {
    fontSize: 14,
    marginBottom: 10,
    color: '#5f6c7b',
    fontWeight: '500',
  },
  price: {
    color: '#3da9fc',
    fontWeight: '800',
    fontSize: 16,
  },
  checkoutBtn: {
    backgroundColor: '#3da9fc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
    elevation: 4,
    shadowColor: '#3da9fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#90cff9',
    elevation: 0,
    shadowOpacity: 0,
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});

export default CheckoutScreen;
