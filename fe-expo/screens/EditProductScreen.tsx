import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const EditProductScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cập Nhật Sản Phẩm</Text>
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
    color: '#ffc107'
  }
});

export default EditProductScreen;
