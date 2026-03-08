import express from 'express';
const router = express.Router();
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js';

// Import middleware phân quyền
import { protect, admin } from '../middleware/authMiddleware.js';

// Import route đánh giá (reviews)
import reviewRoutes from './reviewRoutes.js';

// Gắn Review router vào thư mục con của Product
// Route POST /api/products/:productId/reviews
// Route GET /api/products/:productId/reviews
router.use('/:productId/reviews', reviewRoutes);

// Route GET /api/products và POST /api/products
router.route('/').get(getProducts).post(protect, admin, createProduct);

// Route GET /api/products/:id, PUT /api/products/:id, DELETE /api/products/:id
router
  .route('/:id')
  .get(getProductById)
  .put(protect, admin, updateProduct)
  .delete(protect, admin, deleteProduct);

export default router;
