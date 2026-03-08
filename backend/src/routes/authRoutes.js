import express from 'express';
const router = express.Router();
import { registerUser, loginUser, logoutUser } from '../controllers/authController.js';

// Đăng ký tài khoản (POST /api/auth/register)
router.post('/register', registerUser);

// Đăng nhập (POST /api/auth/login)
router.post('/login', loginUser);

// Đăng xuất (POST /api/auth/logout)
router.post('/logout', logoutUser);

export default router;
