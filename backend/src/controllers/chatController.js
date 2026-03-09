import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';
import User from '../models/User.js';

// Lấy lịch sử tin nhắn của User hiện tại với Admin
export const getMessageHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Lấy ra tất cả các tin nhắn gửi/nhận giữa req.user._id và bất kỳ user nào thuộc diện 'admin'
  const admins = await User.find({ role: 'admin' }).select('_id');
  const adminIds = admins.map(a => a._id);

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: { $in: adminIds } },
      { sender: { $in: adminIds }, receiver: userId }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
});

// (Admin) Lấy danh sách các User đã từng nhắn tin (Tất cả Admin dùng chung danh sách này)
export const getChatList = asyncHandler(async (req, res) => {
  // Tìm tất cả các Admin IDs
  const admins = await User.find({ role: 'admin' }).select('_id');
  const adminIds = admins.map(a => a._id.toString());

  // Tìm tất cả các tin nhắn liên quan tới BẤT KỲ Admin nào
  const messages = await Message.find({
    $or: [
      { sender: { $in: adminIds } },
      { receiver: { $in: adminIds } }
    ]
  }).sort({ createdAt: -1 });

  // Lọc ra danh sách User Unique
  const userMap = new Map();
  
  for (const msg of messages) {
    const sId = msg.sender.toString();
    const rId = msg.receiver.toString();
    
    // Tìm ID của người dùng (không phải admin) trong cuộc hội thoại này
    const otherUserId = adminIds.includes(sId) ? rId : sId;

    // Nếu otherUserId cũng là admin (admin nhắn cho admin) thì bỏ qua nếu muốn, 
    // nhưng ở đây ta chỉ quan tâm khách hàng nhắn cho shop.
    if (!adminIds.includes(otherUserId) && !userMap.has(otherUserId)) {
      const user = await User.findById(otherUserId).select('name');
      userMap.set(otherUserId, { 
        _id: otherUserId, 
        name: user ? user.name : 'Người dùng Ẩn Danh', 
        latestMsg: msg 
      });
    }
  }

  const chatList = Array.from(userMap.values());
  res.json(chatList);
});

// (Admin) Lấy lịch sử đoạn chat với 1 User cụ thể (Lấy tất cả tin nhắn của User này với Shop/Bất kỳ Admin nào)
export const getAdminUserHistory = asyncHandler(async (req, res) => {
  const targetUserId = req.params.userId;

  // Lấy danh sách admin ids
  const admins = await User.find({ role: 'admin' }).select('_id');
  const adminIds = admins.map(a => a._id);

  const messages = await Message.find({
    $or: [
      { sender: { $in: adminIds }, receiver: targetUserId },
      { sender: targetUserId, receiver: { $in: adminIds } }
    ]
  }).sort({ createdAt: 1 });

  res.json(messages);
});
