const { getDB } = require('../config/db');
const User = require('./User');

// 创建订单表（如果不存在）
async function createOrderTable() {
  const db = getDB();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      orderNumber VARCHAR(255) NOT NULL UNIQUE,
      content TEXT NOT NULL,
      status ENUM('pending', 'delivering', 'completed') NOT NULL DEFAULT 'pending',
      dispatcherId INT NOT NULL,
      receiverId INT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (dispatcherId) REFERENCES users(id),
      FOREIGN KEY (receiverId) REFERENCES users(id)
    );
  `);
}

// 创建表
createOrderTable().catch(console.error);

// 订单类
class Order {
  constructor({ id, orderNumber, content, status, dispatcherId, receiverId, createdAt, updatedAt }) {
    this.id = id;
    this.orderNumber = orderNumber;
    this.content = content;
    this.status = status;
    this.dispatcherId = dispatcherId;
    this.receiverId = receiverId;
    this.dispatcher = dispatcherId; // 保持向后兼容
    this.receiver = receiverId; // 保持向后兼容
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // 创建新订单
  static async create({ orderNumber, content, dispatcherId }) {
    const db = getDB();
    const [result] = await db.execute(
      'INSERT INTO orders (orderNumber, content, status, dispatcherId) VALUES (?, ?, ?, ?)',
      [orderNumber, content, 'pending', dispatcherId]
    );
    return new Order({
      id: result.insertId,
      orderNumber,
      content,
      status: 'pending',
      dispatcherId,
      receiverId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // 根据ID查找订单
  static async findById(id) {
    const db = getDB();
    const [rows] = await db.execute(
      'SELECT * FROM orders WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return new Order(rows[0]);
  }

  // 查找所有订单
  static async find() {
    const db = getDB();
    const [rows] = await db.execute('SELECT * FROM orders');
    return rows.map(row => new Order(row));
  }

  // 根据状态查找订单
  static async findByStatus(status) {
    const db = getDB();
    const [rows] = await db.execute(
      'SELECT * FROM orders WHERE status = ?',
      [status]
    );
    return rows.map(row => new Order(row));
  }

  // 根据派单员ID查找订单
  static async findByDispatcher(dispatcherId) {
    const db = getDB();
    const [rows] = await db.execute(
      'SELECT * FROM orders WHERE dispatcherId = ?',
      [dispatcherId]
    );
    return rows.map(row => new Order(row));
  }

  // 根据接单员ID查找订单
  static async findByReceiver(receiverId) {
    const db = getDB();
    const [rows] = await db.execute(
      'SELECT * FROM orders WHERE receiverId = ?',
      [receiverId]
    );
    return rows.map(row => new Order(row));
  }

  // 获取派单员的订单总数
  static async getDispatcherOrderCount(dispatcherId) {
    const db = getDB();
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM orders WHERE dispatcherId = ?',
      [dispatcherId]
    );
    return rows[0].count;
  }

  // 获取接单员的订单总数
  static async getReceiverOrderCount(receiverId) {
    const db = getDB();
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM orders WHERE receiverId = ?',
      [receiverId]
    );
    return rows[0].count;
  }

  // 根据接单员用户名查询订单
  static async findByReceiverUsername(username) {
    const db = getDB();
    const [rows] = await db.execute(
      `SELECT o.*, 
              d.username as dispatcherName, d.userType as dispatcherRole,
              r.username as receiverName, r.userType as receiverRole
       FROM orders o
       LEFT JOIN users d ON o.dispatcherId = d.id
       LEFT JOIN users r ON o.receiverId = r.id
       WHERE r.username LIKE ?
       ORDER BY o.createdAt DESC`,
      [`%${username}%`]
    );
    return rows;
  }

  // 根据条件查询订单
  static async searchOrders(searchTerm) {
    const db = getDB();
    const [rows] = await db.execute(
      `SELECT o.*, 
              d.username as dispatcherName, d.userType as dispatcherRole,
              r.username as receiverName, r.userType as receiverRole
       FROM orders o
       LEFT JOIN users d ON o.dispatcherId = d.id
       LEFT JOIN users r ON o.receiverId = r.id
       WHERE o.content LIKE ? OR o.orderNumber LIKE ? OR d.username LIKE ? OR r.username LIKE ?
       ORDER BY o.createdAt DESC`,
      [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
    );
    return rows;
  }

  // 更新订单
  async save() {
    const db = getDB();
    await db.execute(
      'UPDATE orders SET content = ?, status = ?, receiverId = ? WHERE id = ?',
      [this.content, this.status, this.receiverId, this.id]
    );
    return this;
  }

  // 更新订单状态
  async updateStatus(newStatus) {
    const db = getDB();
    await db.execute(
      'UPDATE orders SET status = ? WHERE id = ?',
      [newStatus, this.id]
    );
    this.status = newStatus;
    return this;
  }

  // 分配订单给接单员
  async assignToReceiver(receiverId) {
    const db = getDB();
    await db.execute(
      'UPDATE orders SET receiverId = ?, status = ? WHERE id = ?',
      [receiverId, 'delivering', this.id]
    );
    this.receiverId = receiverId;
    this.status = 'delivering';
    return this;
  }

  // 获取派单员信息
  async getDispatcher() {
    if (!this.dispatcherId) return null;
    return await User.findById(this.dispatcherId);
  }

  // 获取接单员信息
  async getReceiver() {
    if (!this.receiverId) return null;
    return await User.findById(this.receiverId);
  }

  // 查询订单时包含用户信息
  static async findWithUsers(options = {}) {
    const db = getDB();
    let query = `
      SELECT o.*, 
             d.username as dispatcherName, d.userType as dispatcherRole,
             r.username as receiverName, r.userType as receiverRole
      FROM orders o
      LEFT JOIN users d ON o.dispatcherId = d.id
      LEFT JOIN users r ON o.receiverId = r.id
    `;
    
    const params = [];
    const conditions = [];
    
    if (options.status) {
      conditions.push('o.status = ?');
      params.push(options.status);
    }
    
    if (options.dispatcherId) {
      conditions.push('o.dispatcherId = ?');
      params.push(options.dispatcherId);
    }
    
    if (options.receiverId) {
      conditions.push('o.receiverId = ?');
      params.push(options.receiverId);
    }
    
    if (options.id) {
      conditions.push('o.id = ?');
      params.push(options.id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY o.createdAt DESC';
    
    const [rows] = await db.execute(query, params);
    return rows;
  }
}

// 导出订单类和创建表函数
module.exports = Order;
module.exports.createOrderTable = createOrderTable;