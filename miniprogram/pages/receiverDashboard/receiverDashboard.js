// 接单员仪表盘页面
const app = getApp();
const { getOrders, acceptOrder, completeOrder, getOrderStats } = require('../../utils/apiService.js');
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
    refreshing: false
  },

  onShow() {
    // 页面显示时检查登录状态
    if (!app.isLoggedIn()) {
      wx.redirectTo({
        url: '../login/login'
      });
      return;
    }
    
    // 加载统计数据和订单数据
    this.loadOrderStats();
    this.loadOrders();
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
      const result = await getOrders({
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

  // 接单操作
  async acceptOrder(e) {
    console.log('接收到点击事件:', e);
    console.log('dataset内容:', e.currentTarget.dataset);
    
    // 尝试从多个可能的键中获取订单ID
    const dataset = e.currentTarget.dataset;
    let orderId = dataset.orderId || dataset.orderid || dataset.id;
    
    console.log('从dataset提取的orderId:', orderId);
    console.log('orderId类型:', typeof orderId);
    
    if (!orderId || orderId === 'undefined') {
      console.error('无法从dataset中获取有效订单ID');
      wx.showToast({
        title: '系统错误，请刷新页面重试',
        icon: 'none'
      });
      return;
    }
    
    try {
      // 使用封装的API接单（调用云函数）
      console.log('准备调用acceptOrder API，订单ID:', orderId);
      const result = await acceptOrder({ orderId });
      
      if (result.code === 200) {
        wx.showToast({ title: '接单成功' });
        // 切换到配送中标签页
        this.setData({ activeTab: 'delivering' });
        // 重新加载订单列表
        this.loadOrders();
      } else {
        throw new Error(result.message || '接单失败');
      }
    } catch (err) {
      console.error('接单操作失败:', err);
      wx.showToast({ 
        title: err.message || '接单失败',
        icon: 'none'
      });
    }
  },

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
  onPullDownRefresh() {
    this.setData({ refreshing: true });
    this.loadOrders();
  },

  // 新的接单函数：通过view元素传递订单ID
  async acceptOrderByOrderId(e) {
    console.log('acceptOrderByOrderId接收到点击事件:', e);
    console.log('dataset内容:', e.currentTarget.dataset);
    
    const { id } = e.currentTarget.dataset;
    console.log('从dataset提取的订单ID:', id);
    
    if (!id || id === 'undefined') {
      console.error('订单ID无效:', id);
      wx.showToast({
        title: '订单信息错误，请刷新页面',
        icon: 'none'
      });
      return;
    }
    
    try {
      console.log('调用acceptOrder API，订单ID:', id);
      const result = await acceptOrder({ orderId: id });
      
      if (result.code === 200) {
        wx.showToast({ title: '接单成功' });
        // 重新加载待接单列表
        this.loadOrders();
      } else {
        throw new Error(result.message || '接单失败');
      }
    } catch (err) {
      console.error('接单操作失败:', err);
      wx.showToast({ 
        title: err.message || '接单失败',
        icon: 'none'
      });
    }
  },
  
  // 新的接单处理函数
  async handleAcceptOrder(e) {
    // 在函数最开始添加更明显的日志，确保能看到函数被调用
    console.log('========= handleAcceptOrder函数被调用 =========');
    console.log('handleAcceptOrder接收到点击事件:', e);
    
    // 检查e对象是否存在
    if (!e) {
      console.error('错误: 事件对象e不存在');
      wx.showToast({
        title: '系统错误，请刷新页面',
        icon: 'none'
      });
      return;
    }
    
    // 详细记录dataset内容
    const currentTarget = e.currentTarget || e.target;
    console.log('当前目标元素:', currentTarget);
    
    const dataset = currentTarget?.dataset || {};
    console.log('点击元素的dataset内容:', JSON.stringify(dataset));
    
    // 从多个可能的键中获取订单ID，增加获取成功的可能性
    let orderId = null;
    
    // 尝试所有可能的键名
    const possibleKeys = ['orderId', 'orderid', 'id', '_id', 'order-id'];
    for (const key of possibleKeys) {
      if (dataset[key] && dataset[key] !== 'undefined' && dataset[key] !== null) {
        orderId = dataset[key];
        console.log(`从键'${key}'获取到订单ID:`, orderId);
        break;
      }
    }
    
    // 直接从e.currentTarget.dataset.orderId获取（微信小程序会自动转换为驼峰命名）
    if (!orderId && e.currentTarget?.dataset?.orderId) {
      orderId = e.currentTarget.dataset.orderId;
      console.log('通过驼峰命名orderId获取到订单ID:', orderId);
    }
    
    // 额外检查整个e对象，寻找可能的ID信息
    console.log('e对象完整信息:', JSON.stringify(e));
    
    console.log('最终获取到的订单ID:', orderId, '类型:', typeof orderId);
    
    if (!orderId || orderId === 'undefined' || orderId === null || orderId === '') {
      console.error('订单ID无效或未找到:', orderId);
      wx.showToast({
        title: '无法获取订单信息，请刷新页面',
        icon: 'none'
      });
      return;
    }
    
    try {
      // 调用API进行接单
      console.log('调用acceptOrder API，订单ID:', orderId);
      const result = await acceptOrder(orderId);
      
      console.log('接单API返回结果:', result);
      
      if (result && result.code === 200) {
        console.log('接单成功，准备更新UI');
        // 显示更明确的成功提示
        wx.showToast({ 
          title: '接单成功！',
          icon: 'success',
          duration: 2000
        });
        
        // 短暂延迟后再重新加载，确保云函数有足够时间处理
        setTimeout(async () => {
          console.log('延迟后重新加载订单列表');
          // 首先保存当前活动的标签页
          const currentTab = this.data.activeTab;
          
          // 先加载待接单列表（接单后订单会从这个列表移除）
          await this.loadOrders();
          
          // 然后加载配送中列表（接单后订单会出现在这个列表）
          this.setData({ activeTab: 'delivering' }, async () => {
            await this.loadOrders();
            console.log('配送中订单列表已重新加载，数量:', this.data.deliveringOrders.length);
            // 如果有配送中订单，打印第一个订单的接单时间
            if (this.data.deliveringOrders.length > 0) {
              console.log('第一个配送中订单的接单时间:', this.data.deliveringOrders[0].acceptedAt);
            }
            // 恢复到原始标签页
            this.setData({ activeTab: currentTab });
          });
        }, 1000); // 增加延迟时间确保数据完全同步
      } else {
        throw new Error(result?.message || '接单失败');
      }
    } catch (err) {
        console.error('接单操作失败:', err);
        wx.showToast({
          title: err.message || '操作失败',
          icon: 'none',
          duration: 2000
        });
      }
  },
  
  // 测试函数：直接使用指定订单ID进行接单
  async testAcceptOrderDirectly() {
    // 获取第一个待接订单的ID
    if (this.data.pendingOrders && this.data.pendingOrders.length > 0) {
      const testOrderId = this.data.pendingOrders[0]._id;
      
      try {
        console.log('测试直接调用acceptOrder API，订单ID:', testOrderId);
        const result = await acceptOrder(testOrderId);
        
        console.log('测试接单API返回结果:', result);
        if (result && result.code === 200) {
          wx.showToast({ title: '测试接单成功' });
          // 重新加载订单列表
          this.loadOrders();
        } else {
          console.error('测试接单失败:', result?.message);
          wx.showToast({ 
            title: result?.message || '测试接单失败', 
            icon: 'none' 
          });
        }
      } catch (err) {
        console.error('测试接单异常:', err);
        wx.showToast({ 
          title: err.message || '测试失败', 
          icon: 'none' 
        });
      }
    } else {
      wx.showToast({ 
        title: '没有待接订单可测试', 
        icon: 'none' 
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