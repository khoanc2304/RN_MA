import Category from '../models/Category.js';

// @desc    Lấy danh sách tất cả danh mục (categories)
// @route   GET /api/categories
// @access  Public
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({});
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy categories', error: error.message });
  }
};
