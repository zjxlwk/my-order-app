// 通用数据验证模块

/**
 * 验证必填字段
 * @param {Object} data - 要验证的数据对象
 * @param {string[]} requiredFields - 必填字段列表
 * @returns {Object} 验证结果 { isValid: boolean, missingFields: string[] }
 */
export function validateRequiredFields(data, requiredFields) {
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(field);
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
}

/**
 * 验证字符串最小长度
 * @param {string} str - 要验证的字符串
 * @param {number} minLength - 最小长度
 * @returns {boolean} 验证结果
 */
export function validateMinLength(str, minLength) {
  return typeof str === 'string' && str.length >= minLength;
}

/**
 * 验证字符串最大长度
 * @param {string} str - 要验证的字符串
 * @param {number} maxLength - 最大长度
 * @returns {boolean} 验证结果
 */
export function validateMaxLength(str, maxLength) {
  return typeof str === 'string' && str.length <= maxLength;
}

/**
 * 验证密码强度（至少8位，包含字母和数字）
 * @param {string} password - 要验证的密码
 * @returns {Object} 验证结果 { isValid: boolean, message: string }
 */
export function validatePassword(password) {
  if (!validateMinLength(password, 8)) {
    return {
      isValid: false,
      message: '密码长度至少为8位'
    };
  }
  
  if (!/[a-zA-Z]/.test(password)) {
    return {
      isValid: false,
      message: '密码必须包含字母'
    };
  }
  
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: '密码必须包含数字'
    };
  }
  
  return { isValid: true };
}

/**
 * 验证用户类型
 * @param {string} userType - 用户类型
 * @returns {boolean} 验证结果
 */
export function validateUserType(userType) {
  return ['receiver', 'dispatcher'].includes(userType);
}

/**
 * 验证订单状态
 * @param {string} status - 订单状态
 * @returns {boolean} 验证结果
 */
export function validateOrderStatus(status) {
  return ['pending', 'processing', 'completed', 'cancelled'].includes(status);
}

/**
 * 验证是否为有效的手机号
 * @param {string} phone - 手机号
 * @returns {boolean} 验证结果
 */
export function validatePhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

/**
 * 综合验证函数，返回第一个失败的验证结果
 * @param {Array<Function>} validators - 验证函数数组
 * @returns {Object} 验证结果 { isValid: boolean, message: string }
 */
export function validateWithValidators(validators) {
  for (const validator of validators) {
    const result = validator();
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
}