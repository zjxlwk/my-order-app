const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getCurrentUser } = require('../controllers/userController');
const auth = require('../middleware/auth');

// 注册路由
router.post('/register', [
  body('username', 'Username is required').notEmpty(),
  body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
  body('userType', 'User type must be receiver or dispatcher').isIn(['receiver', 'dispatcher'])
], register);

// 登录路由
router.post('/login', [
  body('username', 'Username is required').notEmpty(),
  body('password', 'Password is required').notEmpty()
], login);

// 获取当前用户信息路由
router.get('/me', auth, getCurrentUser);

module.exports = router;