// 获取派单员订单列表函数
const pool = require('../../utils/db');
const { authMiddleware } = require('../../utils/jwt');

exports.handler = async (event) => {
  try {
    // 只允许GET请求
    if (event.httpMethod !== 'GET') {
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
    
    // 检查是否为派单员
    if (userType !== 'dispatcher') {
      return { statusCode: 403, body: JSON.stringify({ message: 'Only dispatchers can view their orders' }) };
    }
    
    // 查询订单，包含接单员信息
    const [orders] = await pool.query(`
      SELECT 
        o.*, 
        r.username AS receiverName 
      FROM 
        orders o
      LEFT JOIN 
        users r ON o.receiverId = r.id
      WHERE 
        o.dispatcherId = ?
      ORDER BY 
        o.createdAt DESC
    `, [id]);
    
    return {
      statusCode: 200,
      body: JSON.stringify(orders)
    };
  } catch (error) {
    console.error('Get dispatcher orders error:', error);
    return { statusCode: 500, body: JSON.stringify({ message: 'Server error' }) };
  }
};