import React, { useContext, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Image, ListRenderItem, TextInput, ScrollView, Modal, Dimensions, TouchableWithoutFeedback, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { CompareContext } from '../context/CompareContext';
import api from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../navigation/AppNavigator';
import { HomeStackParamList } from '../navigation/TabNavigator';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

const { width } = Dimensions.get('window');
const carouselImages = [
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff',
  'https://images.unsplash.com/photo-1608231387042-66d1773070a5',
  'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2'
];

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

type HomeScreenNavProp = CompositeNavigationProp<
  NativeStackNavigationProp<HomeStackParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen: React.FC = () => {
  const { userInfo } = useContext(AuthContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('default');
  const [filterRating, setFilterRating] = useState(0);
  const [filterVisible, setFilterVisible] = useState(false);
  const { compareList, toggleCompare, compareModalVisible, setCompareModalVisible } = useContext(CompareContext);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const timerRef = useRef<any>(null);

  const goToNext = () => {
    if (carouselImages.length > 0) {
      let nextIndex = (currentSlideIndex + 1) % carouselImages.length;
      flatListRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
    }
  };

  const goToPrev = () => {
    if (carouselImages.length > 0) {
      let prevIndex = (currentSlideIndex - 1 + carouselImages.length) % carouselImages.length;
      flatListRef.current?.scrollToOffset({ offset: prevIndex * width, animated: true });
    }
  };

  useEffect(() => {
    // Tắt timer cũ (nếu có) khi index thay đổi hoặc component unmount
    if (timerRef.current) clearTimeout(timerRef.current);

    // Chỉ bắt đầu timer nếu không đang loading dữ liệu
    if (!loading) {
      timerRef.current = setTimeout(() => {
        goToNext();
      }, 2000); // Đợi đúng 2s sau khi đã dừng ở ảnh hiện tại
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentSlideIndex, loading]);
  
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

    if (filterRating > 0) {
      result = result.filter(p => (p.rating || 0) >= filterRating);
    }

    if (sortOrder === 'asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortOrder === 'desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, searchQuery, selectedCategory, sortOrder, filterRating]);

  const handleClearFilter = () => {
    setSelectedCategory('');
    setSortOrder('default');
    setFilterRating(0);
  };

  const handleClearAllRecent = async () => {
    setRecentProducts([]);
    const historyKey = userInfo && userInfo._id ? `recent_${userInfo._id}` : 'recent_guest';
    await AsyncStorage.removeItem(historyKey);
  };

  const handleRemoveRecent = async (id: string) => {
    const updated = recentProducts.filter(p => p._id !== id);
    setRecentProducts(updated);
    const historyKey = userInfo && userInfo._id ? `recent_${userInfo._id}` : 'recent_guest';
    await AsyncStorage.setItem(historyKey, JSON.stringify(updated));
  };


  const getCategoryName = (catId?: string) => {
    const cat = categories.find(c => c._id === catId);
    return cat ? cat.name : 'Chưa phân loại';
  };

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
        <TouchableOpacity 
          style={styles.addCompareBtn}
          onPress={() => toggleCompare(item)}
        >
          <Ionicons name={compareList.find(p => p._id === item._id) ? "checkmark-circle" : "add-circle-outline"} size={16} color={compareList.find(p => p._id === item._id) ? "#3da9fc" : "#94a1b2"} />
          <Text style={[styles.addCompareText, compareList.find(p => p._id === item._id) && styles.addCompareTextActive]}>
            {compareList.find(p => p._id === item._id) ? "Đã so sánh" : "So sánh"}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // Render phần Banner / Carousel đầu trang
  const renderHeader = () => (
    <View>
      <View style={styles.carouselContainer}>
        <FlatList
          ref={flatListRef}
          data={carouselImages}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(_, index) => index.toString()}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          onScroll={(e) => {
            // Chỉ cập nhật visual dots nếu cần, nhưng logic chính phụ thuộc vào Momentum
            const x = e.nativeEvent.contentOffset.x;
            const index = Math.round(x / width);
            // Không set index ở đây để tránh reset timer liên tục khi đang lướt
          }}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
             const x = e.nativeEvent.contentOffset.x;
             const index = Math.round(x / width);
             if (index !== currentSlideIndex) {
                setCurrentSlideIndex(index);
             }
          }}
          renderItem={({item}) => (
             <View style={{ width: width, position: 'relative' }}>
                <Image source={{ uri: item }} style={styles.carouselImage} />
                <TouchableOpacity 
                   style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: width / 3, zIndex: 10 }} 
                   onPress={goToPrev}
                   activeOpacity={1}
                />
                <TouchableOpacity 
                   style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: width / 3, zIndex: 10 }} 
                   onPress={goToNext}
                   activeOpacity={1}
                />
             </View>
          )}
        />
        <View style={styles.paginationContainer}>
           {carouselImages.map((_, index) => (
             <View 
               key={index} 
               style={[
                 styles.dot, 
                 currentSlideIndex === index && styles.dotActive
               ]} 
             />
           ))}
        </View>
      </View>

      {/* Sản phẩm vừa xem (Chỉ hiện nếu có dữ liệu) */}
      {recentProducts.length > 0 && (
        <View style={styles.recentSection}>
          <View style={styles.recentHeader}>
            <Text style={styles.sectionTitle}>Sản Phẩm Vừa Xem</Text>
            <TouchableOpacity onPress={handleClearAllRecent}>
              <Text style={styles.clearAllText}>Xóa tất cả</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recentScroll}>
            {recentProducts.map(item => (
              <TouchableOpacity 
                key={item._id} 
                style={styles.recentCard}
                onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
              >
                <TouchableOpacity style={styles.removeRecentBtn} onPress={() => handleRemoveRecent(item._id)}>
                  <Ionicons name="close-circle" size={24} color="#ff4757" />
                </TouchableOpacity>
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
        <View style={styles.searchRow}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#94a1b2" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setFilterVisible(true)}>
            <Ionicons name="options-outline" size={24} color="#ffffff" />
          </TouchableOpacity>
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

      {/* Floating Compare Button */}
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
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCompareModalVisible(false)}>
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
                   <Text style={styles.compareCellLabel}>Danh mục</Text>
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
                     <Text style={styles.compareCellText} numberOfLines={2}>{getCategoryName(p.category)}</Text>
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

      {/* Filter Modal (Bottom Sheet) */}
      <Modal visible={filterVisible} transparent={true} animationType="slide" onRequestClose={() => setFilterVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setFilterVisible(false)}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Lọc Sản Phẩm</Text>
                <TouchableOpacity onPress={() => setFilterVisible(false)}>
                  <Ionicons name="close" size={28} color="#2b2c34" />
                </TouchableOpacity>
              </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.filterLabel}>Danh mục</Text>
              <View style={styles.chipContainer}>
                <TouchableOpacity 
                  style={[styles.chip, selectedCategory === '' && styles.chipActive]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text style={[styles.chipText, selectedCategory === '' && styles.chipTextActive]}>Tất cả</Text>
                </TouchableOpacity>
                {categories.map(cat => (
                  <TouchableOpacity 
                    key={cat._id}
                    style={[styles.chip, selectedCategory === cat._id && styles.chipActive]}
                    onPress={() => setSelectedCategory(cat._id)}
                  >
                    <Text style={[styles.chipText, selectedCategory === cat._id && styles.chipTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Sắp xếp theo giá</Text>
              <View style={styles.chipContainer}>
                <TouchableOpacity 
                  style={[styles.chip, sortOrder === 'default' && styles.chipActive]}
                  onPress={() => setSortOrder('default')}
                >
                  <Text style={[styles.chipText, sortOrder === 'default' && styles.chipTextActive]}>Mặc định</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.chip, sortOrder === 'asc' && styles.chipActive]}
                  onPress={() => setSortOrder('asc')}
                >
                  <Text style={[styles.chipText, sortOrder === 'asc' && styles.chipTextActive]}>Thấp đến cao</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.chip, sortOrder === 'desc' && styles.chipActive]}
                  onPress={() => setSortOrder('desc')}
                >
                  <Text style={[styles.chipText, sortOrder === 'desc' && styles.chipTextActive]}>Cao đến thấp</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.filterLabel}>Đánh giá</Text>
              <View style={styles.chipContainer}>
                <TouchableOpacity 
                  style={[styles.chip, filterRating === 0 && styles.chipActive]}
                  onPress={() => setFilterRating(0)}
                >
                  <Text style={[styles.chipText, filterRating === 0 && styles.chipTextActive]}>Tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.chip, filterRating === 4 && styles.chipActive]}
                  onPress={() => setFilterRating(4)}
                >
                  <Text style={[styles.chipText, filterRating === 4 && styles.chipTextActive]}>Từ 4 ⭐️</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.chip, filterRating === 4.5 && styles.chipActive]}
                  onPress={() => setFilterRating(4.5)}
                >
                  <Text style={[styles.chipText, filterRating === 4.5 && styles.chipTextActive]}>Từ 4.5 ⭐️</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.chip, filterRating === 5 && styles.chipActive]}
                  onPress={() => setFilterRating(5)}
                >
                  <Text style={[styles.chipText, filterRating === 5 && styles.chipTextActive]}>5 ⭐️</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.clearFilterBtn} onPress={handleClearFilter}>
                  <Text style={styles.clearFilterText}>Xoá Lọc</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.applyFilterBtn} onPress={() => setFilterVisible(false)}>
                  <Text style={styles.applyFilterText}>Áp Dụng</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 20,
    backgroundColor: '#3da9fc', 
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  welcome: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  filterSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 20,
    marginTop: -35, 
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e9ecef',
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#2b2c34',
  },
  filterBtn: {
    backgroundColor: '#3da9fc',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#3da9fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  
  // Custom Banner / Carousel 
  carouselContainer: {
    height: 380,
    marginTop: 0,
    marginBottom: 20,
    position: 'relative',
    backgroundColor: '#ffffff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  carouselImage: {
    width: width,
    height: 380,
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 25,
    alignSelf: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dotActive: {
    width: 20, 
    borderRadius: 10,
    backgroundColor: '#3da9fc',
  },

  // Recently Viewed Section
  recentSection: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    marginBottom: 5,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginRight: 15,
  },
  clearAllText: {
    color: '#ff4757',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    marginLeft: 15,
    color: '#2b2c34',
    letterSpacing: 0.3,
  },
  recentScroll: {
    paddingLeft: 10,
  },
  recentCard: {
    width: 120,
    marginHorizontal: 5,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    alignItems: 'center',
    position: 'relative'
  },
  removeRecentBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    zIndex: 10,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  recentImg: {
    width: 100,
    height: 100,
    resizeMode: 'contain', // Đổi từ cover sang contain để không bị mất ảnh
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f9fa', // Thêm nền xám nhẹ
  },
  recentName: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    color: '#2b2c34'
  },
  recentPrice: {
    fontSize: 13,
    color: '#3da9fc', // Đổi màu cam thành xanh dương
    fontWeight: '700',
    marginTop: 4,
  },

  // Layout Grid 2 cột
  rowWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    width: '48%', 
    marginTop: 18,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'column', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  image: {
    width: '100%',
    height: 180, 
    resizeMode: 'contain', 
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#f8f9fa', 
  },
  cardInfo: {
    padding: 12,
    justifyContent: 'center',
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#2b2c34',
    lineHeight: 20
  },
  price: {
    fontSize: 16,
    color: '#3da9fc', // Màu primary mới
    fontWeight: '800',
    marginBottom: 6,
  },
  brand: {
    fontSize: 12,
    color: '#94a1b2',
    fontWeight: '500'
  },
  description: {
    display: 'none', 
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 24,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2b2c34',
    letterSpacing: 0.5,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#495057',
    marginTop: 15,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f4f6f9',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  chipActive: {
    backgroundColor: '#e3f2fd',
    borderColor: '#3da9fc',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5f6c7b',
  },
  chipTextActive: {
    color: '#3da9fc',
  },
  applyFilterBtn: {
    flex: 1,
    backgroundColor: '#3da9fc',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#3da9fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  applyFilterText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalFooter: {
    flexDirection: 'row',
    marginTop: 30,
    marginBottom: 10,
    gap: 15,
  },
  clearFilterBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e9ecef',
  },
  clearFilterText: {
    color: '#5f6c7b',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  // Custom Compare Styles
  addCompareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 4,
  },
  addCompareText: {
    fontSize: 12,
    color: '#94a1b2',
    fontWeight: '600'
  },
  addCompareTextActive: {
    color: '#3da9fc'
  },
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
  compareModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    height: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  compareScrollContent: {
    paddingRight: 10,
    paddingBottom: 20,
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
    paddingHorizontal: 2,
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

export default HomeScreen;
