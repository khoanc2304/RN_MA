import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  size: number;
  quantity: number;
}

interface UserInfo {
  _id: string;
  name: string;
  email: string;
}

interface Order {
  _id: string;
  userId: UserInfo;
  totalPrice: number;
  orderStatus: 'processing' | 'shipping' | 'delivered' | 'cancelled';
  createdAt: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
  };
}

const AdminOrdersScreen: React.FC = () => {
  const { userInfo } = useContext(AuthContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data);
    } catch (error) {
      console.log('Lỗi fetch đơn hàng admin:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleAdminUpdateStatus = async (orderId: string, status: 'shipping') => {
    Alert.alert('Xác nhận', 'Chuyển đơn hàng này sang trạng thái Đang Giao Hàng?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          try {
            await api.put(`/orders/${orderId}/status/admin`, { status });
            Alert.alert('Thành công', 'Đã cập nhật trạng thái đơn hàng.');
            fetchOrders();
          } catch (error: any) {
             Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật trạng thái');
          }
        }
      }
    ]);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'processing': return <View style={[styles.badge, styles.badgeProcessing]}><Text style={styles.badgeText}>Chờ xử lý</Text></View>;
      case 'shipping': return <View style={[styles.badge, styles.badgeShipping]}><Text style={styles.badgeText}>Đang giao</Text></View>;
      case 'delivered': return <View style={[styles.badge, styles.badgeDelivered]}><Text style={styles.badgeText}>Đã giao</Text></View>;
      case 'cancelled': return <View style={[styles.badge, styles.badgeCancelled]}><Text style={styles.badgeText}>Đã hủy</Text></View>;
      default: return null;
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3da9fc" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Quản Lý Đơn Hàng</Text>
        <Text style={styles.headerSub}>Theo dõi và xử lý đơn hàng từ khách</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3da9fc" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#cbd5e0" />
            <Text style={styles.emptyText}>Chưa có đơn hàng nào hệ thống.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
               <View>
                 <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
                 <Text style={styles.orderTime}>{new Date(item.createdAt).toLocaleDateString('vi-VN')} {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</Text>
               </View>
               {renderStatusBadge(item.orderStatus)}
            </View>

            <View style={styles.divider} />

            <View style={styles.customerBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="person" size={18} color="#3da9fc" />
              </View>
              <View style={styles.customerInfo}>
                 <Text style={styles.customerName}>{item.userId?.name || 'Khách hàng'}</Text>
                 <Text style={styles.customerEmail}>{item.userId?.email}</Text>
              </View>
            </View>

            <View style={styles.addressBox}>
              <View style={styles.iconCircle}>
                <Ionicons name="location" size={18} color="#ff4757" />
              </View>
              <View style={styles.addressInfo}>
                 <Text style={styles.addressName}>{item.shippingAddress.name} • {item.shippingAddress.phone}</Text>
                 <Text style={styles.addressText} numberOfLines={2}>{item.shippingAddress.address}</Text>
              </View>
            </View>

            <View style={styles.itemsList}>
               {item.items.map((prod, idx) => (
                 <View key={idx} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={1}>• {prod.name}</Text>
                    <Text style={styles.itemMeta}>Size: {prod.size} x{prod.quantity}</Text>
                 </View>
               ))}
            </View>

            <View style={styles.footerRow}>
               <View>
                 <Text style={styles.totalLabel}>Tổng thanh toán</Text>
                 <Text style={styles.totalValue}>{item.totalPrice.toLocaleString('vi-VN')} đ</Text>
               </View>

               {item.orderStatus === 'processing' && (
                  <TouchableOpacity 
                    style={styles.actionBtn} 
                    onPress={() => handleAdminUpdateStatus(item._id, 'shipping')}
                  >
                    <Text style={styles.actionBtnText}>Xác nhận giao</Text>
                  </TouchableOpacity>
               )}
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 25,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2b2c34',
  },
  headerSub: {
    fontSize: 14,
    color: '#94a1b2',
    marginTop: 4,
    fontWeight: '500',
  },
  listContent: {
    padding: 15,
    paddingBottom: 40,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2b2c34',
  },
  orderTime: {
    fontSize: 12,
    color: '#94a1b2',
    marginTop: 2,
    fontWeight: '600',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  badgeProcessing: { backgroundColor: '#ffc107' },
  badgeShipping: { backgroundColor: '#3da9fc' },
  badgeDelivered: { backgroundColor: '#28a745' },
  badgeCancelled: { backgroundColor: '#dc3545' },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  customerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  customerInfo: { flex: 1 },
  customerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2b2c34',
  },
  customerEmail: {
    fontSize: 12,
    color: '#94a1b2',
  },
  addressInfo: { flex: 1 },
  addressName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2b2c34',
  },
  addressText: {
    fontSize: 12,
    color: '#5f6c7b',
    marginTop: 2,
  },
  itemsList: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '600',
    flex: 1,
    marginRight: 10,
  },
  itemMeta: {
    fontSize: 12,
    color: '#94a1b2',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 12,
    color: '#94a1b2',
    fontWeight: '700',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ef4565',
  },
  actionBtn: {
    backgroundColor: '#3da9fc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#3da9fc',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: '#94a1b2',
    fontWeight: '600',
  },
});

export default AdminOrdersScreen;
