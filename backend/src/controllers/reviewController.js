import asyncHandler from 'express-async-handler';
import Review from '../models/Review.js';
import Product from '../models/Product.js';

// @desc    Create new review
// @route   POST /api/products/:productId/reviews
// @access  Private
const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.productId;

  const product = await Product.findById(productId);

  if (!product) {
    res.status(404);
    throw new Error('Sản phẩm không tồn tại');
  }

  // Check if user already reviewed
  const alreadyReviewed = await Review.findOne({
    userId: req.user._id,
    productId: productId,
  });

  if (alreadyReviewed) {
    res.status(400);
    throw new Error('Bạn đã đánh giá sản phẩm này rồi');
  }

  const review = new Review({
    userId: req.user._id,
    productId: productId,
    rating: Number(rating),
    comment,
  });

  await review.save();

  // Update Product's overall rating and reviewCount
  const reviews = await Review.find({ productId: productId });
  
  product.reviewCount = reviews.length;
  product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;

  await product.save();

  res.status(201).json({ message: 'Đánh giá đã được thêm' });
});

// @desc    Get all reviews for a product
// @route   GET /api/products/:productId/reviews
// @access  Public
const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ productId: req.params.productId }).populate('userId', 'name');
  res.json(reviews);
});

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private (Admin or Review Owner)
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Đánh giá không tồn tại');
  }

  // Only Admin or the owner of the review can delete it
  if (req.user.role === 'admin' || review.userId.toString() === req.user._id.toString()) {
    const productId = review.productId;
    await Review.deleteOne({ _id: review._id });

    // Recalculate Product's overall rating after deletion
    const product = await Product.findById(productId);
    if (product) {
      const reviews = await Review.find({ productId: productId });
      product.reviewCount = reviews.length;
      if (reviews.length === 0) {
        product.rating = 0;
      } else {
        product.rating = reviews.reduce((acc, item) => item.rating + acc, 0) / reviews.length;
      }
      await product.save();
    }

    res.json({ message: 'Đánh giá đã bị xóa' });
  } else {
    res.status(401);
    throw new Error('Không có quyền xóa đánh giá này');
  }
});

export { createProductReview, getProductReviews, deleteReview };
