import Product from '../models/Product.js';

// @desc    Lấy tất cả sản phẩm
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
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
    res.status(500).json({ message: 'Lỗi server khi tạo sản phẩm', error: error.message });
  }
};

// @desc    Cập nhật 1 sản phẩm
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, price, description, images, brand, categoryId, sizes } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.price = price || product.price;
      product.description = description || product.description;
      product.images = images || product.images;
      product.brand = brand || product.brand;
      product.category = categoryId || product.category;
      product.sizes = sizes || product.sizes;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi cập nhật sản phẩm', error: error.message });
  }
};

// @desc    Xóa 1 sản phẩm
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id });
      res.json({ message: 'Sản phẩm đã bị xóa' });
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
