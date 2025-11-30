// 接单员仪表盘页面
const app = getApp();
const { getOrderList, acceptOrder, completeOrder, getOrderStats } = require('../../utils/apiService.js');
const storage = require('../../utils/storage.js');
// 使用require导入format工具
const { formatDateTime } = require('../../utils/format.js');

Page({
  data: {
    pendingOrders: [],
    deliveringOrders: [],
    completedOrders: [],
    orderStats: {
      total: 0,
      pending: 0,
      delivering: 0,
      completed: 0
    },
    searchQuery: '',
    loading: false,
    error: '',
    activeTab: 'pending', // 当前激活的标签页：pending, delivering, completed
    refreshing: false,
    showModal: false,
    modalTitle: '',
    modalOrders: [],
    // 当前登录用户信息
    currentUser: ''
  },

  onShow() {
    // 页面显示时检查登录状态
    if (!app.isLoggedIn()) {
      wx.redirectTo({
        url: '../login/login'
      });
      return;
    }
    
    // 获取并设置当前用户信息
    this.setCurrentUserInfo();
    
    // 加载统计数据和订单数据
    this.loadOrderStats();
    this.loadOrders();
  },
  
  // 设置当前登录用户信息
  setCurrentUserInfo() {
    const userInfo = app.getUserInfo();
    if (userInfo) {
      this.setData({
        currentUser: userInfo.username || '用户'
      });
    }
  },

  // 加载订单统计数据
  async loadOrderStats() {
    try {
      // 使用封装的API获取订单统计（调用云函数）
      const result = await getOrderStats();
      
      // 安全地处理返回数据
      if (result.code === 200) {
        // 确保数据格式正确
        const statsData = {
          total: result.data?.total || 0,
          pending: result.data?.pending || 0,
          delivering: result.data?.delivering || 0,
          completed: result.data?.completed || 0
        };
        
        this.setData({ orderStats: statsData });
      } else {
        throw new Error(result.message || '获取统计数据失败');
      }
    } catch (err) {
      // 显示错误提示给用户
      wx.showToast({
        title: err.message || '加载统计数据失败，请重试',
        icon: 'none',
        duration: 2000
      });
      // 重置统计数据为默认值
      this.setData({
        orderStats: {
          total: 0,
          pending: 0,
          delivering: 0,
          completed: 0
        }
      });
    }
  },

  // 加载订单数据
  async loadOrders() {
    this.setData({ loading: true, error: '' });

    try {
      // 根据当前标签页加载对应状态的订单
      const status = this.data.activeTab === 'pending' ? 'pending' :
                    this.data.activeTab === 'delivering' ? 'delivering' : 'completed';
      
      // 使用封装的API获取订单列表（调用云函数）
      const result = await getOrderList({
        status,
        userType: 'receiver',
        query: this.data.searchQuery
      });

      const orders = result.code === 200 && Array.isArray(result.data) ? result.data : [];
      
      console.log(`加载订单数据 - 状态: ${status}, 订单数量: ${orders.length}`);
      
      // 格式化订单时间
      const formattedOrders = orders.map(order => {
        // 确保所有时间字段在格式化前存在并有效
        console.log(`订单ID: ${order._id}, acceptedAt:`, order.acceptedAt);
        return {
          ...order,
          createdAt: formatDateTime(order.createdAt) || '暂无创建时间',
          acceptedAt: formatDateTime(order.acceptedAt) || '待确认',
          completedAt: formatDateTime(order.completedAt) || '待完成'
        };
      });
      
      if (formattedOrders.length > 0) {
        console.log('第一个订单的ID:', formattedOrders[0].id);
        console.log('订单对象结构:', JSON.stringify(formattedOrders[0]));
      }
      
      if (this.data.activeTab === 'pending') {
        console.log('设置待接单列表，订单数量:', formattedOrders.length);
        this.setData({ pendingOrders: formattedOrders });
      } else if (this.data.activeTab === 'delivering') {
        this.setData({ deliveringOrders: formattedOrders });
      } else {
        this.setData({ completedOrders: formattedOrders });
      }
    } catch (err) {
      console.error('加载订单失败:', err);
      this.setData({ error: err.message || '网络错误，请稍后重试' });
    } finally {
      this.setData({ loading: false, refreshing: false });
    }
  },

  // 切换标签页
  switchTab(e) {
    const { tab } = e.currentTarget.dataset;
    this.setData({ activeTab: tab });
    this.loadOrders();
  },

  // 搜索框输入
  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
  },

  // 执行搜索
  searchOrders() {
    this.loadOrders();
  },

  // 接单操作功能已合并到handleAcceptOrder方法中

  // 完成订单操作
  async completeOrder(e) {
    const { orderId } = e.currentTarget.dataset;
    
    wx.showModal({
      title: '确认完成',
      content: '确认该订单已完成配送？',
      success: async (resModal) => {
        if (resModal.confirm) {
          try {
            // 使用封装的API完成订单（调用云函数）
            const result = await completeOrder(orderId);
            
            if (result.code === 200) {
              wx.showToast({ title: '订单已完成' });
              // 重新加载配送中列表
              this.loadOrders();
              // 重新加载统计数据，确保数据同步
              this.loadOrderStats();
            } else {
              throw new Error(result.message || '操作失败');
            }
          } catch (err) {
            console.error('完成订单操作失败:', err);
            wx.showToast({ 
              title: err.message || '操作失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 下拉刷新
  async onPullDownRefresh() {
    this.setData({ refreshing: true });
    // 同时刷新订单列表和统计数据
    try {
      // 先加载统计数据，确保显示准确的待接单数
      await this.loadOrderStats();
      // 然后加载订单列表
      await this.loadOrders();
    } catch (err) {
      console.error('下拉刷新失败:', err);
    } finally {
      // 无论如何都要结束刷新状态
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    }
  },
  
  // 手动刷新统计数据
  async refreshStats(e) {
    wx.showLoading({ title: '刷新中...' });
    try {
      // 刷新统计数据
      await this.loadOrderStats();
      
      // 如果当前在待接单标签页，也刷新订单列表
      if (this.data.activeTab === 'pending') {
        await this.loadOrders();
      }
      
      wx.showToast({ title: '刷新成功', icon: 'success' });
      
      // 如果点击的是待接单卡片且需要显示详情，延迟执行showOrderDetails
      // 这样用户既能看到刷新效果，又能查看详情
      if (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.status === 'pending') {
        setTimeout(() => {
          this.showOrderDetails(e);
        }, 800);
      }
    } catch (err) {
      console.error('刷新统计数据失败:', err);
      wx.showToast({ 
        title: err.message || '刷新失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },
  
  // 格式化订单状态文本
  getStatusText(status) {
    const statusMap = {
      pending: '待接单',
      delivering: '配送中',
      completed: '已完成'
    };
    return statusMap[status] || '未知状态';
  },
  
  // 显示订单详情模态框
  async showOrderDetails(e) {
    const { status } = e.currentTarget.dataset;
    let title = '订单详情';
    let statusParam = status;
    
    // 设置标题
    switch(status) {
      case 'all':
        title = '总订单列表';
        statusParam = '';
        break;
      case 'pending':
        title = '待接单列表';
        break;
      case 'delivering':
        title = '配送中列表';
        break;
      case 'completed':
        title = '已完成列表';
        break;
    }
    
    // 显示加载状态
    wx.showLoading({ title: '加载中...' });
    
    try {
      // 获取对应状态的订单
      const result = await getOrderList({
        status: statusParam || undefined,
        userType: 'receiver',
        limit: 50 // 获取足够数量的订单显示在模态框中
      });
      
      const orders = result.code === 200 && Array.isArray(result.data) ? result.data : [];
      
      // 格式化订单
      const formattedOrders = orders.map(order => ({
        ...order,
        createdAt: order.createdAt ? formatDateTime(order.createdAt) : '暂无创建时间',
        statusText: this.getStatusText(order.status)
      }));
      
      // 更新数据并显示模态框
      this.setData({
        showModal: true,
        modalTitle: title,
        modalOrders: formattedOrders
      });
    } catch (err) {
      console.error('获取订单详情失败:', err);
      wx.showToast({
        title: '加载订单失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },
  
  // 关闭模态框
  closeModal() {
    this.setData({
      showModal: false,
      modalOrders: []
    });
  },


  
  // 接单处理函数
  async handleAcceptOrder(e) {
    // 检查e对象是否存在
    if (!e) {
      wx.showToast({
        title: '系统错误，请刷新页面',
        icon: 'none'
      });
      return;
    }
    
    // 从多个可能的键中获取订单ID，增加获取成功的可能性
    let orderId = null;
    const dataset = e.currentTarget?.dataset || {};
    
    // 尝试所有可能的键名
    const possibleKeys = ['orderId', 'orderid', 'id', '_id', 'order-id'];
    for (const key of possibleKeys) {
      if (dataset[key] && dataset[key] !== 'undefined' && dataset[key] !== null) {
        orderId = dataset[key];
        break;
      }
    }
    
    // 直接从e.currentTarget.dataset.orderId获取（微信小程序会自动转换为驼峰命名）
    if (!orderId && e.currentTarget?.dataset?.orderId) {
      orderId = e.currentTarget.dataset.orderId;
    }
    
    if (!orderId || orderId === 'undefined' || orderId === null || orderId === '') {
      wx.showToast({
        title: '无法获取订单信息，请刷新页面',
        icon: 'none'
      });
      return;
    }
    
    try {
      // 调用API进行接单
      const result = await acceptOrder(orderId);
      
      if (result && result.code === 200) {
        // 显示成功提示
        wx.showToast({ 
          title: '接单成功！',
          icon: 'success',
          duration: 2000
        });
        
        // 短暂延迟后再重新加载，确保云函数有足够时间处理
        setTimeout(async () => {
          // 先加载统计数据，确保待接单数量正确更新
          await this.loadOrderStats();
          
          // 然后加载待接单列表（接单后订单会从这个列表移除）
          await this.loadOrders();
          
          // 再加载配送中列表（接单后订单会出现在这个列表）
          const currentTab = this.data.activeTab;
          this.setData({ activeTab: 'delivering' }, async () => {
            await this.loadOrders();
            // 恢复到原始标签页
            this.setData({ activeTab: currentTab });
          });
        }, 1000); // 增加延迟时间确保数据完全同步
      } else {
        throw new Error(result?.message || '接单失败');
      }
    } catch (err) {
      wx.showToast({
        title: err.message || '操作失败',
        icon: 'none',
        duration: 2000
      });
    }
  },
  

  
  // 登出
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.logout();
          wx.redirectTo({
            url: '../login/login'
          });
        }
      }
    });
  }
});