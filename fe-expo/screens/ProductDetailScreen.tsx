import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Product } from './HomeScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetail'>;

const ProductDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params;
  const { token, userInfo } = useContext(AuthContext);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchProductDetail();
  }, [productId]);

  const fetchProductDetail = async () => {
    try {
      const { data } = await api.get<Product>(`/products/${productId}`);
      setProduct(data);
    } catch (error) {
      console.log('Lỗi fetch chi tiết sản phẩm:', error);
      Alert.alert('Lỗi', 'Không thể tải chi tiết sản phẩm');
    } finally {
      setLoading(false);
    }
  };

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
    
    // Logic Call API Thêm vào Giỏ (Sẽ hoàn thiện sau)
    Alert.alert('Thành công', 'Sản phẩm đã được thêm vào Giỏ hàng');
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
        source={{ uri: product.images && product.images.length > 0 ? product.images[0] : 'https://via.placeholder.com/400' }} 
        style={styles.image} 
      />
      
      <View style={styles.infoContainer}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.price}>{product.price.toLocaleString('vi-VN')} đ</Text>
        
        <Text style={styles.descriptionLabel}>Mô tả sản phẩm:</Text>
        <Text style={styles.description}>{product.description}</Text>

        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addToCartTxt}>Thêm Vào Giỏ Hàng</Text>
        </TouchableOpacity>

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
    backgroundColor: '#fff',
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  infoContainer: {
    padding: 20,
  },
  brand: {
    fontSize: 16,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  price: {
    fontSize: 22,
    color: '#d9534f',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  descriptionLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 30,
  },
  addToCartBtn: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addToCartTxt: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
  }
});

export default ProductDetailScreen;
