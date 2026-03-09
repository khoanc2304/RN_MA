import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getMessageHistory, getChatList, getAdminUserHistory } from '../controllers/chatController.js';

const router = express.Router();

router.get('/', protect, getMessageHistory);
router.get('/admin/users', protect, admin, getChatList);
router.get('/admin/:userId', protect, admin, getAdminUserHistory);

export default router;
