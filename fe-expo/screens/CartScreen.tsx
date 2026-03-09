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
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9f9f9', padding: 20 },
  emptyText: { fontSize: 18, color: '#666', marginBottom: 20 },
  shopButton: { backgroundColor: '#FF8C00', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  shopButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 10,
    borderRadius: 10,
    elevation: 2,
  },
  image: { width: 80, height: 80, borderRadius: 8, resizeMode: 'cover' },
  itemInfo: { flex: 1, marginLeft: 15, justifyContent: 'space-between' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  itemSizeTx: { fontSize: 14, color: '#777', marginTop: 2 },
  price: { fontSize: 15, color: '#e53935', fontWeight: 'bold', marginTop: 5 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  
  quantityContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 4 },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 4, backgroundColor: '#f1f1f1' },
  qtyText: { fontSize: 16, fontWeight: 'bold' },
  quantity: { paddingHorizontal: 15, fontSize: 16, fontWeight: '600' },
  
  removeText: { color: '#888', textDecorationLine: 'underline', fontSize: 14 },
  
  footer: { backgroundColor: '#fff', padding: 15, borderTopWidth: 1, borderTopColor: '#eee', elevation: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  totalLabel: { fontSize: 16, color: '#333' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#e53935' },
  checkoutBtn: { backgroundColor: '#000', padding: 15, borderRadius: 8, alignItems: 'center' },
  checkoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default CartScreen;
