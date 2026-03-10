import React, { useEffect, useState, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Modal, TouchableWithoutFeedback } from 'react-native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { HomeStackParamList } from '../navigation/TabNavigator';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { CompareContext } from '../context/CompareContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Product } from './HomeScreen';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';

type ProductDetailNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'ProductDetail'>,
  NativeStackNavigationProp<RootStackParamList>
>;

type Props = {
  route: NativeStackScreenProps<HomeStackParamList, 'ProductDetail'>['route'];
  navigation: ProductDetailNavProp;
};

const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params;
  const { token, userInfo } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { compareList, toggleCompare, compareModalVisible, setCompareModalVisible } = useContext(CompareContext);

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      const { data } = await api.get<Product>(`/products/${productId}`);
      setProduct(data);
      if (data.images && data.images.length > 0) {
        setSelectedImage(data.images[0]);
      } else {
        setSelectedImage('https://via.placeholder.com/400');
      }

      // Lấy danh mục ID
      const categoryId = (data.category as any)?._id || data.category;
      if (categoryId) {
        const relatedRes = await api.get<Product[]>(`/products?category=${categoryId}`);
        // Lọc bỏ sản phẩm hiện tại
        setRelatedProducts(relatedRes.data.filter(p => p._id !== productId));
      }
      // Lưu vào Lịch sử Xem gần đây
      try {
        const historyKey = userInfo && userInfo._id ? `recent_${userInfo._id}` : 'recent_guest';
        const historyStr = await AsyncStorage.getItem(historyKey);
        let historyArr: Product[] = historyStr ? JSON.parse(historyStr) : [];
        
        // Loại bỏ nếu đã tồn tại để đẩy lên đầu
        historyArr = historyArr.filter(p => p._id !== data._id);
        
        // Chèn vào đầu
        historyArr.unshift(data);

        // Giới hạn lưu 10 sản phẩm gần nhất
        if (historyArr.length > 10) {
          historyArr.pop();
        }

        await AsyncStorage.setItem(historyKey, JSON.stringify(historyArr));
      } catch (e) {
        console.log('Lỗi lưu lịch sử xem:', e);
      }

    } catch (error) {
      console.log('Lỗi fetch chi tiết sản phẩm:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const currentStock = useMemo(() => {
    if (!product || !product.sizes || product.sizes.length === 0) return 0;
    
    if (selectedSize) {
      const sizeObj = product.sizes.find(s => s.size === selectedSize);
      return sizeObj ? sizeObj.stock : 0;
    }
    
    // Tổng số lượng giày theo tất cả các size nếu chưa chọn
    return product.sizes.reduce((total, s) => total + s.stock, 0);
  }, [product, selectedSize]);

  const handleAddToCart = () => {
    if (!token) {
      Alert.alert(
        'Yêu cầu Đăng nhập',
        'Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng Nhập Ngay', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }

    if (!selectedSize) {
      Alert.alert('Chưa chọn Size', 'Vui lòng chọn size bạn muốn mua.');
      return;
    }

    if (product) {
      addToCart(product, selectedSize, 1);
      Alert.alert('Thành công', 'Sản phẩm đã được thêm vào Giỏ hàng', [
        { text: 'Tiếp tục mua sắm', onPress: () => navigation.navigate('MainTabs', { screen: 'HomeTab' } as any), style: 'cancel' },
        { text: 'Đến Giỏ hàng', onPress: () => navigation.navigate('MainTabs', { screen: 'CartTab' } as any) }
      ]);
    }
  };


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy sản phẩm</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
      <Image
        source={{ uri: selectedImage }}
        style={styles.mainImage}
      />

      {/* Thumbnail Gallery */}
      {product.images && product.images.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.thumbnailContainer}
        >
          {product.images.map((img, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setSelectedImage(img)}
              activeOpacity={0.7}
            >
              <Image
                source={{ uri: img }}
                style={[
                  styles.thumbnailItem,
                  selectedImage === img && styles.thumbnailSelected
                ]}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.infoContainer}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{product.price.toLocaleString('vi-VN')} đ</Text>

        <Text style={styles.descriptionLabel}>Mô tả sản phẩm:</Text>
        <Text style={styles.description}>{product.description}</Text>

        {product.sizes && product.sizes.length > 0 && (
          <View style={styles.sizeSection}>
            <Text style={styles.descriptionLabel}>Chọn Size:</Text>
            <View style={styles.sizeRow}>
              {product.sizes.map((s, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={[
                    styles.sizeBtn, 
                    selectedSize === s.size && styles.sizeBtnSelected,
                    s.stock === 0 && styles.sizeBtnDisabled
                  ]}
                  disabled={s.stock === 0}
                  onPress={() => setSelectedSize(selectedSize === s.size ? null : s.size)}
                >
                  <Text style={[
                    styles.sizeText,
                    selectedSize === s.size && styles.sizeTextSelected,
                    s.stock === 0 && styles.sizeTextDisabled
                  ]}>{s.size}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.stockInfoContainer}>
          <Text style={styles.stockLabel}>Tồn kho:</Text>
          <Text style={styles.stockValue}>{currentStock} Sản phẩm</Text>
        </View>

        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addToCartTxt}>Thêm Vào Giỏ Hàng</Text>
        </TouchableOpacity>

        {/* Nút So sánh cho sản phẩm hiện tại */}
        <TouchableOpacity 
          style={[styles.compareActionBtn, compareList.find(p => p._id === productId) && styles.compareActionBtnActive]} 
          onPress={() => product && toggleCompare(product)}
        >
          <Ionicons 
            name={compareList.find(p => p._id === productId) ? "git-compare" : "git-compare-outline"} 
            size={22} 
            color={compareList.find(p => p._id === productId) ? "#ffffff" : "#3da9fc"} 
          />
          <Text style={[styles.compareActionTxt, compareList.find(p => p._id === productId) && styles.compareActionTxtActive]}>
            {compareList.find(p => p._id === productId) ? "Đã trong danh sách so sánh" : "Thêm vào so sánh"}
          </Text>
        </TouchableOpacity>

        {/* Các Sản Phẩm Gợi Ý */}
        {relatedProducts.length > 0 && (
          <View style={styles.relatedContainer}>
            <Text style={styles.relatedTitle}>Sản Phẩm Tương Tự:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {relatedProducts.map(item => (
                <TouchableOpacity
                  key={item._id}
                  style={styles.relatedCard}
                  onPress={() => navigation.push('ProductDetail', { productId: item._id })}
                >
                  <Image
                    source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150' }}
                    style={styles.relatedImage}
                  />
                  <Text style={styles.relatedName} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.relatedPrice}>{item.price.toLocaleString('vi-VN')} đ</Text>
                  
                  <TouchableOpacity 
                    style={styles.relatedCompareBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      toggleCompare(item);
                    }}
                  >
                    <Ionicons 
                      name={compareList.find(p => p._id === item._id) ? "checkmark-circle" : "add-circle-outline"} 
                      size={14} 
                      color={compareList.find(p => p._id === item._id) ? "#3da9fc" : "#94a1b2"} 
                    />
                    <Text style={[styles.relatedCompareText, compareList.find(p => p._id === item._id) && styles.relatedCompareTextActive]}>
                      So sánh
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

      </View>

      </ScrollView>

      {/* Floating Compare Button (giống Home) - FIXED */}
      {compareList.length > 0 && (
        <TouchableOpacity style={styles.fabCompare} onPress={() => setCompareModalVisible(true)}>
          <Ionicons name="git-compare" size={26} color="#ffffff" />
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>{compareList.length}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Compare Modal */}
      <Modal visible={compareModalVisible} transparent={true} animationType="slide" onRequestClose={() => setCompareModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlayCompare} activeOpacity={1} onPressOut={() => setCompareModalVisible(false)}>
          <TouchableWithoutFeedback>
            <View style={styles.compareModalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>So Sánh Sản Phẩm</Text>
                <TouchableOpacity onPress={() => setCompareModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#2b2c34" />
                </TouchableOpacity>
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compareScrollContent}>
                 <View style={styles.compareLabelCol}>
                   <View style={styles.compareCellImg} />
                   <Text style={styles.compareCellLabel}>Tên SP</Text>
                   <Text style={styles.compareCellLabel}>Thương hiệu</Text>
                   <Text style={styles.compareCellLabel}>Giá</Text>
                   <Text style={styles.compareCellLabel}>Đánh giá</Text>
                   <Text style={[styles.compareCellLabel, {height: 60}]}>Kích cỡ</Text>
                   <Text style={styles.compareCellLabel}></Text>
                 </View>

                 {compareList.map(p => (
                   <View key={p._id} style={styles.compareProductCol}>
                     <View style={styles.compareCellImg}>
                       <Image source={{ uri: p.images && p.images.length > 0 ? p.images[0] : 'https://via.placeholder.com/150' }} style={styles.compareImg} />
                     </View>
                     <Text style={styles.compareCellText} numberOfLines={2}>{p.name}</Text>
                     <Text style={styles.compareCellText}>{p.brand || '---'}</Text>
                     <Text style={styles.compareCellTextPrice}>{p.price.toLocaleString('vi-VN')} đ</Text>
                     <Text style={styles.compareCellText}>{p.rating ? `${p.rating} ⭐` : 'Chưa có'}</Text>
                     <Text style={[styles.compareCellText, {height: 60}]} numberOfLines={3}>
                       {p.sizes?.filter(s => s.stock > 0).map(s => s.size).join(', ') || 'Hết hàng'}
                     </Text>
                     
                     <TouchableOpacity style={styles.removeCompareBtn} onPress={() => toggleCompare(p)}>
                       <Text style={styles.removeCompareText}>Bỏ chọn</Text>
                     </TouchableOpacity>
                   </View>
                 ))}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  mainImage: {
    width: '100%',
    height: 380,
    resizeMode: 'contain', // Đổi từ cover sang contain
    backgroundColor: '#f8f9fa',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginTop: 15,
  },
  thumbnailItem: {
    width: 75,
    height: 75,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  thumbnailSelected: {
    borderColor: '#3da9fc',
  },
  infoContainer: {
    padding: 20,
  },
  brand: {
    fontSize: 14,
    color: '#94a1b2',
    textTransform: 'uppercase',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 10,
    color: '#2b2c34',
    lineHeight: 32,
  },
  price: {
    fontSize: 26,
    color: '#3da9fc',
    fontWeight: '800',
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2b2c34',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#5f6c7b',
    marginBottom: 30,
  },
  addToCartBtn: {
    backgroundColor: '#3da9fc',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#3da9fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addToCartTxt: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  adminActionContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
    marginTop: 10,
  },
  editBtn: {
    backgroundColor: '#ffc107',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  editBtnTxt: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 30,
  },
  deleteBtnTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sizeSection: {
    marginBottom: 20,
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sizeBtn: {
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  sizeBtnSelected: {
    borderColor: '#3da9fc',
    backgroundColor: '#3da9fc',
  },
  sizeBtnDisabled: {
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
  },
  sizeText: {
    fontSize: 16,
    color: '#495057',
    fontWeight: '600',
  },
  sizeTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  sizeTextDisabled: {
    color: '#adb5bd',
    textDecorationLine: 'line-through',
  },
  stockInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stockLabel: {
    fontSize: 16,
    color: '#5f6c7b',
    marginRight: 10,
    fontWeight: '500',
  },
  stockValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3da9fc',
  },
  relatedContainer: {
    paddingTop: 25,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    marginTop: 10,
    marginBottom: 30,
  },
  relatedTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#2b2c34',
  },
  relatedCard: {
    width: 150,
    marginRight: 15,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  relatedImage: {
    width: '100%',
    height: 120,
    resizeMode: 'contain', // Đổi từ cover sang contain
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
  },
  relatedName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#2b2c34',
    lineHeight: 20,
  },
  relatedPrice: {
    fontSize: 15,
    color: '#3da9fc',
    fontWeight: '800',
  },
  compareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3da9fc',
    marginBottom: 25,
    gap: 10,
  },
  compareActionBtnActive: {
    backgroundColor: '#3da9fc',
  },
  compareActionTxt: {
    fontSize: 16,
    color: '#3da9fc',
    fontWeight: '700',
  },
  compareActionTxtActive: {
    color: '#ffffff',
  },
  relatedCompareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  relatedCompareText: {
    fontSize: 12,
    color: '#94a1b2',
    fontWeight: '600',
  },
  relatedCompareTextActive: {
    color: '#3da9fc',
  },

  // Comparison Styles (Sync from Home)
  fabCompare: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#3da9fc',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#3da9fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    zIndex: 100,
  },
  fabBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ff4757',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  fabBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  modalOverlayCompare: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  compareModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2b2c34',
  },
  compareScrollContent: {
    paddingRight: 10,
  },
  compareLabelCol: {
    width: 90,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
    marginRight: 15,
  },
  compareProductCol: {
    width: 140,
    marginRight: 15,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#f1f5f9',
    paddingRight: 15,
  },
  compareCellImg: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  compareImg: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
    borderRadius: 10,
  },
  compareCellLabel: {
    height: 48,
    fontSize: 13,
    fontWeight: '700',
    color: '#94a1b2',
    textAlignVertical: 'center',
  },
  compareCellText: {
    height: 48,
    fontSize: 13,
    fontWeight: '600',
    color: '#2b2c34',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  compareCellTextPrice: {
    height: 48,
    fontSize: 14,
    fontWeight: '800',
    color: '#3da9fc',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  removeCompareBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#ffefef',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcaca',
  },
  removeCompareText: {
    color: '#ff4757',
    fontSize: 13,
    fontWeight: '700'
  }
});

export default ProductDetailScreen;
