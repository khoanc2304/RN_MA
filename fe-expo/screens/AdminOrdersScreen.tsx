import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

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
  }
}

const AdminOrdersScreen: React.FC = () => {
  const { userInfo } = useContext(AuthContext);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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
    }
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
            fetchOrders(); // Reload data
          } catch (error: any) {
             Alert.alert('Lỗi', error?.response?.data?.message || 'Không thể cập nhật trạng thái');
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
        <Text style={styles.emptyText}>Chưa có đơn hàng nào hệ thống.</Text>
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
              <Text style={styles.orderId}>#{item._id.slice(-6).toUpperCase()}</Text>
              {renderStatusBadge(item.orderStatus)}
            </View>
            <Text style={styles.customerName}>User: {item.userId?.name || 'Vô Danh'} - {item.userId?.email || ''}</Text>
            <Text style={styles.orderDate}>Ngày đặt: {new Date(item.createdAt).toLocaleDateString('vi-VN')} {new Date(item.createdAt).toLocaleTimeString('vi-VN')}</Text>
            
            <View style={styles.addressBox}>
              <Text style={styles.addressTitle}>Giao đến:</Text>
              <Text style={styles.addressText}>{item.shippingAddress.name} - {item.shippingAddress.phone}</Text>
              <Text style={styles.addressText}>{item.shippingAddress.address}</Text>
            </View>

            <View style={styles.orderItemsBox}>
              {item.items.map(prod => (
                <Text key={prod._id} style={styles.itemText}>- {prod.name} (Size: {prod.size}) x {prod.quantity}</Text>
              ))}
            </View>

            <View style={styles.orderFooter}>
              <Text style={styles.totalPrice}>{item.totalPrice.toLocaleString('vi-VN')} đ</Text>
              
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.btn, styles.shipBtn, item.orderStatus !== 'processing' && styles.disabledBtn]} 
                  disabled={item.orderStatus !== 'processing'}
                  onPress={() => handleAdminUpdateStatus(item._id, 'shipping')}
                >
                  <Text style={[styles.btnText, item.orderStatus !== 'processing' && styles.disabledText]}>Chuyển Giao Hàng</Text>
                </TouchableOpacity>
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
    padding: 10,
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
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#007bff'
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#333'
  },
  customerName: {
    fontWeight: 'bold',
    color: '#007bff'
  },
  orderDate: {
    fontSize: 13,
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
  
  addressBox: {
    backgroundColor: '#fff3cd',
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  addressTitle: {
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  addressText: {
    color: '#856404',
    fontSize: 13,
  },

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
    fontSize: 18,
    color: '#e53935',
  },
  actionRow: {
    flexDirection: 'row',
  },
  btn: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  shipBtn: {
    backgroundColor: '#17a2b8',
  },
  disabledBtn: {
    backgroundColor: '#e9ecef',
  },
  disabledText: {
    color: '#6c757d'
  },
  btnText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#fff',
  }
});

export default AdminOrdersScreen;
