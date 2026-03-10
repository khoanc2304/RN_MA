import Order from '../models/Order.js';
import Product from '../models/Product.js';

// @desc    Tạo đơn hàng mới
// @route   POST /api/orders
// @access  Private (Chỉ user đã đăng nhập mới được mua)
const addOrderItems = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'Không có sản phẩm nào trong đơn hàng' });
    }

    // Xác nhận Stock và Trừ kho
    let finalTotalPrice = 0;
    const itemsParams = [];

    for (const item of orderItems) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Không tìm thấy sản phẩm ${item.name}` });
      }

      const sizeInfo = product.sizes.find(s => s.size === item.size);
      if (!sizeInfo || sizeInfo.stock < item.quantity) {
        return res.status(400).json({ 
          message: `Sản phẩm ${product.name} (Size ${item.size}) không đủ số lượng trong kho.` 
        });
      }

      // Giảm Stock
      sizeInfo.stock -= item.quantity;
      await product.save();

      // Cộng dồn tiền thật (Server-side)
      finalTotalPrice += product.price * item.quantity;

      // Push vào model Items
      itemsParams.push({
        productId: item.productId,
        name: product.name,
        price: product.price,
        size: item.size,
        quantity: item.quantity,
      });
    }

    const order = new Order({
      userId: req.user._id, // req.user được gán từ middleware protect
      items: itemsParams,
      shippingAddress: shippingAddress || { name: 'Người Mua', phone: '0901234567', address: '123 Đường Phố' },
      paymentMethod: paymentMethod || 'COD',
      totalPrice: finalTotalPrice,
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

// @desc    Admin Cập nhật trạng thái đơn hàng (shipping)
// @route   PUT /api/orders/:id/status/admin
// @access  Private/Admin
const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body; // Chỉ nhận 'shipping'
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Admin chỉ được chuyển từ processing -> shipping
    if (order.orderStatus === 'processing' && status === 'shipping') {
      order.orderStatus = 'shipping';
      const updatedOrder = await order.save();
      return res.json(updatedOrder);
    } else {
      return res.status(400).json({ 
        message: 'Admin chỉ có thể chuyển trạng thái từ Processing sang Shipping.',
        currentStatus: order.orderStatus 
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    User Cập nhật trạng thái đơn hàng (delivered, cancelled)
// @route   PUT /api/orders/:id/status/user
// @access  Private
const updateOrderStatusUser = async (req, res) => {
  try {
    const { status } = req.body; // Nhận 'delivered' hoặc 'cancelled'
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }

    // Phải là chính chủ
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Không có quyền thao tác' });
    }

    if (status === 'cancelled') {
      // User chỉ có thể huỷ khi đơn hàng đang xử lý (processing)
      if (order.orderStatus === 'processing') {
        order.orderStatus = 'cancelled';
        
        // Trả lại Stock cho Product (vì đã huỷ)
        for (const item of order.items) {
          const product = await Product.findById(item.productId);
          if (product) {
            const sizeInfo = product.sizes.find(s => s.size === item.size);
            if (sizeInfo) {
              sizeInfo.stock += item.quantity;
              await product.save();
            }
          }
        }
      } else {
        return res.status(400).json({ message: 'Không thể huỷ đơn hàng đã được giao cho ĐVVC.' });
      }
    } else if (status === 'delivered') {
      // User chỉ có thể Đã nhận hàng khi đang giao hàng (shipping)
      if (order.orderStatus === 'shipping') {
        order.orderStatus = 'delivered';
      } else {
        return res.status(400).json({ message: 'Đơn hàng chưa được vận chuyển.' });
      }
    } else {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// @desc    Lấy thống kê đơn hàng (Admin Dashboard)
// @route   GET /api/orders/stats
// @access  Private/Admin
const getOrderStats = async (req, res) => {
  try {
    // 1. Tính tổng doanh thu và số lượng đơn (không tính đơn đã huỷ)
    const stats = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$orderStatus', 'delivered'] }, 1, 0] }
          }
        }
      }
    ]);

    // 2. Tính tổng sản phẩm đã bán
    const itemsStats = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'cancelled' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: null,
          totalItemsSold: { $sum: '$items.quantity' }
        }
      }
    ]);

    // 3. Lấy 5 đơn hàng mới nhất
    const latestOrders = await Order.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email');

    // 4. Xu hướng doanh thu 7 ngày gần nhất
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          orderStatus: { $ne: 'cancelled' },
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Chuẩn hoá dữ liệu (điền các ngày bị thiếu bằng 0)
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      const dayData = dailyRevenue.find(d => d._id === dateString);
      trend.push({
        date: dateString,
        revenue: dayData ? dayData.revenue : 0
      });
    }

    const result = {
      totalRevenue: stats[0]?.totalRevenue || 0,
      totalOrders: stats[0]?.totalOrders || 0,
      deliveredOrders: stats[0]?.deliveredOrders || 0,
      totalItemsSold: itemsStats[0]?.totalItemsSold || 0,
      latestOrders,
      revenueTrend: trend
    };

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi lấy thống kê', error: error.message });
  }
};

export { addOrderItems, getOrders, getMyOrders, getOrderById, updateOrderStatusAdmin, updateOrderStatusUser, getOrderStats };
