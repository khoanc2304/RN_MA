import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';

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
    }
  };

  const handleUserUpdateStatus = async (orderId: string, status: 'cancelled' | 'delivered') => {
    const actionText = status === 'cancelled' ? 'huỷ đơn hàng' : 'xác nhận đã nhận hàng';
    
    Alert.alert('Xác nhận', `Bạn có chắc chắn muốn ${actionText} này?`, [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          try {
            await api.put(`/orders/${orderId}/status/user`, { status });
            Alert.alert('Thành công', `Đã ${actionText} thành công.`);
            fetchOrders(); // Reload data
          } catch (error: any) {
             Alert.alert('Lỗi', error?.response?.data?.message || `Không thể ${actionText}`);
          }
        }
      }
    ]);
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'processing': return <Text style={[styles.badge, styles.badgeProcessing]}>Đang Xử Lý</Text>;
      case 'shipping': return <Text style={[styles.badge, styles.badgeShipping]}>Đang Giao Hàng</Text>;
      case 'delivered': return <Text style={[styles.badge, styles.badgeDelivered]}>Đã Giao</Text>;
      case 'cancelled': return <Text style={[styles.badge, styles.badgeCancelled]}>Đã Huỷ</Text>;
      default: return null;
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderId}>Đơn hàng #{item._id.slice(-6).toUpperCase()}</Text>
              {renderStatusBadge(item.orderStatus)}
            </View>
            <Text style={styles.orderDate}>Ngày đặt: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
            
            <View style={styles.orderItemsBox}>
              {item.items.map(prod => (
                <Text key={prod._id} style={styles.itemText}>- {prod.name} (Size: {prod.size}) x {prod.quantity}</Text>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.totalPrice}>Tổng tiền: {item.totalPrice.toLocaleString('vi-VN')} đ</Text>
              
              <View style={styles.actionRow}>
                {item.orderStatus === 'processing' && (
                  <TouchableOpacity 
                    style={[styles.btn, styles.cancelBtn]} 
                    onPress={() => handleUserUpdateStatus(item._id, 'cancelled')}
                  >
                    <Text style={styles.btnText}>Huỷ Đơn</Text>
                  </TouchableOpacity>
                )}
                
                {item.orderStatus === 'shipping' && (
                  <TouchableOpacity 
                    style={[styles.btn, styles.deliverBtn]} 
                    onPress={() => handleUserUpdateStatus(item._id, 'delivered')}
                  >
                    <Text style={styles.btnText}>Đã Nhận Hàng</Text>
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
    backgroundColor: '#f4f4f4',
    padding: 15,
  },
  center: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#666'
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333'
  },
  orderDate: {
    fontSize: 14,
    color: '#777',
    marginBottom: 10,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    overflow: 'hidden',
  },
  badgeProcessing: { backgroundColor: '#ffc107', color: '#000' },
  badgeShipping: { backgroundColor: '#17a2b8' },
  badgeDelivered: { backgroundColor: '#28a745' },
  badgeCancelled: { backgroundColor: '#dc3545' },
  orderItemsBox: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 4,
    marginBottom: 10,
  },
  itemText: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
  totalPrice: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#e53935',
  },
  actionRow: {
    flexDirection: 'row',
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 10,
  },
  cancelBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dc3545',
  },
  deliverBtn: {
    backgroundColor: '#28a745',
  },
  btnText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  }
});

export default OrderHistoryScreen;
