const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// 派单员创建新订单
router.post('/create', auth, [
  body('content', 'Content is required').notEmpty()
], orderController.createOrder);

// 派单员获取所有已派订单
router.get('/dispatcher', auth, orderController.getDispatcherOrders);

// 接单员获取所有待接单订单
router.get('/pending', auth, orderController.getPendingOrders);

// 接单员接单
router.put('/accept/:orderId', auth, orderController.acceptOrder);

// 接单员完成订单
router.put('/complete/:orderId', auth, orderController.completeOrder);

// 接单员获取所有订单（配送中、已完成）
router.get('/receiver', auth, orderController.getReceiverOrders);

// 获取订单详情（包含用户信息）
router.get('/:orderId', auth, orderController.getOrderDetail);

// 统计和查询相关路由
router.get('/stats/dispatcher', auth, orderController.getDispatcherOrderStats);
router.get('/stats/receiver', auth, orderController.getReceiverOrderStats);
router.get('/search/receiver', auth, orderController.searchOrdersByReceiver);
router.get('/search', auth, orderController.searchOrders);

module.exports = router;