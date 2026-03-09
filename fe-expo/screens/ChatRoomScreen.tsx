import React, { useState, useEffect, useContext, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

interface Message {
  _id: string;
  sender: { _id: string; name: string } | string;
  receiver: string;
  text: string;
  createdAt: string;
}

const ChatRoomScreen: React.FC = () => {
  const { userInfo } = useContext(AuthContext);
  const { socket } = useSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // 1. Tải lịch sử chat
    const fetchHistory = async () => {
      if (!userInfo) return;
      try {
        const res = await api.get('/messages');
        setMessages(res.data);
      } catch (error) {
        console.log('Lỗi tải lịch sử chat:', error);
      }
    };
    fetchHistory();

    // 2. Lắng nghe tin nhắn mới từ socket toàn cục
    const handleReceiveMessage = (newMsg: Message) => {
      setMessages((prev) => [...prev, newMsg]);
    };

    if (socket) {
      socket.on('receive_message', handleReceiveMessage);
    }

    return () => {
      if (socket) {
        socket.off('receive_message', handleReceiveMessage);
      }
    };
  }, [userInfo, socket]);

  const sendMessage = () => {
    if (!inputText.trim() || !userInfo) return;

    const messageData = {
      senderId: userInfo._id,
      receiverId: 'admin_placeholder', // Backend sẽ biết ai là admin. Ở logic này ta truyền tượng trưng hoặc Backend tự detect.
      // Dựa trên db: Admin ID là cái ta cần lấy. Để tự động, Backend nên có default admin ID hoặc xử lý mảng AdminIds.
      // Tương lai: Để logic chặt chẽ, Khách hàng cứ gửi receiver = Admin ID đầu tiên nếu có nhiều admin.
      text: inputText.trim()
    };

    // Chúng ta tạm thời yêu cầu Backend lấy luôn Admin cụ thể. Nhưng vì Backend Message ref cần MỘT ID.
    // Thực tế sẽ fetch Admin ID 1 lần, hoặc truyền 1 cờ đặc biệt.
    
    // Tạm gán 1 String đại diện. Trong code chuẩn ta cần thay 'admin_id' bằng _id của Admin thực tế.
    // Cách sửa backend: Nếu receiver==='admin' thì tự fetch Admin ID đầu tiên vào db.
    
    // Lấy Admin ID để gửi tin nhắn đúng địa chỉ
    api.get('/auth/admin').then(res => {
         if (res.data && res.data.length > 0) {
            const adminId = res.data[0]._id;
            socket?.emit('send_message', {
                senderId: userInfo._id,
                receiverId: adminId,
                text: inputText.trim()
            });
         } else {
            console.log('Cảnh báo: Không tìm thấy Admin nào trong hệ thống để nhắn tin.');
            socket?.emit('send_message', {
                senderId: userInfo._id,
                receiverId: 'admin',
                text: inputText.trim()
            });
         }
    }).catch(err => {
         console.log('Lỗi fetch admin:', err);
    });

    setInputText('');
  };

  const renderBubble = ({ item }: { item: Message }) => {
    // Kiểm tra xem ai là người gửi
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
      <View style={styles.header}>
        <View style={styles.shopAvatar}>
          <Text style={styles.shopAvatarText}>S</Text>
        </View>
        <View>
          <Text style={styles.shopName}>Shues Shop</Text>
          <Text style={styles.statusText}>Đang hoạt động</Text>
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
            placeholder="Nhắn tin cho shop..."
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
    paddingTop: Platform.OS === 'android' ? 40 : 15,
  },
  shopAvatar: {
    width: 45, height: 45, borderRadius: 25, backgroundColor: '#3da9fc',
    justifyContent: 'center', alignItems: 'center', marginRight: 15
  },
  shopAvatarText: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  shopName: { fontSize: 18, fontWeight: '700', color: '#2b2c34' },
  statusText: { fontSize: 12, color: '#28a745', fontWeight: '500', marginTop: 2 },
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

export default ChatRoomScreen;
