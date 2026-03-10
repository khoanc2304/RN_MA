import React, { useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../context/CartContext';
import { useNavigation } from '@react-navigation/native';
import { CartItem } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const CartScreen: React.FC = () => {
  const { 
    cartItems, 
    increaseQuantity, 
    decreaseQuantity, 
    removeFromCart, 
    selectedTotalPrice, 
    selectedTotalItems,
    toggleSelectItem,
    toggleSelectAll
  } = useContext(CartContext);
  const { token } = useContext(AuthContext);
  const navigation = useNavigation();

  const isAllSelected = cartItems.length > 0 && cartItems.every(item => item.selected);

  const handleCheckout = async () => {
    if (!token) {
      Alert.alert('Chưa đăng nhập', 'Vui lòng đăng nhập để thanh toán');
      return;
    }

    if (selectedTotalItems === 0) {
      Alert.alert('Chưa chọn sản phẩm', 'Vui lòng chọn ít nhất một sản phẩm để thanh toán.');
      return;
    }

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
        <Ionicons name="cart-outline" size={80} color="#cbd5e1" />
        <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống.</Text>
        <TouchableOpacity style={styles.shopButton} onPress={() => navigation.navigate('Home' as never)}>
          <Text style={styles.shopButtonText}>TIẾP TỤC MUA SẮM</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Select All Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.selectAllRow} 
          onPress={() => toggleSelectAll(!isAllSelected)}
          activeOpacity={0.7}
        >
          <Ionicons 
            name={isAllSelected ? "checkbox" : "square-outline"} 
            size={24} 
            color={isAllSelected ? "#3da9fc" : "#94a1b2"} 
          />
          <Text style={styles.selectAllText}>Chọn tất cả ({cartItems.length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cartItems}
        keyExtractor={(item) => `${item.product._id}_${item.size}`}
        renderItem={({ item }) => (
          <View style={[styles.cartItem, !item.selected && styles.cartItemUnselected]}>
            {/* Checkbox */}
            <TouchableOpacity 
              style={styles.checkboxContainer} 
              onPress={() => toggleSelectItem(item.product._id, item.size)}
            >
              <Ionicons 
                name={item.selected ? "checkbox" : "square-outline"} 
                size={24} 
                color={item.selected ? "#3da9fc" : "#94a1b2"} 
              />
            </TouchableOpacity>

            <Image 
              source={{ uri: item.product.images && item.product.images.length > 0 ? item.product.images[0] : 'https://via.placeholder.com/100' }} 
              style={styles.image} 
            />
            
            <View style={styles.itemInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>{item.product.name}</Text>
                <TouchableOpacity onPress={() => handleRemove(item)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4565" />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.itemSizeTx}>Size: {item.size}</Text>
              <Text style={styles.price}>{(item.product.price).toLocaleString('vi-VN')} đ</Text>
              
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
                
                <Text style={styles.itemSubtotal}>
                  {(item.product.price * item.quantity).toLocaleString('vi-VN')} đ
                </Text>
              </View>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Tổng cộng ({selectedTotalItems} món):</Text>
            <Text style={styles.selectedCountText}>Đã chọn các sản phẩm để thanh toán</Text>
          </View>
          <Text style={styles.totalAmount}>{selectedTotalPrice.toLocaleString('vi-VN')} đ</Text>
        </View>
        <TouchableOpacity 
          style={[styles.checkoutBtn, selectedTotalItems === 0 && styles.checkoutBtnDisabled]} 
          onPress={handleCheckout}
          disabled={selectedTotalItems === 0}
        >
          <Text style={styles.checkoutText}>
            MUA HÀNG ({selectedTotalItems})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectAllText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b2c34',
    marginLeft: 10,
  },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', padding: 20 },
  emptyText: { fontSize: 18, color: '#94a1b2', marginVertical: 20, fontWeight: '600' },
  shopButton: { backgroundColor: '#3da9fc', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 12, elevation: 4, shadowColor: '#3da9fc', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  shopButtonText: { color: '#ffffff', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 },
  
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 15,
    padding: 12,
    borderRadius: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
  },
  cartItemUnselected: {
    opacity: 0.7,
    backgroundColor: '#f1f5f9',
  },
  checkboxContainer: {
    paddingRight: 10,
  },
  image: { width: 85, height: 85, borderRadius: 12, backgroundColor: '#f8fafc' },
  itemInfo: { flex: 1, marginLeft: 12 },
  nameRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  name: { fontSize: 15, fontWeight: '700', color: '#2b2c34', flex: 1, marginRight: 10 },
  itemSizeTx: { fontSize: 13, color: '#94a1b2', marginTop: 2, fontWeight: '500' },
  price: { fontSize: 14, color: '#5f6c7b', fontWeight: '600', marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  
  quantityContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 8, overflow: 'hidden' },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 5 },
  qtyText: { fontSize: 18, fontWeight: '700', color: '#3da9fc' },
  quantity: { paddingHorizontal: 12, fontSize: 14, fontWeight: '700', color: '#2b2c34' },
  itemSubtotal: { fontSize: 16, color: '#3da9fc', fontWeight: '800' },
  
  removeText: { color: '#ef4565', fontSize: 13, fontWeight: '600' },
  
  footer: { 
    backgroundColor: '#ffffff', 
    padding: 20, 
    borderTopLeftRadius: 30, 
    borderTopRightRadius: 30,
    elevation: 20, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: -10 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 15 
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  totalLabel: { fontSize: 15, color: '#5f6c7b', fontWeight: '600' },
  selectedCountText: { fontSize: 12, color: '#94a1b2', marginTop: 2 },
  totalAmount: { fontSize: 24, fontWeight: '900', color: '#3da9fc' },
  checkoutBtn: { backgroundColor: '#3da9fc', padding: 18, borderRadius: 15, alignItems: 'center', elevation: 5, shadowColor: '#3da9fc', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 10 },
  checkoutBtnDisabled: { backgroundColor: '#cbd5e1', elevation: 0, shadowOpacity: 0 },
  checkoutText: { color: '#ffffff', fontWeight: '800', fontSize: 16, letterSpacing: 1 }
});

export default CartScreen;
