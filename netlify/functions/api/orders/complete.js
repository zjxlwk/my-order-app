// 完成订单功能函数
const pool = require('../../utils/db');
const { authMiddleware } = require('../../utils/jwt');

exports.handler = async (event) => {
  try {
    // 只允许PUT请求
    if (event.httpMethod !== 'PUT') {
      return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
    }
    
    // 验证用户身份
    const authResult = await authMiddleware(event);
    if (!authResult.success) {
      return {
        statusCode: authResult.error.statusCode,
        body: JSON.stringify({ message: authResult.error.message })
      };
    }
    
    const { id, userType } = authResult.user;
    
    // 获取订单ID
    const orderId = event.path.split('/').pop();
    if (!orderId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Order ID is required' }) };
    }
    
    // 查询订单
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    if (orders.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ message: 'Order not found' }) };
    }
    
    const order = orders[0];
    
    // 检查权限：只有接单员可以完成自己接的订单
    if (userType === 'receiver' && order.receiverId !== id) {
      return { statusCode: 403, body: JSON.stringify({ message: 'You can only complete your own orders' }) };
    }
    
    // 检查订单状态
    if (order.status !== 'delivering') {
      return { statusCode: 400, body: JSON.stringify({ message: 'Order cannot be completed in current status' }) };
    }
    
    // 更新订单状态
    await pool.query(
      'UPDATE orders SET status = ?, completedAt = NOW() WHERE id = ?',
      ['completed', orderId]
    );
    
    // 返回更新后的订单
    const [updatedOrders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
    
    return {
      statusCode: 200,
      body: JSON.stringify(updatedOrders[0])
    };
  } catch (error) {
    console.error('Complete order error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error' }) };
  }
};