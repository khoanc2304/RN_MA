import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import api from '../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Thêm Sản Phẩm</Text>
        <Text style={styles.subTitle}>Nhập thông tin cho mẫu giày mới</Text>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Tên sản phẩm *</Text>
        <View style={styles.inputWrapper}>
          <Feather name="box" size={20} color="#94a1b2" style={styles.inputIcon} />
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="VD: Nike Air Max" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Thương hiệu *</Text>
        <View style={styles.inputWrapper}>
          <Feather name="tag" size={20} color="#94a1b2" style={styles.inputIcon} />
          <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="VD: Nike" />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Danh mục *</Text>
        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={categoryId}
            onValueChange={(itemValue) => setCategoryId(itemValue)}
            style={styles.picker}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat._id} label={cat.name} value={cat._id} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Giá (VNĐ) *</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="pricetag-outline" size={20} color="#94a1b2" style={styles.inputIcon} />
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="VD: 2500000" />
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.label}>Kích thước & Tồn kho</Text>
        <TouchableOpacity 
          style={styles.addSizeBtn} 
          onPress={() => setSizes([...sizes, { size: '', stock: '' }])}
        >
          <Ionicons name="add-circle" size={18} color="#3da9fc" />
          <Text style={styles.addSizeBtnText}>Thêm size</Text>
        </TouchableOpacity>
      </View>
      
      {sizes.map((s, index) => (
        <View key={index} style={styles.sizeRow}>
          <View style={[styles.inputWrapper, { flex: 1, marginBottom: 0 }]}>
            <TextInput 
              style={styles.input} 
              placeholder="Size" 
              keyboardType="numeric"
              value={s.size}
              onChangeText={(txt) => {
                const newSizes = [...sizes];
                newSizes[index].size = txt;
                setSizes(newSizes);
              }}
            />
          </View>
          <View style={[styles.inputWrapper, { flex: 1, marginBottom: 0 }]}>
            <TextInput 
              style={styles.input} 
              placeholder="Kho" 
              keyboardType="numeric"
              value={s.stock}
              onChangeText={(txt) => {
                const newSizes = [...sizes];
                newSizes[index].stock = txt;
                setSizes(newSizes);
              }}
            />
          </View>
          <TouchableOpacity 
            style={styles.removeSizeBtn}
            onPress={() => setSizes(sizes.filter((_, i) => i !== index))}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4757" />
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Mô tả sản phẩm</Text>
        <TextInput 
          style={[styles.input, styles.textArea]} 
          value={description} 
          onChangeText={setDescription} 
          multiline 
          numberOfLines={4} 
          placeholder="Nhập mô tả chi tiết..." 
          textAlignVertical="top"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Link Hình ảnh (URL)</Text>
        <View style={styles.inputWrapper}>
          <Feather name="image" size={20} color="#94a1b2" style={styles.inputIcon} />
          <TextInput style={styles.input} value={imageUrl} onChangeText={setImageUrl} placeholder="https://..." />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleAddProduct}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : (
          <View style={styles.buttonContent}>
            <Ionicons name="save-outline" size={22} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.buttonText}>Lưu Sản Phẩm</Text>
          </View>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 24,
    paddingBottom: 60,
  },
  header: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2b2c34',
  },
  subTitle: {
    fontSize: 15,
    color: '#94a1b2',
    marginTop: 4,
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: '#495057',
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    paddingHorizontal: 15,
    height: 56,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2b2c34',
    fontWeight: '600',
  },
  textArea: {
    height: 120,
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 15,
    fontSize: 16,
    color: '#2b2c34',
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    height: 56,
    justifyContent: 'center',
  },
  picker: {
    height: 56,
    color: '#2b2c34',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 10,
  },
  addSizeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addSizeBtnText: {
    color: '#3da9fc',
    fontWeight: '700',
    fontSize: 13,
    marginLeft: 6,
  },
  sizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  removeSizeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff1f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffe4e6',
  },
  button: {
    backgroundColor: '#3da9fc',
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    elevation: 6,
    shadowColor: '#3da9fc',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#94d1ff',
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default AddProductScreen;
