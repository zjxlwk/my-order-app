// 接单功能函数
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
    
    // 检查是否为接单员
    if (userType !== 'receiver') {
      return { statusCode: 403, body: JSON.stringify({ message: 'Only receivers can accept orders' }) };
    }
    
    // 获取订单ID
    const orderId = event.path.split('/').pop();
    if (!orderId) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Order ID is required' }) };
    }
    
    // 开始事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 查询订单（带锁防止并发接单）
      const [orders] = await connection.query(
        'SELECT * FROM orders WHERE id = ? FOR UPDATE',
        [orderId]
      );
      
      if (orders.length === 0) {
        await connection.rollback();
        connection.release();
        return { statusCode: 404, body: JSON.stringify({ message: 'Order not found' }) };
      }
      
      const order = orders[0];
      
      // 检查订单状态
      if (order.status !== 'pending') {
        await connection.rollback();
        connection.release();
        return { statusCode: 400, body: JSON.stringify({ message: 'Order already accepted' }) };
      }
      
      // 更新订单状态
      await connection.query(
        'UPDATE orders SET status = ?, receiverId = ? WHERE id = ?',
        ['delivering', id, orderId]
      );
      
      // 提交事务
      await connection.commit();
      connection.release();
      
      // 返回更新后的订单
      const [updatedOrders] = await pool.query('SELECT * FROM orders WHERE id = ?', [orderId]);
      
      return {
        statusCode: 200,
        body: JSON.stringify(updatedOrders[0])
      };
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (error) {
    console.error('Accept order error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error' }) };
  }
};