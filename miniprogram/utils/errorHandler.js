// 通用错误处理模块

/**
 * 错误代码定义
 */
export const ErrorCode = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
};

/**
 * 错误信息映射
 */
const errorMessages = {
  [ErrorCode.BAD_REQUEST]: '请求参数错误',
  [ErrorCode.UNAUTHORIZED]: '未授权访问',
  [ErrorCode.FORBIDDEN]: '禁止访问',
  [ErrorCode.NOT_FOUND]: '资源不存在',
  [ErrorCode.CONFLICT]: '资源冲突',
  [ErrorCode.SERVER_ERROR]: '服务器内部错误'
};

/**
 * 创建标准错误响应
 * @param {number} code - 错误代码
 * @param {string} message - 自定义错误信息（可选）
 * @param {*} data - 附加数据（可选）
 * @returns {Object} 错误响应对象
 */
export function createErrorResponse(code, message = null, data = null) {
  return {
    code,
    message: message || errorMessages[code] || '未知错误',
    data
  };
}

/**
 * 云函数错误处理包装器
 * @param {Function} fn - 要执行的云函数逻辑
 * @returns {Function} 包装后的函数
 */
export function wrapCloudFunction(fn) {
  return async (event, context) => {
    try {
      return await fn(event, context);
    } catch (error) {
      console.error('云函数执行错误:', error);
      return createErrorResponse(
        ErrorCode.SERVER_ERROR,
        '服务器内部错误',
        { error: error.message }
      );
    }
  };
}

/**
 * 处理API请求错误
 * @param {Object} error - 错误对象
 * @returns {Object} 处理后的错误响应
 */
export function handleApiError(error) {
  if (error.code) {
    return error; // 如果已经是标准错误格式，则直接返回
  }
  
  return createErrorResponse(
    ErrorCode.SERVER_ERROR,
    error.message || '请求失败',
    { error: error.message }
  );
}

/**
 * 显示用户友好的错误提示
 * @param {Object} error - 错误对象
 * @param {string} defaultMessage - 默认错误信息
 */
export function showError(error, defaultMessage = '操作失败') {
  const message = error.message || defaultMessage;
  wx.showToast({
    title: message,
    icon: 'none',
    duration: 2000
  });
}