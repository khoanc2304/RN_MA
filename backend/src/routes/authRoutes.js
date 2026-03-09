import express from 'express';
const router = express.Router();
import { registerUser, loginUser, logoutUser, getAdmins } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

// Đăng ký tài khoản (POST /api/auth/register)
router.post('/register', registerUser);

// Đăng nhập (POST /api/auth/login)
router.post('/login', loginUser);

// Đăng xuất (POST /api/auth/logout)
router.post('/logout', logoutUser);

// Route lấy danh sách admin để User biết ID nhắn tin
router.get('/admin', getAdmins);

export default router;
