import asyncHandler from 'express-async-handler';
import Cart from '../models/Cart.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name image price');

  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, items: [], totalPrice: 0 });
  }

  res.json(cart);
});

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = asyncHandler(async (req, res) => {
  const { productId, name, price, size, quantity, image } = req.body;

  let cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    cart = new Cart({ userId: req.user._id, items: [], totalPrice: 0 });
  }

  const existingItemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId && item.size === size
  );

  if (existingItemIndex >= 0) {
    // If item exists with same size, increase quantity
    cart.items[existingItemIndex].quantity += quantity;
  } else {
    // Add new item
    cart.items.push({ productId, name, price, size, quantity, image });
  }

  // Calculate new total price
  cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

  await cart.save();
  res.json(cart);
});

// @desc    Update cart item quantity
// @route   PUT /api/cart/:itemId
// @access  Private
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Giỏ hàng không tồn tại');
  }

  const itemIndex = cart.items.findIndex((item) => item._id.toString() === req.params.itemId);

  if (itemIndex >= 0) {
    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    await cart.save();
    res.json(cart);
  } else {
    res.status(404);
    throw new Error('Sản phẩm không có trong giỏ hàng');
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/:itemId
// @access  Private
const removeCartItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });

  if (!cart) {
    res.status(404);
    throw new Error('Giỏ hàng không tồn tại');
  }

  cart.items = cart.items.filter((item) => item._id.toString() !== req.params.itemId);
  cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);

  await cart.save();
  res.json(cart);
});

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user._id });

  if (cart) {
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    res.json({ message: 'Giỏ hàng đã được làm sạch' });
  } else {
    res.status(404);
    throw new Error('Giỏ hàng không tồn tại');
  }
});

export { getCart, addToCart, updateCartItem, removeCartItem, clearCart };
