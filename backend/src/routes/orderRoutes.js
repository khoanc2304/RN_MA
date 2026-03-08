import express from 'express';
const router = express.Router();
import { addOrderItems, getOrders, getMyOrders, getOrderById } from '../controllers/orderController.js';

// Import middleware phân quyền
import { protect, admin } from '../middleware/authMiddleware.js';

// Route POST /api/orders (User bình thường gọi được)
// Route GET /api/orders (Thường để tính doanh thu nên chỉ Admin gọi được)
router.route('/')
  .post(protect, addOrderItems)
  .get(protect, admin, getOrders);

// Route GET /api/orders/myorders (Lịch sử đơn hàng của tôi)
// Lưu ý: route này phải đặt trên route /:id để tránh Express nhầm lẫn 'myorders' là một ID
router.route('/myorders').get(protect, getMyOrders);

// Route GET /api/orders/:id (Xem chi tiết đơn hàng)
router.route('/:id').get(protect, getOrderById);

export default router;
