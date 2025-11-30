// API服务封装，集成超时处理和统一错误管理

// 导入超时处理工具
import { 
  callCloudFunctionWithTimeout, 
  showLoading, 
  showSuccess, 
  showError,
  handleApiResponse 
} from './timeoutHandler';

// 云函数调用封装
const cloud = wx.cloud;
const app = getApp(); // 获取App实例，用于检查登录状态和获取用户信息

/**
 * 登录接口
 * @param {Object} params - 登录参数
 * @returns {Promise} - 登录结果
 */
export async function login(params) {
  const loader = showLoading('登录中...');
  try {
    const result = await callCloudFunctionWithTimeout(
      cloud.callFunction, 
      { name: 'login', data: params },
      8000 // 8秒超时
    );
    // 只有在结果状态码为200时才显示成功提示
    if (result.result && result.result.code === 200) {
      showSuccess('登录成功');
    } else if (result.result && result.result.code !== 200) {
      // 如果云函数返回了错误状态码，抛出错误以便上层处理
      throw new Error(result.result.message || '登录失败');
    }
    return result.result;
  } catch (error) {
    showError(error.message || '登录失败');
    throw error;
  } finally {
    loader.hide();
  }
}

/**
 * 注册接口
 * @param {Object} params - 注册参数
 * @returns {Promise} - 注册结果
 */
export async function register(params) {
  const loader = showLoading('注册中...');
  try {
    const result = await callCloudFunctionWithTimeout(
      cloud.callFunction, 
      { name: 'register', data: params },
      10000 // 10秒超时
    );
    
    // 只有在结果状态码为200时才显示成功提示
    if (result.result && result.result.code === 200) {
      showSuccess('注册成功');
    } else if (result.result && result.result.code !== 200) {
      // 如果云函数返回了错误状态码，抛出错误以便上层处理
      throw new Error(result.result.message || '注册失败');
    }
    
    return result.result;
  } catch (error) {
    showError(error.message || '注册失败');
    throw error;
  } finally {
    loader.hide();
  }
}

/**
 * 获取订单列表
 * @param {Object} params - 查询参数
 * @returns {Promise} - 订单列表
 */
export async function getOrderList(params = {}) {
  let loader = null;
  try {
    loader = showLoading('加载中...');
    // 从app实例获取用户信息
    const app = getApp();
    const userInfo = app.getUserInfo();
    const userId = userInfo?.userId || '';
    
    const result = await callCloudFunctionWithTimeout(
      cloud.callFunction,
      {
        name: 'orders',
        data: {
          action: 'getList',
          userId: userId || '',
          params
        }
      },
      15000 // 15秒超时，列表查询可能较慢
    );
    
    // 简化错误处理逻辑
    if (result && result.result) {
      // 根据云函数实际返回的状态码修改判断条件
      if (result.result.code === 200) {
        // 成功时直接返回结果对象
        return result.result;
      } else {
        // 失败时返回错误信息对象
        const errorMessage = result.result.message || '获取订单列表失败';
        console.error('获取订单列表失败:', errorMessage);
        return { code: -1, message: errorMessage };
      }
    } else {
      // 处理无效响应
      console.error('获取订单列表失败: 无效响应');
      return { code: -1, message: '获取订单列表失败: 无效响应' };
    }
  } catch (error) {
    // 捕获异常但不重新抛出，只记录日志
    console.error('获取订单列表异常:', error);
    return { code: -1, message: '获取订单列表异常' };
  } finally {
    // 确保始终隐藏loading且loader已定义
    if (loader && typeof loader.hide === 'function') {
      loader.hide();
    }
  }
}

/**
 * getOrders函数 - 作为getOrderList的别名，保持API兼容性
 * @param {Object} params - 查询参数
 * @returns {Promise} - 订单列表
 */
export const getOrders = getOrderList;

/**
 * 创建订单
 * @param {Object} orderData - 订单数据
 * @returns {Promise} - 创建结果
 */
export async function createOrder(orderData) {
  const loader = showLoading('创建订单中...');
  try {
    // 检查用户是否已登录
    if (!app.globalData.userInfo) {
      loader.hide();
      showError('请先登录');
      return {
        code: 401,
        message: '用户未登录',
        data: null
      };
    }

    const userInfo = app.globalData.userInfo;
    const userId = userInfo._id || userInfo.id || userInfo.userId; // 确保能获取到正确的userId字段
    
    if (!userId) {
      loader.hide();
      showError('用户信息不完整');
      return {
        code: 401,
        message: '用户信息不完整',
        data: null
      };
    }

    // 获取用户位置信息（如果需要）
    let location = null;
    try {
      const locationPromise = new Promise((resolve, reject) => {
        wx.getLocation({
          type: 'gcj02',
          success: (res) => resolve(res),
          fail: (err) => {
            console.warn('获取位置信息失败:', err);
            resolve(null); // 位置信息不是必须的
          },
          timeout: 5000 // 位置获取超时5秒
        });
      });
      const locationResult = await locationPromise;
      if (locationResult) {
        location = {
          latitude: locationResult.latitude,
          longitude: locationResult.longitude
        };
      }
    } catch (locationError) {
      console.warn('位置信息处理错误:', locationError);
      // 继续执行，位置信息不是必须的
    }

    const result = await callCloudFunctionWithTimeout(
      cloud.callFunction, 
      { 
        name: 'orders', 
        data: { 
          action: 'create',
          userId: userId, // 传递userId参数给云函数
          params: {
            ...orderData,
            location: location
          } // 将订单数据包装在params中，符合云函数的参数结构要求
        } 
      },
      10000 // 10秒超时
    );
    
    // 检查result对象的完整性
    if (!result || !result.result) {
      console.error('无效的响应格式:', result);
      return {
        code: 500,
        message: '服务响应异常',
        data: null
      };
    }
    
    // 直接返回云函数的完整响应，而不是通过handleApiResponse处理
    return result.result;
  } catch (error) {
    // 记录错误但不抛出，避免全局错误处理被触发
    console.error('创建订单请求失败:', error);
    return {
      code: 500,
      message: error.message || '创建订单失败',
      data: null
    };
  } finally {
    loader.hide();
  }
}

/**
 * 接单操作
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 操作结果
 */
export async function acceptOrder(orderId) {
  const loader = showLoading('接单中...');
  try {
    // 检查用户是否已登录
    if (!app.globalData.userInfo) {
      loader.hide();
      showError('请先登录');
      return {
        code: 401,
        message: '用户未登录',
        data: null
      };
    }

    const userInfo = app.globalData.userInfo;
    const userId = userInfo._id || userInfo.id || userInfo.userId; // 确保能获取到正确的userId字段
    
    if (!userId) {
      loader.hide();
      showError('用户信息不完整');
      return {
        code: 401,
        message: '用户信息不完整',
        data: null
      };
    }

    const result = await callCloudFunctionWithTimeout(
      cloud.callFunction, 
      { 
        name: 'orders', 
        data: { 
          action: 'accept',
          userId: userId, // 传递userId参数给云函数
          params: { orderId: orderId }
        } 
      },
      8000 // 8秒超时
    );
    
    return handleApiResponse(
      result.result,
      (data) => {
        showSuccess('接单成功');
        // 返回完整的响应对象，包含code字段，以便上层判断成功
        return {
          code: 200,
          message: '接单成功',
          data: data
        };
      },
      (error) => {
        throw error;
      }
    );
  } catch (error) {
    showError(error.message || '接单失败');
    throw error;
  } finally {
    loader.hide();
  }
}

/**
 * 完成订单
 * @param {string} orderId - 订单ID
 * @returns {Promise} - 操作结果
 */
export async function completeOrder(orderId) {
  const loader = showLoading('确认完成中...');
  try {
    // 检查用户是否已登录
    if (!app.globalData.userInfo) {
      loader.hide();
      showError('请先登录');
      return {
        code: 401,
        message: '用户未登录',
        data: null
      };
    }

    const userInfo = app.globalData.userInfo;
    const userId = userInfo._id || userInfo.id || userInfo.userId; // 确保能获取到正确的userId字段
    
    if (!userId) {
      loader.hide();
      showError('用户信息不完整');
      return {
        code: 401,
        message: '用户信息不完整',
        data: null
      };
    }

    const result = await callCloudFunctionWithTimeout(
      cloud.callFunction, 
      { 
        name: 'orders', 
        data: { 
          action: 'completeOrder',
          userId: userId, // 传递userId参数给云函数
          params: { orderId: orderId }
        } 
      },
      8000 // 8秒超时
    );
    
    return handleApiResponse(
      result.result,
      (data) => {
        showSuccess('订单已完成');
        // 返回完整的响应对象，包含code字段，以便上层判断成功
        return {
          code: 200,
          message: '订单已完成',
          data: data
        };
      },
      (error) => {
        throw error;
      }
    );
  } catch (error) {
    showError(error.message || '操作失败');
    throw error;
  } finally {
    loader.hide();
  }
}

/**
 * 获取订单统计数据
 * @returns {Promise} - 订单统计结果
 */
export async function getOrderStats() {
  const loader = showLoading('加载统计数据中...');
  try {
    // 检查用户是否已登录
    if (!app.globalData.userInfo) {
      loader.hide();
      showError('请先登录');
      return {
        code: 401,
        message: '用户未登录',
        data: null
      };
    }

    const userInfo = app.globalData.userInfo;
    const userId = userInfo._id || userInfo.id || userInfo.userId; // 确保能获取到正确的userId字段
    
    if (!userId) {
      loader.hide();
      showError('用户信息不完整');
      return {
        code: 401,
        message: '用户信息不完整',
        data: null
      };
    }

    const result = await callCloudFunctionWithTimeout(
      cloud.callFunction, 
      { 
        name: 'orders', 
        data: { 
          action: 'getStats',
          userId: userId
        } 
      },
      8000 // 8秒超时
    );
    
    // 检查result对象的完整性
    if (!result || !result.result) {
      console.error('无效的响应格式:', result);
      return {
        code: 500,
        message: '服务响应异常',
        data: null
      };
    }
    
    // 直接返回云函数的完整响应
    return result.result;
  } catch (error) {
    // 记录错误但不抛出，避免全局错误处理被触发
    console.error('获取订单统计失败:', error);
    return {
      code: 500,
      message: error.message || '获取订单统计失败',
      data: null
    };
  } finally {
    loader.hide();
  }
}

// 导出默认对象
export default {
  login,
  register,
  getOrderList,
  createOrder,
  acceptOrder,
  completeOrder,
  getOrderStats
};