const Order = require('../models/Order');
const { validationResult } = require('express-validator');

// 生成唯一订单号
const generateOrderNumber = () => {
  return 'ORD' + Date.now() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
};

// 创建新订单（派单）
exports.createOrder = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { content } = req.body;

  try {
    // 检查是否为派单员
    if (req.user.userType !== 'dispatcher') {
      return res.status(403).json({ message: 'Only dispatchers can create orders' });
    }

    // 创建新订单
    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      content,
      dispatcherId: req.user.id // 使用正确的参数名
    });

    if (order) {
      res.status(201).json(order);
    } else {
      res.status(400).json({ message: 'Invalid order data' });
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取派单员的所有已派订单
  exports.getDispatcherOrders = async (req, res) => {
    try {
      // 检查是否为派单员
      if (req.user.userType !== 'dispatcher') {
        return res.status(403).json({ message: 'Only dispatchers can view their orders' });
      }

      // 获取该派单员的所有订单，包含用户信息（使用username而不是name）
      const orders = await Order.findWithUsers({ dispatcherId: req.user.id });

      res.json(orders);
    } catch (error) {
      console.error('Get dispatcher orders error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// 获取所有待接单订单（用于接单员）
  exports.getPendingOrders = async (req, res) => {
    try {
      // 检查是否为接单员
      if (req.user.userType !== 'receiver') {
        return res.status(403).json({ message: 'Only receivers can view pending orders' });
      }

      // 获取所有待接单订单，包含派单员信息（使用username而不是name）
      const orders = await Order.findWithUsers({ status: 'pending' });

      res.json(orders);
    } catch (error) {
      console.error('Get pending orders error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// 接单
exports.acceptOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    // 检查是否为接单员
    if (req.user.userType !== 'receiver') {
      return res.status(403).json({ message: 'Only receivers can accept orders' });
    }

    // 查找待接单的订单
    const order = await Order.findById(orderId);
    
    // 检查订单是否存在且状态为待接单
    if (!order || order.status !== 'pending') {
      return res.status(404).json({ message: 'Order not found or already accepted' });
    }

    // 使用Order模型提供的assignToReceiver方法来分配订单并更新状态
    await order.assignToReceiver(req.user.id);

    res.json(order);
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 更新订单状态为已完成
exports.completeOrder = async (req, res) => {
  const { orderId } = req.params;

  try {
    // 检查是否为接单员
    if (req.user.userType !== 'receiver') {
      return res.status(403).json({ message: 'Only receivers can complete orders' });
    }

    // 查找该接单员正在配送的订单
    const order = await Order.findById(orderId);
    
    // 检查订单是否存在、是否分配给该接单员且状态为配送中
    if (!order || order.receiverId !== req.user.id || order.status !== 'delivering') {
      return res.status(404).json({ message: 'Order not found or not assigned to you' });
    }

    // 更新订单状态为已完成
    order.status = 'completed';
    await order.save();

    res.json(order);
  } catch (error) {
    console.error('Complete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取接单员的所有订单（配送中、已完成）
  exports.getReceiverOrders = async (req, res) => {
    try {
      // 检查是否为接单员
      if (req.user.userType !== 'receiver') {
        return res.status(403).json({ message: 'Only receivers can view their orders' });
      }

      // 获取该接单员的所有订单，包含派单员信息（使用username而不是name）
      const orders = await Order.findWithUsers({ receiverId: req.user.id });

      res.json(orders);
    } catch (error) {
      console.error('Get receiver orders error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// 获取订单详情（包含用户信息）
  exports.getOrderDetail = async (req, res) => {
    try {
      const { orderId } = req.params;
      const orders = await Order.findWithUsers({ id: orderId });
      
      if (orders.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json(orders[0]);
    } catch (error) {
      console.error('Get order detail error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// 获取派单员的订单统计
exports.getDispatcherOrderStats = async (req, res) => {
  try {
    // 检查是否为派单员
    if (req.user.userType !== 'dispatcher') {
      return res.status(403).json({ message: 'Only dispatchers can view their stats' });
    }

    // 获取订单总数
    const totalOrders = await Order.getDispatcherOrderCount(req.user.id);
    
    // 获取不同状态的订单数量
    const pendingOrders = await Order.findWithUsers({ dispatcherId: req.user.id, status: 'pending' });
    const deliveringOrders = await Order.findWithUsers({ dispatcherId: req.user.id, status: 'delivering' });
    const completedOrders = await Order.findWithUsers({ dispatcherId: req.user.id, status: 'completed' });

    res.json({
      totalOrders,
      pendingCount: pendingOrders.length,
      deliveringCount: deliveringOrders.length,
      completedCount: completedOrders.length
    });
  } catch (error) {
    console.error('Get dispatcher order stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取接单员的订单统计
exports.getReceiverOrderStats = async (req, res) => {
  try {
    // 检查是否为接单员
    if (req.user.userType !== 'receiver') {
      return res.status(403).json({ message: 'Only receivers can view their stats' });
    }

    // 获取订单总数
    const totalOrders = await Order.getReceiverOrderCount(req.user.id);
    
    // 获取不同状态的订单数量
    const deliveringOrders = await Order.findWithUsers({ receiverId: req.user.id, status: 'delivering' });
    const completedOrders = await Order.findWithUsers({ receiverId: req.user.id, status: 'completed' });

    res.json({
      totalOrders,
      deliveringCount: deliveringOrders.length,
      completedCount: completedOrders.length
    });
  } catch (error) {
    console.error('Get receiver order stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 根据接单员用户名查询订单
  exports.searchOrdersByReceiver = async (req, res) => {
    try {
      const { username } = req.query;
      
      if (!username || username.trim() === '') {
        return res.status(400).json({ message: 'Username is required' });
      }

      // 所有用户都可以查询，但需要权限控制
      const orders = await Order.findByReceiverUsername(username);
      res.json(orders);
    } catch (error) {
      console.error('Search orders by receiver error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

// 搜索订单
  exports.searchOrders = async (req, res) => {
    try {
      const { searchTerm } = req.query;
      
      if (!searchTerm || searchTerm.trim() === '') {
        return res.status(400).json({ message: 'Search term is required' });
      }

      // 根据用户类型过滤结果
      const orders = await Order.searchOrders(searchTerm);
      
      // 如果是派单员，只返回自己派发的订单
      if (req.user.userType === 'dispatcher') {
        const filteredOrders = orders.filter(order => order.dispatcherId === req.user.id);
        return res.json(filteredOrders);
      }
      
      // 如果是接单员，只返回自己接的订单
      if (req.user.userType === 'receiver') {
        const filteredOrders = orders.filter(order => order.receiverId === req.user.id);
        return res.json(filteredOrders);
      }

      res.json(orders);
    } catch (error) {
      console.error('Search orders error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };