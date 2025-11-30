// 通用验证模块

/**
 * 验证必填字段
 * @param {Object} fields - 要验证的字段对象
 * @throws {Error} 如果必填字段不存在或为空
 */
function validateRequiredFields(fields) {
  const missingFields = [];
  
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      missingFields.push(key);
    }
  }
  
  if (missingFields.length > 0) {
    throw new Error(`缺少必填字段: ${missingFields.join(', ')}`);
  }
}

/**
 * 验证用户类型
 * @param {string} userType - 用户类型
 * @throws {Error} 如果用户类型无效
 */
function validateUserType(userType) {
  const validTypes = ['dispatcher', 'receiver'];
  if (!validTypes.includes(userType)) {
    throw new Error(`无效的用户类型: ${userType}，必须是 ${validTypes.join(' 或 ')}`);
  }
}

/**
 * 验证密码强度
 * @param {string} password - 密码
 * @throws {Error} 如果密码强度不足
 */
function validatePasswordStrength(password) {
  if (!password || password.length < 6) {
    throw new Error('密码长度至少为6个字符');
  }
  
  // 可以根据需要添加更复杂的密码强度验证
  // 例如：必须包含字母、数字和特殊字符等
}

/**
 * 验证订单状态
 * @param {string} status - 订单状态
 * @throws {Error} 如果订单状态无效
 */
function validateOrderStatus(status) {
  const validStatuses = ['pending', 'accepted', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error(`无效的订单状态: ${status}，必须是 ${validStatuses.join(' 或 ')}`);
  }
}

module.exports = {
  validateRequiredFields,
  validateUserType,
  validatePasswordStrength,
  validateOrderStatus
};