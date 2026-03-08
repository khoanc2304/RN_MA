import express from 'express';
const router = express.Router({ mergeParams: true });
// mergeParams: true là RẤT QUAN TRỌNG để router nhận được `productId` từ productRoutes (nếu import lồng code)

import {
  createProductReview,
  getProductReviews,
  deleteReview,
} from '../controllers/reviewController.js';

import { protect } from '../middleware/authMiddleware.js';

// Các API cho /api/products/:productId/reviews
router.route('/')
  .get(getProductReviews)
  .post(protect, createProductReview);

export default router;
