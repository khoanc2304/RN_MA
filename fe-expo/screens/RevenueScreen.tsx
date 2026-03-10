import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import api from '../services/api';
import { MaterialIcons, FontAwesome5, Ionicons, FontAwesome } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

interface Order {
  _id: string;
  totalPrice: number;
  orderStatus: string;
  userId: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface StatsData {
  totalRevenue: number;
  totalOrders: number;
  totalItemsSold: number;
  deliveredOrders: number;
  latestOrders: Order[];
  revenueTrend: { date: string, revenue: number }[];
}

const RevenueScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<StatsData | null>(null);

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/orders/stats');
      setStats(data);
    } catch (error) {
      console.log('Lỗi fetch thống kê:', error);
      Alert.alert('Lỗi', 'Không thể lấy dữ liệu doanh thu');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3da9fc" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3da9fc" />
      }
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Dashboard Admin</Text>
        <Text style={styles.subTitle}>Thống kê hoạt động kinh doanh</Text>
      </View>
      
      <View style={styles.cardContainer}>
        {/* Doanh thu */}
        <View style={[styles.card, styles.cardRevenue]}>
          <View style={styles.cardIconBadge}>
             <FontAwesome5 name="money-bill-wave" size={20} color="#28a745" />
          </View>
          <Text style={styles.cardLabel}>Doanh Thu</Text>
          <Text style={styles.cardValue}>{(stats?.totalRevenue || 0).toLocaleString('vi-VN')} đ</Text>
        </View>

        {/* Tổng Đơn */}
        <View style={[styles.card, styles.cardOrders]}>
          <View style={styles.cardIconBadge}>
             <Ionicons name="receipt" size={20} color="#17a2b8" />
          </View>
          <Text style={styles.cardLabel}>Đơn Hàng</Text>
          <Text style={styles.cardValue}>{stats?.totalOrders || 0}</Text>
        </View>

        {/* Sản phẩm đã bán */}
        <View style={[styles.card, styles.cardProducts]}>
          <View style={styles.cardIconBadge}>
            <MaterialIcons name="inventory" size={20} color="#6f42c1" />
          </View>
          <Text style={styles.cardLabel}>Sản Phẩm</Text>
          <Text style={styles.cardValue}>{stats?.totalItemsSold || 0}</Text>
        </View>

        {/* Đơn Thành Công */}
        <View style={[styles.card, styles.cardSuccess]}>
          <View style={styles.cardIconBadge}>
            <Ionicons name="checkmark-done-circle" size={20} color="#fd7e14" />
          </View>
          <Text style={styles.cardLabel}>Hoàn Tất</Text>
          <Text style={styles.cardValue}>{stats?.deliveredOrders || 0}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Xu hướng doanh thu (7 ngày)</Text>
        <View style={styles.chartContainer}>
          {stats?.revenueTrend && stats.revenueTrend.length > 0 ? (
            <View style={styles.barChart}>
              {stats.revenueTrend.map((item, index) => {
                const maxRevenue = Math.max(...stats.revenueTrend.map(t => t.revenue), 1);
                const barHeight = (item.revenue / maxRevenue) * 100;
                const dayLabel = new Date(item.date).toLocaleDateString('vi-VN', { weekday: 'short' });
                
                return (
                  <View key={index} style={styles.barWrapper}>
                    <View style={styles.barBackground}>
                      <View style={[styles.barValue, { height: `${barHeight}%` }]} />
                    </View>
                    <Text style={styles.dayLabel}>{dayLabel}</Text>
                    <Text style={styles.barPriceLabel}>{item.revenue > 0 ? `${(item.revenue / 1000).toFixed(0)}k` : '0'}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.chartPlaceholder}>
              <FontAwesome5 name="chart-line" size={48} color="#e9ecef" />
              <Text style={styles.chartText}>Đang tải dữ liệu biểu đồ...</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
          <View style={styles.tag}>
             <Text style={styles.tagText}>Mới nhất</Text>
          </View>
        </View>

        {stats?.latestOrders && stats.latestOrders.length > 0 ? (
          stats.latestOrders.map((order) => (
            <View key={order._id} style={styles.orderListItem}>
              <View style={styles.orderInfo}>
                <View style={styles.userIcon}>
                   <FontAwesome name="user-circle" size={32} color="#ddd" />
                </View>
                <View style={styles.orderDetails}>
                  <Text style={styles.orderUserName}>{order.userId?.name || 'Khách hàng'}</Text>
                  <Text style={styles.orderDate}>{new Date(order.createdAt).toLocaleDateString('vi-VN')} - {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
              <View style={styles.orderPriceContainer}>
                 <Text style={styles.orderPrice}>{order.totalPrice.toLocaleString('vi-VN')}đ</Text>
                 <View style={[styles.statusBadge, order.orderStatus === 'delivered' ? styles.statusDelivered : order.orderStatus === 'cancelled' ? styles.statusCancelled : styles.statusProcessing]}>
                    <Text style={styles.statusText}>
                       {order.orderStatus === 'processing' ? 'Chờ xử lý' : 
                        order.orderStatus === 'shipping' ? 'Đang giao' :
                        order.orderStatus === 'delivered' ? 'Đã giao' : 'Đã hủy'}
                    </Text>
                 </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#ddd" />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
          </View>
        )}
      </View>

      <View style={[styles.section, { marginBottom: 40 }]}>
        <Text style={styles.sectionTitle}>Ghi chú thống kê</Text>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#3da9fc" />
          <Text style={styles.infoText}>Doanh thu được tính dựa trên các đơn hàng không bị hủy. Dữ liệu biểu đồ phản ánh doanh thu thực tế theo ngày.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, 
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#2b2c34',
  },
  subTitle: {
    fontSize: 14,
    color: '#94a1b2',
    marginTop: 5,
    fontWeight: '500'
  },
  cardContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 20,
  },
  card: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardRevenue: { borderLeftWidth: 4, borderLeftColor: '#28a745' },
  cardOrders: { borderLeftWidth: 4, borderLeftColor: '#17a2b8' },
  cardProducts: { borderLeftWidth: 4, borderLeftColor: '#6f42c1' },
  cardSuccess: { borderLeftWidth: 4, borderLeftColor: '#fd7e14' },
  
  cardLabel: {
    color: '#94a1b2',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardValue: {
    color: '#2b2c34',
    fontSize: 18,
    fontWeight: '800',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2b2c34',
  },
  tag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  tagText: {
    color: '#3da9fc',
    fontSize: 12,
    fontWeight: '700',
  },
  orderListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userIcon: {
    marginRight: 12,
  },
  orderDetails: {
    flex: 1,
  },
  orderUserName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2b2c34',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#94a1b2',
  },
  orderPriceContainer: {
    alignItems: 'flex-end',
  },
  orderPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2b2c34',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  statusProcessing: { backgroundColor: '#ffc107' },
  statusDelivered: { backgroundColor: '#28a745' },
  statusCancelled: { backgroundColor: '#dc3545' },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginTop: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  barChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 150,
    paddingTop: 20,
  },
  barWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 12,
    height: '100%',
    backgroundColor: '#f1f5f9',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barValue: {
    width: '100%',
    backgroundColor: '#3da9fc',
    borderRadius: 6,
  },
  dayLabel: {
    fontSize: 10,
    color: '#94a1b2',
    marginTop: 8,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  barPriceLabel: {
    fontSize: 9,
    color: '#2b2c34',
    marginTop: 2,
    fontWeight: '600',
  },
  chartPlaceholder: {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 16,
    marginTop: 15,
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#3da9fc',
    fontWeight: '500',
    lineHeight: 18,
  },
  chartText: {
    color: '#adb5bd',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#94a1b2',
    marginTop: 10,
    fontSize: 14,
  }
});

export default RevenueScreen;
