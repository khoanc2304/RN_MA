import asyncHandler from 'express-async-handler';
import Wishlist from '../models/Wishlist.js';

// @desc    Get user wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ userId: req.user._id }).populate('products', 'name images price rating');

  if (!wishlist) {
    wishlist = await Wishlist.create({ userId: req.user._id, products: [] });
  }

  res.json(wishlist);
});

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
const addToWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.productId;

  let wishlist = await Wishlist.findOne({ userId: req.user._id });

  if (!wishlist) {
    wishlist = new Wishlist({ userId: req.user._id, products: [] });
  }

  // Check if product already in wishlist
  if (wishlist.products.includes(productId)) {
    res.status(400);
    throw new Error('Sản phẩm đã có trong mục Yêu thích');
  }

  wishlist.products.push(productId);
  await wishlist.save();
  
  res.status(201).json(wishlist);
});

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = asyncHandler(async (req, res) => {
  const productId = req.params.productId;
  const wishlist = await Wishlist.findOne({ userId: req.user._id });

  if (!wishlist) {
    res.status(404);
    throw new Error('Wishlist không tồn tại');
  }

  wishlist.products = wishlist.products.filter(id => id.toString() !== productId.toString());
  await wishlist.save();

  res.json(wishlist);
});

// @desc    Clear entire wishlist
// @route   DELETE /api/wishlist
// @access  Private
const clearWishlist = asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ userId: req.user._id });

  if (wishlist) {
    wishlist.products = [];
    await wishlist.save();
    res.json({ message: 'Danh sách Yêu thích đã được xóa sạch' });
  } else {
    res.status(404);
    throw new Error('Wishlist không tồn tại');
  }
});

export { getWishlist, addToWishlist, removeFromWishlist, clearWishlist };
