import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import api from '../services/api';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';

interface Order {
  _id: string;
  totalPrice: number;
  orderStatus: string;
  items: any[];
  createdAt: string;
}

const RevenueScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalItemsSold: 0,
    deliveredOrders: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/orders');
      
      let totalRevenue = 0;
      let totalItemsSold = 0;
      let deliveredOrders = 0;

      data.forEach((order: Order) => {
        // Chỉ tính doanh thu cho các đơn đã Giao Hàng hoặc Đang Giao
        if (order.orderStatus !== 'cancelled') {
          totalRevenue += order.totalPrice;
          
          order.items.forEach(item => {
            totalItemsSold += item.quantity;
          });

          if (order.orderStatus === 'delivered') {
            deliveredOrders += 1;
          }
        }
      });

      setStats({
        totalRevenue,
        totalOrders: data.length,
        totalItemsSold,
        deliveredOrders
      });
    } catch (error) {
      console.log('Lỗi fetch thống kê:', error);
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu doanh thu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#17a2b8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.pageTitle}>Bảng Thống Kê Hoạt Động</Text>
      
      <View style={styles.cardContainer}>
        {/* Doanh thu */}
        <View style={[styles.card, styles.cardRevenue]}>
          <FontAwesome5 name="money-bill-wave" size={32} color="#fff" />
          <Text style={styles.cardLabel}>Tổng Doanh Thu</Text>
          <Text style={styles.cardValue}>{stats.totalRevenue.toLocaleString('vi-VN')} đ</Text>
        </View>

        {/* Tổng Đơn */}
        <View style={[styles.card, styles.cardOrders]}>
          <Ionicons name="receipt" size={32} color="#fff" />
          <Text style={styles.cardLabel}>Tổng Số Đơn Hàng</Text>
          <Text style={styles.cardValue}>{stats.totalOrders} Đơn</Text>
        </View>

        {/* Sản phẩm đã bán */}
        <View style={[styles.card, styles.cardProducts]}>
          <MaterialIcons name="inventory" size={32} color="#fff" />
          <Text style={styles.cardLabel}>Sản Phẩm Đã Bán</Text>
          <Text style={styles.cardValue}>{stats.totalItemsSold} Sản Phẩm</Text>
        </View>

        {/* Đơn Thành Công */}
        <View style={[styles.card, styles.cardSuccess]}>
          <Ionicons name="checkmark-done-circle" size={32} color="#fff" />
          <Text style={styles.cardLabel}>Giao Hàng Thành Công</Text>
          <Text style={styles.cardValue}>{stats.deliveredOrders} Đơn</Text>
        </View>
      </View>

      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartText}>📈 Biểu Đồ Doanh Thu Theo Tháng Sẽ Hiển Thị Ở Đây...</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#f4f6f9',
    padding: 15,
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRevenue: { backgroundColor: '#28a745' },
  cardOrders: { backgroundColor: '#17a2b8' },
  cardProducts: { backgroundColor: '#6f42c1' },
  cardSuccess: { backgroundColor: '#fd7e14' },
  
  cardLabel: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    marginTop: 10,
    marginBottom: 5,
    textAlign: 'center'
  },
  cardValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed'
  },
  chartText: {
    color: '#888',
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default RevenueScreen;
