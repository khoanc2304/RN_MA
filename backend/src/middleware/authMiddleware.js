import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware xác thực token
const protect = async (req, res, next) => {
  let token;

  // Kiểm tra header authorization có chứa token dạng "Bearer <token>" không
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Tách chữ 'Bearer ' ra, chỉ lấy token
      token = req.headers.authorization.split(' ')[1];

      // Giải mã token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Tìm user trong database bằng ID từ payload của token (bỏ qua field password)
      req.user = await User.findById(decoded.id).select('-password');

      next(); // Cho phép đi tiếp vào Controller
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Không được phép truy cập, token không hợp lệ' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Không được phép truy cập, không có token' });
  }
};

// Middleware kiểm tra quyền admin
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Không được phép truy cập do không phải là Admin' });
  }
};

export { protect, admin };
