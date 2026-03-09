import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import http from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import reviewBaseRoutes from './routes/reviewBaseRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import Message from './models/Message.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Thêm io vào request để controller có thể gọi nếu cần thiết (Tuỳ chọn)
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Middleware
app.use(cors()); // Cho phép Frontend gọi API mà không bị lỗi CORS
app.use(express.json()); // Cho phép backend đọc dữ liệu JSON từ body của request

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/reviews', reviewBaseRoutes);
app.use('/api/reviews', reviewBaseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/messages', chatRoutes);

// --- Cấu hình Socket.io ---
// Map lưu trữ UserID => SocketID
const userSockets = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Người dùng kết nối: ${socket.id}`);

  // Khi User/Admin join (gửi ID của họ lên)
  socket.on('join', async (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`👤 User ${userId} đã join vào socket ${socket.id}`);

    // Kiểm tra nếu là Admin thì cho vào room 'admins' để nhận tin nhắn chung
    try {
      const user = await User.findById(userId);
      if (user && user.role === 'admin') {
        socket.join('admins');
        console.log(`🛡️ Admin ${user.email} đã gia nhập room 'admins'`);
      }
    } catch (err) {
      console.error('Lỗi khi join room admin:', err);
    }
  });

  // Khi nhận tin nhắn mới
  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, text } = data;

      // 1. Lưu vào Database
      const newMessage = await Message.create({
        sender: senderId,
        receiver: receiverId,
        text: text
      });

      const populatedMsg = await Message.findById(newMessage._id).populate('sender', 'name');

      // 2. Gửi cho người gửi (để cập nhật UI)
      socket.emit('receive_message', populatedMsg);

      // 3. Gửi cho người nhận
      // Lấy thông tin người gửi và người nhận để quyết định broadcast
      const senderUser = await User.findById(senderId);
      const receiverUser = await User.findById(receiverId);

      // Nếu bất kỳ ai trong cuộc hội thoại là Admin, ta broadcast cho room 'admins'
      if ((senderUser && senderUser.role === 'admin') || (receiverUser && receiverUser.role === 'admin')) {
        io.to('admins').emit('receive_message', populatedMsg);
      }

      // Vẫn gửi riêng cho người nhận nếu là khách hàng (để họ nhận được tin nhắn)
      if (receiverUser && receiverUser.role === 'user') {
        const receiverSocketId = userSockets.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', populatedMsg);
        }
      }
    } catch (error) {
      console.error('Lỗi khi gửi/lưu tin nhắn socket:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ Người dùng ngắt kết nối: ${socket.id}`);
    for (let [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

// test routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server real-time is running on port ${PORT}`);
});
