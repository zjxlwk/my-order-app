// 请求超时处理和用户反馈机制

/**
 * 带超时的Promise执行函数
 * @param {Promise} promise - 要执行的Promise
 * @param {number} timeoutMs - 超时时间（毫秒）
 * @param {string} timeoutMessage - 超时错误消息
 * @returns {Promise} - 执行结果
 */
export function withTimeout(promise, timeoutMs = 10000, timeoutMessage = '请求超时，请检查网络连接') {
  return new Promise((resolve, reject) => {
    // 设置超时定时器
    const timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    // 执行原始Promise
    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * 处理云函数调用的超时逻辑
 * @param {Function} cloudFunc - 云函数调用方法
 * @param {Object} params - 云函数参数
 * @param {number} timeoutMs - 超时时间
 * @returns {Promise} - 执行结果
 */
export async function callCloudFunctionWithTimeout(cloudFunc, params = {}, timeoutMs = 10000) {
  try {
    // 调用云函数并设置超时
    const result = await withTimeout(cloudFunc(params), timeoutMs);
    return result;
  } catch (error) {
    // 处理超时或其他错误
    if (error.message.includes('请求超时')) {
      wx.showToast({
        title: '网络请求超时',
        icon: 'none',
        duration: 2000
      });
      throw new Error('请求超时，请稍后重试');
    }
    throw error;
  }
}

/**
 * 封装wx.request，添加超时处理和统一的错误提示
 * @param {Object} options - 请求配置
 * @param {number} timeoutMs - 超时时间
 * @returns {Promise} - 请求结果
 */
export function requestWithTimeout(options, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const { success, fail, ...restOptions } = options;
    let timeoutId;

    // 覆盖success回调
    const successHandler = (res) => {
      clearTimeout(timeoutId);
      if (success) {
        success(res);
      }
      resolve(res);
    };

    // 覆盖fail回调
    const failHandler = (err) => {
      clearTimeout(timeoutId);
      if (fail) {
        fail(err);
      }
      reject(err);
    };

    // 发送请求
    const requestTask = wx.request({
      ...restOptions,
      success: successHandler,
      fail: failHandler
    });

    // 设置超时
    timeoutId = setTimeout(() => {
      requestTask.abort(); // 取消请求
      const error = { errMsg: 'request:fail timeout' };
      if (fail) {
        fail(error);
      }
      reject(error);
    }, timeoutMs);
  });
}

/**
 * 显示操作成功提示
 * @param {string} message - 提示消息
 * @param {number} duration - 显示时长
 */
export function showSuccess(message = '操作成功', duration = 2000) {
  wx.showToast({
    title: message,
    icon: 'success',
    duration: duration
  });
}

/**
 * 显示错误提示
 * @param {string} message - 错误消息
 * @param {number} duration - 显示时长
 */
export function showError(message = '操作失败', duration = 2000) {
  wx.showToast({
    title: message,
    icon: 'none',
    duration: duration
  });
}

/**
 * 显示加载提示
 * @param {string} message - 提示消息
 * @returns {Object} - 包含hide方法的对象
 */
export function showLoading(message = '加载中') {
  wx.showLoading({
    title: message,
    mask: true
  });
  return {
    hide: () => wx.hideLoading()
  };
}

/**
 * 统一处理API响应结果
 * @param {Object} response - API响应
 * @param {Function} successCallback - 成功回调
 * @param {Function} errorCallback - 错误回调
 * @param {boolean} showErrorMessage - 是否显示错误信息
 * @returns {*} - 处理结果
 */
export function handleApiResponse(response, successCallback, errorCallback, showErrorMessage = true) {
  // 安全地检查response
  if (!response) {
    const errorMessage = '无效的API响应';
    console.error('API请求失败:', errorMessage);
    
    if (showErrorMessage) {
      showError(errorMessage);
    }
    
    if (errorCallback) {
      // 返回错误对象而不是抛出异常
      return errorCallback({
        code: 500,
        message: errorMessage,
        data: null
      });
    }
    // 返回错误对象而不是抛出异常
    return {
      code: 500,
      message: errorMessage,
      data: null
    };
  }
  
  if (response.code === 200) {
    // 成功响应
    if (successCallback) {
      return successCallback(response.data);
    }
    return response.data;
  } else {
    // 错误响应
    const errorMessage = response.message || '请求失败，请稍后重试';
    const errorCode = response.code || 500;
    console.error('API请求失败:', errorMessage, 'Code:', errorCode);
    
    // 只有在需要时才显示错误信息，避免重复显示
    if (showErrorMessage) {
      showError(errorMessage);
    }
    
    if (errorCallback) {
      // 返回错误对象而不是抛出异常
      return errorCallback({
        code: errorCode,
        message: errorMessage,
        data: null
      });
    }
    // 返回错误对象而不是抛出异常
    return {
      code: errorCode,
      message: errorMessage,
      data: null
    };
  }
}