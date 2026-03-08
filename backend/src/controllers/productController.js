import Product from '../models/Product.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';

// @desc    Lấy tất cả sản phẩm
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    let query = { status: 'active' }; // Mặc định khách và User chỉ xem hàng Active
    
    // Thầm lặng kiểm tra xem Request này có kèm Token của Admin không
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user && user.role === 'admin') {
          query = {}; // Admin được xem Toàn Thư (Bao gồm cả Inactive)
        }
      } catch (err) {
        // Token dỏm hoặc hết hạn thì cứ coi như Khách thường, lờ đi
      }
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Lấy chi tiết 1 sản phẩm bằng ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Tạo 1 sản phẩm mới
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, price, description, images, brand, categoryId, sizes } = req.body;

    const product = new Product({
      name,
      price,
      user: req.user._id, // Gắn ID của admin tạo sản phẩm
      images,
      brand,
      category: categoryId,
      sizes,
      description,
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.stack });
  }
};

// @desc    Cập nhật 1 sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, price, description, images, brand, categoryId, sizes, status } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      if (name !== undefined) product.name = name;
      if (price !== undefined) product.price = price;
      if (description !== undefined) product.description = description;
      if (images !== undefined) product.images = images;
      if (brand !== undefined) product.brand = brand;
      if (categoryId !== undefined) product.category = categoryId;
      if (sizes !== undefined) product.sizes = sizes;
      if (status) {
        product.status = status;
      }

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message, error: error.stack });
  }
};

// @desc    Xóa 1 sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.status = 'inactive';
      await product.save();
      res.json({ message: 'Sản phẩm đã bị xóa (chuyển sang trạng thái ẩn)' });
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi xóa sản phẩm', error: error.message });
  }
};

export {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
