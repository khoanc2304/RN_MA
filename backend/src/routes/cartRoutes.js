import express from 'express';
const router = express.Router();
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/cartController.js';

// Import middleware phân quyền
import { protect } from '../middleware/authMiddleware.js';

// Route GET /api/cart và POST /api/cart
router.route('/')
  .get(protect, getCart)
  .post(protect, addToCart)
  .delete(protect, clearCart);

// Route PUT /api/cart/:itemId và DELETE /api/cart/:itemId
router.route('/:itemId')
  .put(protect, updateCartItem)
  .delete(protect, removeCartItem);

export default router;
