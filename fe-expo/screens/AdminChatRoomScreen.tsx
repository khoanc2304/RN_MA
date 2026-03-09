import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ChatStackParamList } from '../navigation/TabNavigator';

// Định nghĩa kiểu dữ liệu route
type AdminChatRouteProp = RouteProp<ChatStackParamList, 'AdminChatRoom'>;

interface Message {
  _id: string;
  sender: { _id: string; name: string } | string;
  receiver: string;
  text: string;
  createdAt: string;
}

const AdminChatRoomScreen: React.FC = () => {
  const route = useRoute<AdminChatRouteProp>();
  const { userId, userName } = route.params;

  const { userInfo } = useContext(AuthContext);
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 1. Tải lịch sử chat với Khách hàng này
    const fetchHistory = async () => {
      try {
        const res = await api.get(`/messages/admin/${userId}`);
        setMessages(res.data);
      } catch (error) {
        console.log('Lỗi tải lịch sử chat Admin:', error);
      }
    };
    fetchHistory();

    // 2. Lắng nghe tin nhắn mới từ socket toàn cục
    const handleReceiveMessage = (newMsg: Message) => {
      const sId = typeof newMsg.sender === 'object' ? newMsg.sender._id : newMsg.sender;
      // Chỉ push vào màn hình nếu tin nhắn thuộc về Admin và User này
      if (sId === userId || newMsg.receiver === userId || sId === userInfo?._id) {
         setMessages((prev) => [...prev, newMsg]);
      }
    };

    if (socket) {
      socket.on('receive_message', handleReceiveMessage);
    }

    return () => {
      if (socket) {
        socket.off('receive_message', handleReceiveMessage);
      }
    };
  }, [userInfo, userId, socket]);

  const sendMessage = () => {
    if (!inputText.trim() || !userInfo) return;

    socket?.emit('send_message', {
      senderId: userInfo._id, // Chính là Admin
      receiverId: userId,     // Khách hàng
      text: inputText.trim()
    });

    setInputText('');
  };

  const renderBubble = ({ item }: { item: Message }) => {
    const isMyMessage = typeof item.sender === 'object' 
      ? item.sender._id === userInfo?._id
      : item.sender === userInfo?._id;

    return (
      <View style={[styles.messageBubble, isMyMessage ? styles.myMessage : styles.theirMessage]}>
        <Text style={[styles.messageText, isMyMessage ? styles.myMessageText : styles.theirMessageText]}>
          {item.text}
        </Text>
        <Text style={styles.timeText}>
          {new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header thay thế thanh điều hướng mặc định */}
      <View style={styles.header}>
        <View style={styles.shopAvatar}>
          <Text style={styles.shopAvatarText}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={styles.shopName}>{userName}</Text>
          <Text style={styles.statusText}>Khách hàng</Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item._id}
        renderItem={renderBubble}
        contentContainerStyle={styles.chatContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Trả lời khách hàng..."
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Ionicons name="send" size={24} color="#3da9fc" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingTop: Platform.OS === 'android' ? 10 : 15,
  },
  shopAvatar: {
    width: 45, height: 45, borderRadius: 25, backgroundColor: '#94a1b2',
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  shopAvatarText: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  shopName: { fontSize: 18, fontWeight: '700', color: '#2b2c34' },
  statusText: { fontSize: 12, color: '#ff4757', fontWeight: '500', marginTop: 2 },
  chatContainer: { padding: 15, paddingBottom: 20 },
  messageBubble: {
    maxWidth: '75%', padding: 12, borderRadius: 16, marginBottom: 12,
  },
  myMessage: {
    alignSelf: 'flex-end', backgroundColor: '#3da9fc',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start', backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3,
  },
  messageText: { fontSize: 15, lineHeight: 22 },
  myMessageText: { color: '#ffffff' },
  theirMessageText: { color: '#2b2c34' },
  timeText: { fontSize: 10, color: '#94a1b2', marginTop: 5, alignSelf: 'flex-end' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 10,
    backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9'
  },
  input: {
    flex: 1, backgroundColor: '#f4f6f9', borderRadius: 20,
    paddingHorizontal: 15, paddingTop: 12, paddingBottom: 12,
    maxHeight: 100, fontSize: 15, color: '#2b2c34'
  },
  sendBtn: {
    width: 45, height: 45, justifyContent: 'center', alignItems: 'center',
    marginLeft: 10,
  }
});

export default AdminChatRoomScreen;
