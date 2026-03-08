import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors()); // Cho phép Frontend gọi API mà không bị lỗi CORS
app.use(express.json()); // Cho phép backend đọc dữ liệu JSON từ body của request

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);


// test routes
app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
