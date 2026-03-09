import React, { useContext, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, ListRenderItem, TextInput, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/AppNavigator';

// Định nghĩa cấu trúc Sản phẩm
export interface Product {
  _id: string;
  name: string;
  price: number;
  brand: string;
  category?: string;
  images: string[];
  description?: string;
  rating?: number;
  reviewCount?: number;
  sizes?: { size: number, stock: number }[];
}

type HomeScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const HomeScreen: React.FC = () => {
  const { userInfo } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  
  const navigation = useNavigation<HomeScreenNavProp>();

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get<Product[]>('/products'),
        api.get('/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.log('Lỗi fetch dữ liệu trang chủ:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentProducts = async () => {
    try {
      const historyKey = userInfo && userInfo._id ? `recent_${userInfo._id}` : 'recent_guest';
      const historyStr = await AsyncStorage.getItem(historyKey);
      if (historyStr) {
        setRecentProducts(JSON.parse(historyStr));
      } else {
        setRecentProducts([]);
      }
    } catch (error) {
       console.log('Lỗi fetch near view', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      fetchRecentProducts();
    }, [userInfo])
  );

  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(lowerQuery));
    }

    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (sortOrder === 'asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortOrder]);

  const renderProduct: ListRenderItem<Product> = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      activeOpacity={0.8}
      onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
    >
      <Image 
        source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150' }} 
        style={styles.image} 
      />
      <View style={styles.cardInfo}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.price}>{item.price.toLocaleString('vi-VN')} đ</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description || 'Chưa có mô tả cho sản phẩm này.'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render phần Banner / Carousel đầu trang
  const renderHeader = () => (
    <View>
      <View style={styles.carouselContainer}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff' }} style={styles.carouselImage} />
          <Image source={{ uri: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5' }} style={styles.carouselImage} />
          <Image source={{ uri: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2' }} style={styles.carouselImage} />
        </ScrollView>
      </View>

      {/* Sản phẩm vừa xem (Chỉ hiện nếu có dữ liệu) */}
      {recentProducts.length > 0 && (
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Sản Phẩm Vừa Xem</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
            {recentProducts.map(item => (
              <TouchableOpacity 
                key={item._id} 
                style={styles.recentCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
              >
                <Image 
                  source={{ uri: item.images && item.images.length > 0 ? item.images[0] : 'https://via.placeholder.com/150' }} 
                  style={styles.recentImg} 
                />
                <Text style={styles.recentName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.recentPrice}>{item.price.toLocaleString('vi-VN')}đ</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tiêu đề cho Grid phía dưới */}
      <Text style={[styles.sectionTitle, { marginLeft: 10, marginTop: 15 }]}>Tất Cả Sản Phẩm</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcome}>
          {userInfo ? `Xin chào, ${userInfo.name}` : 'Chào mừng đến Cửa hàng Giày!'}
        </Text>
      </View>

      <View style={styles.filterSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm (VD: Nike)..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        
        <View style={styles.pickerRow}>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={setSelectedCategory}
              style={styles.picker}
            >
              <Picker.Item label="Tất cả danh mục" value="" />
              {categories.map(cat => (
                <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
              ))}
            </Picker>
          </View>

          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={sortOrder}
              onValueChange={setSortOrder}
              style={styles.picker}
            >
              <Picker.Item label="Sắp xếp: Mặc định" value="default" />
              <Picker.Item label="Giá: Thấp -> Cao" value="asc" />
              <Picker.Item label="Giá: Cao -> Thấp" value="desc" />
            </Picker>
          </View>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.rowWrapper}
          ListHeaderComponent={renderHeader}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterSection: {
    backgroundColor: '#fff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    zIndex: 10,
  },
  searchInput: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 15,
    marginBottom: 10,
  },
  pickerRow: {
    gap: 10,
  },
  pickerWrapper: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    height: 50,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  
  // Custom Banner / Carousel 
  carouselContainer: {
    height: 180,
    marginTop: 10,
    marginBottom: 10,
  },
  carouselImage: {
    width: 380, // Tạm custom độ rộng, lý tưởng nên lấy window.width 
    height: 180,
    resizeMode: 'cover',
    borderRadius: 8,
    marginHorizontal: 10,
  },

  // Recently Viewed Section
  recentSection: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 15,
    color: '#333',
  },
  recentScroll: {
    paddingLeft: 10,
  },
  recentCard: {
    width: 130,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#eee',
    alignItems: 'center'
  },
  recentImg: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    borderRadius: 6,
    marginBottom: 8,
  },
  recentName: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  recentPrice: {
    fontSize: 13,
    color: '#d9534f',
    fontWeight: 'bold',
    marginTop: 4,
  },

  // Layout Grid 2 cột
  rowWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#fff',
    width: '48%', // Chiếm gần nửa ngang màn hình
    marginTop: 15,
    borderRadius: 10,
    overflow: 'hidden',
    flexDirection: 'column', // Đổi về dọc
    elevation: 3, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: 150, // Định cao ảnh
    resizeMode: 'cover',
  },
  cardInfo: {
    padding: 10,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  price: {
    fontSize: 15,
    color: '#d9534f',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  brand: {
    fontSize: 12,
    color: '#666',
  },
  description: {
    display: 'none', // Ẩn mô tả khi vào Layout rút gọn
  },
});

export default HomeScreen;
