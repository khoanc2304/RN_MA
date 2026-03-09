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
    backgroundColor: '#fff',
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  summaryBox: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
  },
  summaryText: {
    fontSize: 15,
    marginBottom: 8,
    color: '#555',
  },
  price: {
    color: '#e53935',
    fontWeight: 'bold',
    fontSize: 16,
  },
  checkoutBtn: {
    backgroundColor: '#28a745',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 40,
  },
  checkoutBtnDisabled: {
    backgroundColor: '#8cdcb3',
  },
  checkoutBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default CheckoutScreen;
