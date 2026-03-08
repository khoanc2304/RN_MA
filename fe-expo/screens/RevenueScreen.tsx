import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RevenueScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thống Kê Doanh Thu</Text>
      <Text>(Dành cho Admin. Sẽ có Chart biểu đồ chạy ở đây...)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#17a2b8'
  }
});

export default RevenueScreen;
