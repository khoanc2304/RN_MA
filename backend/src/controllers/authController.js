import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

// Hàm tạo JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Đăng ký user mới
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin (name, email, password)' });
    }

    // Kiểm tra xem email đã tồn tại chưa
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    // Tạo user mới
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user', // Mặc định là user nếu không truyền role
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Dữ liệu user không hợp lệ' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Đăng nhập user & trả về token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kiểm tra xem user có nhập email và password không
    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và password' });
    }

    // Tìm user bằng email, cấu hình model đã set password là select: false nên phải thêm +password để lấy ra đem so sánh
    const user = await User.findOne({ email }).select('+password');

    // Kiểm tra user có tồn tại và password có khớp không
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Đăng xuất user
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  // Với JWT thông thường (không lưu trong cookie), việc đăng xuất chủ yếu là 
  // do phía Frontend (React Native) tự xóa token khỏi AsyncStorage.
  // API này chủ yếu để trả lỗi/thông báo chuẩn tắc cho Client.
  res.status(200).json({ message: 'Đăng xuất thành công.' });
};

// @desc    Lấy danh sách Admin
// @route   GET /api/auth/admin
// @access  Private (Chỉ trả về các thông tin công khai cần thiết của Admin để chat)
const getAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: 'admin' }).select('_id name email');
  res.json(admins);
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getAdmins
};
