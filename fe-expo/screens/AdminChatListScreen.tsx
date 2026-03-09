import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

type AdminNavProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

interface ChatSession {
  _id: string; // UserId
  name: string;
  latestMsg: {
    text: string;
    createdAt: string;
  }
}

const AdminChatListScreen: React.FC = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation<AdminNavProp>();
  const { userInfo } = useContext(AuthContext);
  const { socket } = useSocket();

  const fetchChats = async (isSilent = false) => {
    if (!userInfo || userInfo.role !== 'admin') return; 
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/messages/admin/users');
      setSessions(res.data);
    } catch (error) {
      console.error('Lỗi tải danh sách chat:', error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();

    // Lắng nghe tin nhắn mới từ socket toàn cục để cập nhật danh sách
    if (socket) {
      socket.on('receive_message', () => {
        fetchChats(true);
      });
    }

    return () => {
      if (socket) {
        socket.off('receive_message');
      }
    };
  }, [userInfo, socket]);

  const renderItem = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity 
      style={styles.chatCard}
      onPress={() => navigation.navigate('AdminChatRoom', { userId: item._id, userName: item.name })}
    >
      <View style={styles.avatarPlaceholder}>
        <Ionicons name="person" size={24} color="#ffffff" />
      </View>
      <View style={styles.chatInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.lastMsg} numberOfLines={1}>{item.latestMsg.text}</Text>
      </View>
      <View style={styles.timeInfo}>
        <Text style={styles.timeText}>
          {new Date(item.latestMsg.createdAt).toLocaleDateString('vi-VN')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hộp Thư Khách Hàng</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3da9fc" style={{ marginTop: 50 }} />
      ) : sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={60} color="#94a1b2" />
          <Text style={styles.emptyText}>Chưa có tin nhắn nào từ khách hàng.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 15 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    padding: 25, paddingTop: 50,
    backgroundColor: '#3da9fc',
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
    marginBottom: 15,
    elevation: 8, shadowColor: '#3da9fc', shadowOpacity: 0.3, shadowRadius: 10
  },
  headerTitle: { color: '#ffffff', fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  chatCard: {
    flexDirection: 'row', backgroundColor: '#ffffff',
    padding: 16, borderRadius: 20, marginBottom: 12,
    alignItems: 'center', 
    elevation: 3, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8
  },
  avatarPlaceholder: {
    width: 55, height: 55, borderRadius: 28, 
    backgroundColor: '#094067', // Màu xanh đậm premium
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  chatInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: '#094067', marginBottom: 4 },
  lastMsg: { fontSize: 14, color: '#5f6c7b', opacity: 0.8 },
  timeInfo: { alignItems: 'flex-end', justifyContent: 'center' },
  timeText: { fontSize: 11, color: '#94a1b2', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingBottom: 100 },
  emptyText: { marginTop: 15, fontSize: 16, color: '#94a1b2', fontWeight: '500', textAlign: 'center' }
});

export default AdminChatListScreen;
