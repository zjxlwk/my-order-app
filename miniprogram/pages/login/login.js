// 登录页面
const app = getApp();
const { login } = require('../../utils/apiService.js');
const storage = require('../../utils/storage.js');

Page({
  data: {
    username: '',
    password: '',
    error: '',
    loading: false
  },

  // 输入框内容变化
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value
    });
  },

  // 登录提交
  async login() {
    const { username, password } = this.data;

    // 表单验证
    if (!username || !password) {
      this.setData({
        error: '请输入用户名和密码'
      });
      return;
    }

    this.setData({
      loading: true,
      error: ''
    });

    try {
      // 使用封装的API发送登录请求（调用云函数）
      const result = await login({ username, password });
      
      if (result.code === 200 && result.data) {
        // 清除错误信息以避免同时显示成功和错误提示
        this.setData({ error: '' });
        
        // 登录成功，保存用户信息
        if (app.login(result.data)) {
          // 根据用户类型跳转到不同仪表盘
          if (result.data.userType === 'receiver') {
            wx.navigateTo({
              url: '../receiverDashboard/receiverDashboard'
            });
          } else if (result.data.userType === 'dispatcher') {
            wx.navigateTo({
              url: '../dispatcherDashboard/dispatcherDashboard'
            });
          }
        } else {
          this.setData({
            error: '保存登录信息失败'
          });
        }
      } else {
        this.setData({
          error: result.message || '登录失败，请检查用户名和密码'
        });
      }
    } catch (err) {
      console.error('登录请求失败:', err);
      this.setData({
        error: err.message || '网络错误，请稍后重试'
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  // 跳转到注册页面
  goToRegister() {
    wx.navigateTo({
      url: '../register/register'
    });
  }
});