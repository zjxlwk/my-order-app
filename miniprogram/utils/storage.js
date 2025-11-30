// 数据存储工具类

/**
 * 封装微信小程序的存储方法，替代localStorage
 */

/**
 * 保存数据到本地存储
 * @param {string} key - 存储键名
 * @param {any} value - 存储值
 * @returns {boolean} - 是否保存成功
 */
function set(key, value) {
  try {
    const valueStr = typeof value === 'string' ? value : JSON.stringify(value);
    wx.setStorageSync(key, valueStr);
    return true;
  } catch (error) {
    console.error('保存数据失败:', error);
    return false;
  }
}

/**
 * 从本地存储获取数据
 * @param {string} key - 存储键名
 * @param {any} defaultValue - 默认值，当数据不存在时返回
 * @returns {any} - 存储的数据或默认值
 */
function get(key, defaultValue = null) {
  try {
    const value = wx.getStorageSync(key);
    if (value === '') {
      return defaultValue;
    }
    
    // 尝试解析JSON，如果失败则返回原始值
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  } catch (error) {
    console.error('获取数据失败:', error);
    return defaultValue;
  }
}

/**
 * 删除本地存储中的数据
 * @param {string} key - 存储键名
 * @returns {boolean} - 是否删除成功
 */
function remove(key) {
  try {
    wx.removeStorageSync(key);
    return true;
  } catch (error) {
    console.error('删除数据失败:', error);
    return false;
  }
}

/**
 * 清除所有本地存储的数据
 * @returns {boolean} - 是否清除成功
 */
function clear() {
  try {
    wx.clearStorageSync();
    return true;
  } catch (error) {
    console.error('清除数据失败:', error);
    return false;
  }
}

/**
 * 检查本地存储是否有指定的键
 * @param {string} key - 存储键名
 * @returns {boolean} - 是否存在
 */
function has(key) {
  try {
    const value = wx.getStorageSync(key);
    return value !== undefined;
  } catch (error) {
    console.error('检查数据失败:', error);
    return false;
  }
}

/**
 * 获取本地存储的大小
 * @returns {Object} - 存储信息
 */
function getInfo() {
  try {
    return wx.getStorageInfoSync();
  } catch (error) {
    console.error('获取存储信息失败:', error);
    return null;
  }
}

// 导出方法
module.exports = {
  set,
  get,
  remove,
  clear,
  has,
  getInfo
};
