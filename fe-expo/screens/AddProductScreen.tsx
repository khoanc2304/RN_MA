import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';

type AddProductNavProp = NativeStackNavigationProp<RootStackParamList, 'AddProduct'>;

const AddProductScreen: React.FC = () => {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<{_id: string, name: string}[]>([]);
  const [sizes, setSizes] = useState<{ size: string, stock: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation<AddProductNavProp>();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories');
      setCategories(data);
      if (data.length > 0) {
        setCategoryId(data[0]._id);
      }
    } catch (error) {
      console.log('Lỗi fetch danh mục:', error);
    }
  };

  const handleAddProduct = async () => {
    if (!name || !price || !brand || !categoryId) {
      Alert.alert('Lỗi', 'Vui lòng nhập đủ Tên, Thương hiệu, Giá và Danh mục');
      return;
    }

    try {
      setLoading(true);

      const formattedSizes = sizes
        .filter(s => s.size.trim() !== '' && s.stock.trim() !== '')
        .map(s => ({
          size: Number(s.size),
          stock: Number(s.stock)
        }));

      const payload = {
        name,
        brand,
        categoryId,
        price: Number(price),
        description,
        sizes: formattedSizes,
        images: imageUrl ? [imageUrl] : []
      };

      await api.post('/products', payload);
      Alert.alert('Thành công', 'Đã thêm sản phẩm mới', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.log('Lỗi thêm sản phẩm:', error?.response?.data || error);
      Alert.alert('Lỗi', error?.response?.data?.message || error?.message || 'Không thể thêm sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Thêm Sản Phẩm Mới</Text>
      
      <Text style={styles.label}>Tên sản phẩm *</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="VD: Nike Air Max" />

      <Text style={styles.label}>Thương hiệu *</Text>
      <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="VD: Nike" />

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
      <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="VD: 2500000" />

      <Text style={styles.label}>Kích thước & Số lượng (Tồn kho)</Text>
      {sizes.map((s, index) => (
        <View key={index} style={styles.sizeRow}>
          <TextInput 
            style={[styles.input, styles.sizeInput]} 
            placeholder="Size (VD: 39)" 
            keyboardType="numeric"
            value={s.size}
            onChangeText={(txt) => {
              const newSizes = [...sizes];
              newSizes[index].size = txt;
              setSizes(newSizes);
            }}
          />
          <TextInput 
            style={[styles.input, styles.sizeInput]} 
            placeholder="Tồn kho (VD: 10)" 
            keyboardType="numeric"
            value={s.stock}
            onChangeText={(txt) => {
              const newSizes = [...sizes];
              newSizes[index].stock = txt;
              setSizes(newSizes);
            }}
          />
          <TouchableOpacity 
            style={styles.removeSizeBtn}
            onPress={() => setSizes(sizes.filter((_, i) => i !== index))}
          >
            <Text style={styles.removeSizeText}>Xoá</Text>
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity 
        style={styles.addSizeBtn} 
        onPress={() => setSizes([...sizes, { size: '', stock: '' }])}
      >
        <Text style={styles.addSizeBtnText}>+ Thêm Size</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Mô tả</Text>
      <TextInput 
        style={[styles.input, styles.textArea]} 
        value={description} 
        onChangeText={setDescription} 
        multiline 
        numberOfLines={4} 
        placeholder="Nhập mô tả..." 
      />

      <Text style={styles.label}>Link Hình ảnh (URL)</Text>
      <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." />

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleAddProduct}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Lưu Sản Phẩm</Text>}
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
    color: '#333'
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
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 40,
  },
  buttonDisabled: {
    backgroundColor: '#8cdcb3',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  sizeInput: {
    flex: 1,
    marginBottom: 0,
  },
  removeSizeBtn: {
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 8,
  },
  removeSizeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addSizeBtn: {
    backgroundColor: '#e7f1ff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#007bff',
    borderStyle: 'dashed',
  },
  addSizeBtnText: {
    color: '#007bff',
    fontWeight: 'bold',
  }
});

export default AddProductScreen;
