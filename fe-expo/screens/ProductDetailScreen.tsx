import React, { useEffect, useState, useContext, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { Product } from './HomeScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params;
  const { token, userInfo } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  const handleDeleteProduct = () => {
    Alert.alert(
      'Xác nhận xoá',
      'Bạn có chắc chắn muốn xoá sản phẩm này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xoá',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${productId}`);
              Alert.alert('Thành công', 'Đã xoá sản phẩm');
              navigation.goBack(); // Quay lại trang Home
            } catch (error) {
              Alert.alert('Lỗi', 'Không thể xoá sản phẩm này');
            }
          }
        }
      ]
    );
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
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Các nút dành cho Admin */}
        {userInfo?.role === 'admin' && (
          <View style={styles.adminActionContainer}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditProduct', { productId })}
            >
              <Text style={styles.editBtnTxt}>Chỉnh Sửa (Admin)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={handleDeleteProduct}
            >
              <Text style={styles.deleteBtnTxt}>Xoá Sản Phẩm</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
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
    resizeMode: 'cover',
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
    resizeMode: 'cover',
    borderRadius: 8,
    marginBottom: 12,
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
  }
});

export default ProductDetailScreen;
