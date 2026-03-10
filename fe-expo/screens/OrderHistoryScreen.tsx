import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';

interface OrderItem {
  _id: string;
  name: string;
  price: number;
  size: number;
  quantity: number;
}

interface Order {
  _id: string;
  totalPrice: number;
  orderStatus: 'processing' | 'shipping' | 'delivered' | 'cancelled';
  createdAt: string;
  items: OrderItem[];
}

const OrderHistoryScreen: React.FC = () => {
  const { userInfo } = useContext(AuthContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/myorders');
      setOrders(data);
    } catch (error) {
      console.log('Lỗi fetch đơn hàng:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleUserUpdateStatus = async (orderId: string, status: 'cancelled' | 'delivered') => {
    const actionText = status === 'cancelled' ? 'Hủy đơn hàng' : 'Đã nhận hàng';
    const confirmMsg = status === 'cancelled' 
      ? 'Bạn có chắc chắn muốn hủy đơn hàng này?' 
      : 'Xác nhận bạn đã nhận được hàng và hài lòng?';
    
    Alert.alert('Xác nhận', confirmMsg, [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          try {
            await api.put(`/orders/${orderId}/status/user`, { status });
            Alert.alert('Thành công', `${actionText} thành công.`);
            fetchOrders();
          } catch (error: any) {
             Alert.alert('Lỗi', error?.response?.data?.message || `Không thể thực hiện`);
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
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3da9fc" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="package-variant" size={80} color="#cbd5e0" />
            <Text style={styles.emptyText}>Bác chưa có đơn hàng nào.</Text>
            <Text style={styles.emptySub}>Hãy sắm ngay những đôi giày ưng ý nhé!</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.cardHeader}>
               <View style={styles.idBox}>
                 <Feather name="hash" size={14} color="#94a1b2" />
                 <Text style={styles.orderId}>{item._id.slice(-6).toUpperCase()}</Text>
               </View>
               {renderStatusBadge(item.orderStatus)}
            </View>

            <View style={styles.divider} />

            <View style={styles.itemsBox}>
               {item.items.map((prod, idx) => (
                 <View key={idx} style={styles.itemRow}>
                    <Ionicons name="footsteps-outline" size={16} color="#3da9fc" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName} numberOfLines={1}>{prod.name}</Text>
                      <Text style={styles.itemMeta}>Size: {prod.size} x{prod.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>{(prod.price * prod.quantity).toLocaleString('vi-VN')} đ</Text>
                 </View>
               ))}
            </View>

            <View style={styles.cardFooter}>
               <View>
                 <Text style={styles.dateLabel}>Ngày đặt: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                 <Text style={styles.totalValue}>{item.totalPrice.toLocaleString('vi-VN')} đ</Text>
               </View>

               <View style={styles.actionGroup}>
                  {item.orderStatus === 'processing' && (
                    <TouchableOpacity 
                      style={[styles.btn, styles.cancelBtn]} 
                      onPress={() => handleUserUpdateStatus(item._id, 'cancelled')}
                    >
                      <Text style={styles.cancelBtnText}>Hủy đơn</Text>
                    </TouchableOpacity>
                  )}
                  
                  {item.orderStatus === 'shipping' && (
                    <TouchableOpacity 
                      style={[styles.btn, styles.deliverBtn]} 
                      onPress={() => handleUserUpdateStatus(item._id, 'delivered')}
                    >
                      <Text style={styles.deliverBtnText}>Đã nhận hàng</Text>
                    </TouchableOpacity>
                  )}
               </View>
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
  listContent: {
    padding: 15,
    paddingBottom: 40,
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 18,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  idBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '800',
    color: '#2b2c34',
    marginLeft: 4,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
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
  badgeCancelled: { backgroundColor: '#cbd5e0' },
  
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 14,
  },
  itemsBox: {
    marginBottom: 15,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2b2c34',
  },
  itemMeta: {
    fontSize: 12,
    color: '#94a1b2',
    fontWeight: '600',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#495057',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 15,
  },
  dateLabel: {
    fontSize: 11,
    color: '#94a1b2',
    fontWeight: '600',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ef4565',
  },
  actionGroup: {
    flexDirection: 'row',
  },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  cancelBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#ef4565',
  },
  cancelBtnText: {
    color: '#ef4565',
    fontWeight: '800',
    fontSize: 13,
  },
  deliverBtn: {
    backgroundColor: '#28a745',
  },
  deliverBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2b2c34',
    marginTop: 20,
  },
  emptySub: {
    fontSize: 14,
    color: '#94a1b2',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default OrderHistoryScreen;
