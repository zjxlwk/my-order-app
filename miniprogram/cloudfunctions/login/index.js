// login云函数 - 用户登录验证
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
const { validateRequiredFields, validateUserType } = require('./utils/validator');

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
  const { username, password, action, userType } = event;
  
  // 如果通过API映射调用，检查action参数
  if (action && action !== 'login') {
    return createErrorResponse(400, '无效的操作类型');
  }
  
  // 验证必填字段
  validateRequiredFields({ username, password });
  
  // 如果提供了userType参数，则进行验证
  if (userType) {
    validateUserType(userType);
  }
  
  // 查询用户信息
  const userResult = await db.collection('users')
    .where({
      username: username
    })
    .get();
  
  // 检查用户是否存在
  if (userResult.data.length === 0) {
    return createErrorResponse(401, '用户名或密码错误');
  }
  
  const user = userResult.data[0];
  
  // 如果提供了userType参数，则验证用户类型
  if (userType && user.userType !== userType) {
    return createErrorResponse(401, '用户名或密码错误');
  }
  
  // 使用bcrypt验证哈希密码
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return createErrorResponse(401, '用户名或密码错误');
  }
  
  // 生成token
  const token = generateToken();
  
  // 更新用户token
  await db.collection('users')
    .doc(user._id)
    .update({
      data: {
        token: token,
        updatedAt: db.serverDate()
      }
    });
  
  // 返回用户信息和token
  return {
    code: 200,
    message: '登录成功',
    data: {
      userId: user._id,
      username: user.username,
      userType: user.userType,
      token: token,
      createdAt: user.createdAt
    }
  };
});
