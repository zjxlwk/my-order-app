// 注册页面
const app = getApp();
const { register } = require('../../utils/apiService.js');

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    userType: 'receiver', // 默认选择接单员
    dispatcherCode: '', // 派单员注册口令
    error: '',
    success: '',
    loading: false
  },

  // 输入框内容变化
  onInputChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [field]: e.detail.value,
      error: ''
    });
  },

  // 选择用户类型
  selectUserType(e) {
    const { type } = e.currentTarget.dataset;
    this.setData({
      userType: type
    });
  },

  // 注册提交
  async register() {
    const { username, password, confirmPassword, userType, dispatcherCode } = this.data;
    const validDispatcherCode = '19976677115'; // 有效的派单员注册口令

    // 表单验证
    if (!username || !password || !confirmPassword) {
      this.setData({
        error: '请填写所有必填字段',
        success: ''
      });
      return;
    }
    
    // 派单员注册时需要验证口令
    if (userType === 'dispatcher') {
      if (!dispatcherCode) {
        this.setData({
          error: '请输入派单员注册口令',
          success: ''
        });
        return;
      }
      
      if (dispatcherCode !== validDispatcherCode) {
        this.setData({
          error: '派单员注册口令不正确',
          success: ''
        });
        return;
      }
    }

    if (password !== confirmPassword) {
      this.setData({
        error: '两次输入的密码不一致',
        success: ''
      });
      return;
    }

    if (password.length < 6) {
      this.setData({
        error: '密码长度至少6位',
        success: ''
      });
      return;
    }

    this.setData({
      loading: true,
      error: '',
      success: ''
    });

    try {
      console.log('准备调用注册API，参数:', { username, password, userType });
      
      // 使用API封装调用，传递dispatcherCode参数
      const result = await register({ username, password, userType, dispatcherCode: userType === 'dispatcher' ? dispatcherCode : '' });

      console.log('注册请求返回结果:', result);

      if (result.code === 200) {
        // 保存用户信息到全局
        app.globalData.userInfo = result.data;
        
        this.setData({
          success: '注册成功，请返回登录',
          username: '',
          password: '',
          confirmPassword: '',
          dispatcherCode: ''
        });
        
        // 显示成功提示
        wx.showToast({
          title: '注册成功',
          icon: 'success',
          duration: 2000
        });
      } else {
        this.setData({
          error: result.message || '注册失败，请稍后重试'
        });
      }
    } catch (err) {
      console.error('注册请求失败:', err);
      this.setData({
        error: err.message || '网络错误，请稍后重试'
      });
    } finally {
      this.setData({
        loading: false
      });
    }
  },

  // 返回登录页面
  goToLogin() {
    wx.navigateBack();
  }
});