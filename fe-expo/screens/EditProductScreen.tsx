import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProduct'>;

const EditProductScreen: React.FC<Props> = ({ route, navigation }) => {
  const { productId } = route.params;

  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [status, setStatus] = useState('active');
  
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [productId]);

  const fetchInitialData = async () => {
    try {
      const [productRes, categoryRes] = await Promise.all([
        api.get(`/products/${productId}`),
        api.get('/categories')
      ]);
      
      const productData = productRes.data;
      setCategories(categoryRes.data);
      
      setName(productData.name);
      setBrand(productData.brand);
      setPrice(productData.price.toString());
      
      const existingCatId = productData.category?._id || productData.category;
      setCategoryId(existingCatId || (categoryRes.data.length > 0 ? categoryRes.data[0]._id : ''));
      
      setDescription(productData.description || '');
      setImageUrl(productData.images && productData.images.length > 0 ? productData.images[0] : '');
      setStatus(productData.status || 'active');
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu sản phẩm');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = async () => {
    if (!name || !price || !brand || !categoryId) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ Tên, Thương hiệu, Giá và Danh mục');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name,
        brand,
        categoryId,
        price: Number(price),
        description,
        status,
        images: imageUrl ? [imageUrl] : []
      };

      await api.put(`/products/${productId}`, payload);
      Alert.alert('Thành công', 'Đã cập nhật sản phẩm', [
        { text: 'OK', onPress: () => navigation.navigate('MainTabs') }
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật sản phẩm');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Cập Nhật Sản Phẩm</Text>
      
      <Text style={styles.label}>Tên sản phẩm *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>Thương hiệu *</Text>
      <TextInput style={styles.input} value={brand} onChangeText={setBrand} />

      <Text style={styles.label}>Danh mục *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={categoryId}
          onValueChange={(itemValue) => setCategoryId(itemValue)}
        >
          {categories.map((cat) => (
            <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Giá (VNĐ) *</Text>
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" />

      <Text style={styles.label}>Trạng thái hiển thị</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={status}
          onValueChange={(itemValue) => setStatus(itemValue)}
        >
          <Picker.Item label="Đang bán (Active)" value="active" />
          <Picker.Item label="Đã ẩn (Inactive)" value="inactive" />
        </Picker>
      </View>

      <Text style={styles.label}>Mô tả</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        value={description} 
        onChangeText={setDescription} 
        multiline 
        numberOfLines={4} 
      />

      <Text style={styles.label}>Link Hình ảnh (URL)</Text>
      <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} />

      <TouchableOpacity 
        style={[styles.button, saving && styles.buttonDisabled]} 
        onPress={handleEditProduct}
        disabled={saving}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Lưu Thay Đổi</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ffc107',
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#444'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#f9f9f9',
    overflow: 'hidden',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#ffc107',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: '#ffe69c',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

export default EditProductScreen;
