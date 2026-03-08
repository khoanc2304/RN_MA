import express from 'express';
const router = express.Router();
import { deleteReview } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

// Các API cho thư mục tĩnh /api/reviews/:id
router.route('/:id').delete(protect, deleteReview);

export default router;
