const User = require('../models/User');
const { generateToken } = require('../config/jwt');
const { validationResult } = require('express-validator');

// 用户注册
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password, userType } = req.body;

  try {
    // 检查用户名是否已存在
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // 创建新用户
    const user = await User.create({
      username,
      password,
      userType
    });

    if (user) {
      res.status(201).json({
        id: user.id, // 改为id而不是_id
        username: user.username,
        userType: user.userType,
        token: generateToken(user.id, user.userType) // 改为id而不是_id
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 用户登录
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // 查找用户
    const user = await User.findOne({ username });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      id: user.id, // 改为id而不是_id
      username: user.username,
      userType: user.userType,
      token: generateToken(user.id, user.userType) // 改为id而不是_id
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 获取当前用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user已经在auth中间件中设置，不需要再次查询数据库
    // 创建一个不包含密码的用户对象
    const userWithoutPassword = {
      id: req.user.id,
      username: req.user.username,
      userType: req.user.userType,
      createdAt: req.user.createdAt,
      updatedAt: req.user.updatedAt
    };
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};