// app.js
const storage = require('./utils/storage.js');

App({
  // 云开发环境配置 - 使用动态环境
  cloud: {
    env: wx.cloud.DYNAMIC_CURRENT_ENV
  },
  globalData: {
    userInfo: null,
    token: null,
    apiBaseUrl: '', // 本地开发环境，不使用Netlify路径
    isLoggedIn: false
  },

  onLaunch() {
    // 初始化云开发环境，使用动态环境配置
    wx.cloud.init({
      env: wx.cloud.DYNAMIC_CURRENT_ENV,
      traceUser: true
    });
    
    // 从本地存储获取用户信息
    this.initUserData();
  },

  // 初始化用户数据
  initUserData() {
    try {
      const userInfo = storage.get('userInfo');
      const token = storage.get('token');
      
      if (token && userInfo) {
        this.globalData.token = token;
        this.globalData.userInfo = userInfo;
        this.globalData.isLoggedIn = true;
        console.log('已恢复登录状态');
      } else {
        console.log('未登录状态');
      }
    } catch (e) {
      console.error('获取本地存储数据失败:', e);
    }
  },

  // 用户登录处理
  login(userData) {
    try {
      // 保存用户信息和token
      storage.set('token', userData.token);
      storage.set('userInfo', userData);
      this.globalData.token = userData.token;
      this.globalData.userInfo = userData;
      this.globalData.isLoggedIn = true;
      console.log('登录成功，用户信息已保存');
      return true;
    } catch (e) {
      console.error('保存登录信息失败:', e);
      return false;
    }
  },

  // 用户登出处理
  logout() {
    try {
      // 清除本地存储
      storage.remove('token');
      storage.remove('userInfo');
      this.globalData.token = null;
      this.globalData.userInfo = null;
      this.globalData.isLoggedIn = false;
      console.log('登出成功，已清除登录信息');
      return true;
    } catch (e) {
      console.error('清除登录信息失败:', e);
      return false;
    }
  },

  // 检查是否已登录
  isLoggedIn() {
    return this.globalData.isLoggedIn && this.globalData.token;
  },

  // 获取当前用户信息
  getUserInfo() {
    return this.globalData.userInfo;
  },

  // 获取当前用户类型
  getUserType() {
    return this.globalData.userInfo?.userType || null;
  }
});