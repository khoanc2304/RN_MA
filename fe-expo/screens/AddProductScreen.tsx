import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AddProductScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thêm Sản Phẩm Mới</Text>
      <Text>(Dành cho Admin. Đang phát triển...)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#f8f9fa'
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#28a745'
  }
});

export default AddProductScreen;
