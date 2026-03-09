import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { CartContext } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { CartItem } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const CartScreen: React.FC = () => {
  const { cartItems, increaseQuantity, decreaseQuantity, removeFromCart, totalPrice, clearCart } = useContext(CartContext);
  const { token, userInfo } = useContext(AuthContext);
  const navigation = useNavigation();

  const handleCheckout = async () => {
    if (!token) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để thanh toán');
      return;
    }

    if (cartItems.length === 0) {
      Alert.alert('Giỏ hàng trống', 'Vui lòng chọn sản phẩm trước khi thanh toán.');
      return;
    }

    // Chuyển sang màn hình Điền Form Checkout thay vì gọi API luôn
    navigation.navigate('Checkout' as never);
  };

  const handleDecrease = (item: CartItem) => {
    if (item.quantity === 1) {
      Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xoá sản phẩm này khỏi giỏ hàng?', [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xoá', style: 'destructive', onPress: () => removeFromCart(item.product._id, item.size) }
      ]);
    } else {
      decreaseQuantity(item.product._id, item.size);
    }
  };

  const handleRemove = (item: CartItem) => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xoá sản phẩm này khỏi giỏ hàng?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xoá', style: 'destructive', onPress: () => removeFromCart(item.product._id, item.size) }
    ]);
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống.</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home' as never)}>
          <Text style={styles.shopButtonText}>TIẾP TỤC MUA SẮM</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        keyExtractor={(item) => `${item.product._id}_${item.size}`}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image 
              source={{ uri: item.product.images && item.product.images.length > 0 ? item.product.images[0] : 'https://via.placeholder.com/100' }} 
              style={styles.image} 
            />
            <View style={styles.itemInfo}>
              <Text style={styles.name} numberOfLines={2}>{item.product.name}</Text>
              <Text style={styles.itemSizeTx}>Size: {item.size}</Text>
              <Text style={styles.price}>{(item.product.price * item.quantity).toLocaleString('vi-VN')} đ</Text>
              
              <View style={styles.actionRow}>
                <View style={styles.quantityContainer}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => handleDecrease(item)}>
                    <Text style={styles.qtyText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.quantity}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => increaseQuantity(item.product._id, item.size)}>
                    <Text style={styles.qtyText}>+</Text>
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity onPress={() => handleRemove(item)}>
                  <Text style={styles.removeText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng:</Text>
          <Text style={styles.totalAmount}>{totalPrice.toLocaleString('vi-VN')} đ</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
          <Text style={styles.checkoutText}>TIẾN HÀNH THANH TOÁN</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f9' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f6f9', padding: 20 },
  emptyText: { fontSize: 18, color: '#5f6c7b', marginBottom: 20, fontWeight: '500' },
  shopButton: { backgroundColor: '#3da9fc', paddingHorizontal: 25, paddingVertical: 14, borderRadius: 12, elevation: 3, shadowColor: '#3da9fc', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  shopButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 12,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  image: { width: 90, height: 90, borderRadius: 12, resizeMode: 'cover' },
  itemInfo: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  name: { fontSize: 15, fontWeight: '700', color: '#2b2c34', lineHeight: 22 },
  itemSizeTx: { fontSize: 13, color: '#94a1b2', marginTop: 4, fontWeight: '500' },
  price: { fontSize: 16, color: '#3da9fc', fontWeight: '800', marginTop: 6 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  
  quantityContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e9ecef', borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#f8f9fa' },
  qtyText: { fontSize: 16, fontWeight: '700', color: '#495057' },
  quantity: { paddingHorizontal: 15, fontSize: 15, fontWeight: '700', color: '#2b2c34' },
  
  removeText: { color: '#ef4565', textDecorationLine: 'underline', fontSize: 13, fontWeight: '600' },
  
  footer: { backgroundColor: '#ffffff', padding: 20, borderTopWidth: 1, borderTopColor: '#e9ecef', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.05, shadowRadius: 5 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  totalLabel: { fontSize: 16, color: '#5f6c7b', fontWeight: '600' },
  totalAmount: { fontSize: 22, fontWeight: '800', color: '#3da9fc' },
  checkoutBtn: { backgroundColor: '#3da9fc', padding: 16, borderRadius: 12, alignItems: 'center', elevation: 3, shadowColor: '#3da9fc', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  checkoutText: { color: '#ffffff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 }
});

export default CartScreen;
