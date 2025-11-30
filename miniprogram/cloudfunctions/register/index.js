// register云函数 - 用户注册功能
const cloud = require('wx-server-sdk');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
// 初始化云开发环境，支持多环境部署
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV // 使用当前环境
});
const db = cloud.database();
const _ = db.command;

// 导入工具模块
const { createErrorResponse, handleCloudFunctionError } = require('./utils/errorHandler');
const { validateRequiredFields, validateUserType, validatePasswordStrength } = require('./utils/validator');

// 生成安全token的辅助函数
function generateToken() {
  // 使用crypto模块生成更强的随机数
  const randomBytes = crypto.randomBytes(32);
  // 转换为base64编码的字符串作为token
  return randomBytes.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

exports.main = handleCloudFunctionError(async (event, context) => {
  // 支持带action参数的调用方式
  // 从event.params中获取参数，同时保持对直接参数的兼容
  const params = event.params || {};
  const username = event.username || params.username;
  const password = event.password || params.password;
  const userType = event.userType || params.userType;
  const action = event.action || params.action;
  const dispatcherCode = event.dispatcherCode || params.dispatcherCode;
  const validDispatcherCode = '19976677115'; // 有效的派单员注册口令
  
  // 如果通过API映射调用，检查action参数
  if (action && action !== 'register') {
    return createErrorResponse(400, '无效的操作类型');
  }
  
  // 验证必填字段
  validateRequiredFields({ username, password, userType });
  
  // 验证用户类型
  validateUserType(userType, ['receiver', 'dispatcher']);
  
  // 验证密码强度
  validatePasswordStrength(password);
  
  // 派单员注册时需要验证口令
  if (userType === 'dispatcher') {
    if (!dispatcherCode) {
      return createErrorResponse(400, '派单员注册需要验证口令');
    }
    
    if (dispatcherCode !== validDispatcherCode) {
      return createErrorResponse(403, '派单员注册口令不正确');
    }
  }
  
  // 检查用户名是否已存在
  const existingUser = await db.collection('users')
    .where({
      username: username
    })
    .get();
  
  if (existingUser.data.length > 0) {
    return createErrorResponse(409, '用户名已被注册');
  }
  
  // 生成token
  const token = generateToken();
  
  // 密码哈希处理
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  // 创建新用户
  const result = await db.collection('users').add({
    data: {
      username: username,
      password: hashedPassword, // 存储哈希后的密码
      userType: userType,
      token: token,
      createdAt: db.serverDate(),
      updatedAt: db.serverDate()
    }
  });
  
  // 返回注册成功信息
  return {
    code: 200,
    message: '注册成功',
    data: {
      userId: result._id,
      username: username,
      userType: userType,
      token: token,
      createdAt: db.serverDate()
    }
  };
});
