const { getDB } = require('../config/db');
const bcrypt = require('bcryptjs');

// 创建用户表（如果不存在）
async function createUserTable() {
  try {
    const db = getDB();
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        userType ENUM('receiver', 'dispatcher') NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log('User table created or already exists');
  } catch (error) {
    console.error('Error creating user table:', error);
  }
}

// 确保在模型被使用前创建表
createUserTable().catch(console.error);

// 用户类
class User {
  constructor({ id, username, password, userType, createdAt, updatedAt }) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.userType = userType;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // 密码加密
  static async hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  // 密码验证
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
  }

  // 创建新用户
  static async create({ username, password, userType }) {
    const db = getDB();
    const hashedPassword = await this.hashPassword(password);
    const [result] = await db.execute(
      'INSERT INTO users (username, password, userType) VALUES (?, ?, ?)',
      [username, hashedPassword, userType]
    );
    return new User({
      id: result.insertId,
      username,
      password: hashedPassword,
      userType,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // 根据用户名查找用户
  static async findOne({ username }) {
    const db = getDB();
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  // 根据ID查找用户
  static async findById(id) {
    const db = getDB();
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return new User(rows[0]);
  }

  // 更新用户
  async save() {
    const db = getDB();
    await db.execute(
      'UPDATE users SET username = ?, password = ?, userType = ? WHERE id = ?',
      [this.username, this.password, this.userType, this.id]
    );
    return this;
  }
}

// 导出用户类和创建表函数
module.exports = User;
module.exports.createUserTable = createUserTable;