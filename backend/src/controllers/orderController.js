import Order from '../models/Order.js';

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private (Chỉ user đã đăng nhập mới được mua)
const addOrderItems = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Không có sản phẩm nào trong đơn hàng' });
    }

    // Tính toán lại tổng tiền (để tránh việc Frontend truyền lên giá sai lệch)
    // Map mảng orderItems và gán vào model items
    const itemsParams = orderItems.map((item) => ({
      productId: item.productId,
      name: item.name,
      price: item.price,
      size: item.size,
      quantity: item.quantity,
    }));

    // Tính tổng tiền = giá * số lượng
    const calculatedTotalPrice = itemsParams.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );

    const order = new Order({
      userId: req.user._id, // req.user được gán từ middleware protect
      items: itemsParams,
      shippingAddress,
      paymentMethod,
      totalPrice: calculatedTotalPrice,
    });

    const createdOrder = await order.save();
    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng', error: error.message });
  }
};

// @desc    Lấy tất cả đơn hàng (Dùng cho Admin hoặc tính doanh thu)
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
  try {
    // Populate lấy thêm thông tin user (tên, email) nếu cần tính doanh thu theo người dùng
    const orders = await Order.find({}).populate('userId', 'name email');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng', error: error.message });
  }
};

// @desc    Lấy danh sách đơn hàng của User đang đăng nhập
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    // Tìm tất cả đơn hàng có userId khớp với ID của user đang đăng nhập
    const orders = await Order.find({ userId: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy lịch sử đơn hàng', error: error.message });
  }
};

// @desc    Lấy chi tiết 1 đơn hàng bằng ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    // Lấy thông tin đơn hàng và thông tin cơ bản của người mua (tên, email)
    const order = await Order.findById(req.params.id).populate('userId', 'name email');

    if (order) {
      // Kiểm tra: Chỉ admin hoặc chính chủ mới được xem đơn hàng này
      if (req.user.role === 'admin' || order.userId._id.toString() === req.user._id.toString()) {
        res.json(order);
      } else {
        res.status(401).json({ message: 'Không có quyền xem đơn hàng này' });
      }
    } else {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy chi tiết đơn hàng', error: error.message });
  }
};

export { addOrderItems, getOrders, getMyOrders, getOrderById };
