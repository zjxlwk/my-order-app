// 派单员仪表盘页面
const app = getApp();
const { getOrderStats, getOrderList, createOrder } = require('../../utils/apiService.js');
const format = require('../../utils/format.js');

Page({
  data: {
    orderStats: {
      total: 0,
      pending: 0,
      delivering: 0,
      completed: 0
    },
    dispatchedOrders: [],
    searchQuery: '',
    loading: false,
    error: '',
    creatingOrder: false,
    // 新建订单表单
    newOrderForm: {
      orderId: '',
      deliveryAddress: '',
      contactPerson: '',
      contactPhone: '',
      note: ''
    },
    refreshing: false,
    showNewOrderForm: false,
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
    
    // 加载统计数据和订单列表
    this.loadOrderStats();
    this.loadDispatchedOrders();
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

  // 加载已派订单列表
  async loadDispatchedOrders() {
    this.setData({ loading: true, error: '' });

    try {
      // 使用封装的API获取派单员的订单列表（调用云函数）
      const result = await getOrderList({
        userType: 'dispatcher',
        query: this.data.searchQuery
      });
      
      // 兼容多种返回格式并进行数据处理
      if (result.code === 200) {
        let orderList = [];
        
        // 如果data是数组，直接使用
        if (Array.isArray(result.data)) {
          orderList = result.data;
        } 
        // 如果data是对象且包含list属性，使用list数组
        else if (result.data && Array.isArray(result.data.list)) {
          orderList = result.data.list;
        }
        
        // 处理订单数据，确保订单号和状态正确，并格式化时间
        const processedOrders = orderList.map(order => {
          const processedOrder = { ...order };
          
          // 确保订单ID正确映射
          if (!processedOrder.id && processedOrder._id) {
            processedOrder.id = processedOrder._id;
          }
          
          // 设置订单状态显示文本
          const status = processedOrder.status ? String(processedOrder.status).toLowerCase().trim() : '';
          const statusMap = {
            'completed': '已完成',
            'done': '已完成',
            'delivering': '配送中',
            'accepted': '配送中'
          };
          
          // 将状态文本直接添加到订单对象，默认值为'待接单'
          processedOrder.statusText = statusMap[status] || '待接单';
          
          // 格式化订单时间
          processedOrder.createdAt = format.formatDateTime(order.createdAt);
          processedOrder.acceptedAt = format.formatDateTime(order.acceptedAt);
          processedOrder.completedAt = format.formatDateTime(order.completedAt);
          
          return processedOrder;
        });
        
        this.setData({ dispatchedOrders: processedOrders });
      } else {
        this.setData({ dispatchedOrders: [] });
        throw new Error(result.message || '获取订单列表失败');
      }
    } catch (err) {
      const errorMessage = err.message || '网络错误，请稍后重试';
      this.setData({ 
        error: errorMessage,
        dispatchedOrders: []
      });
      // 显示错误提示给用户
      wx.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 2000
      });
    } finally {
      this.setData({ loading: false, refreshing: false });
    }
  },

  // 搜索框输入
  onSearchInput(e) {
    this.setData({ searchQuery: e.detail.value });
  },

  // 执行搜索
  searchOrders() {
    this.loadDispatchedOrders();
  },

  // 显示新建订单表单
  showNewOrderForm() {
    this.setData({ 
      showNewOrderForm: true,
      newOrderForm: {
        orderId: '',
        deliveryAddress: '',
        contactPerson: '',
        contactPhone: '',
        note: ''
      }
    });
  },

  // 关闭新建订单表单
  closeNewOrderForm() {
    this.setData({ showNewOrderForm: false });
  },

  // 表单输入变化
  onFormInputChange(e) {
    const { field } = e.currentTarget.dataset;
    this.setData({
      [`newOrderForm.${field}`]: e.detail.value
    });
  },

  // 创建新订单
  async createNewOrder() {
    const { orderId, deliveryAddress, contactPerson, contactPhone, note } = this.data.newOrderForm;

    // 表单验证
    if (!orderId || !deliveryAddress || !contactPerson || !contactPhone) {
      wx.showToast({ 
        title: '请填写必填字段',
        icon: 'none'
      });
      return;
    }

    this.setData({ creatingOrder: true });

    try {
      // 使用封装的API创建订单（调用云函数）
      const result = await createOrder({
        orderId,
        deliveryAddress,
        contactPerson,
        contactPhone,
        note
      });

      if (result.code === 200) {
        wx.showToast({ title: '创建订单成功' });
        this.closeNewOrderForm();
        // 重新加载数据
        this.loadOrderStats();
        this.loadDispatchedOrders();
      } else {
        throw new Error(result.message || '创建订单失败');
      }
    } catch (err) {
      wx.showToast({ 
        title: err.message || '网络错误，请稍后重试',
        icon: 'none'
      });
    } finally {
      this.setData({ creatingOrder: false });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({ refreshing: true });
    Promise.all([this.loadOrderStats(), this.loadDispatchedOrders()]).finally(() => {
      wx.stopPullDownRefresh();
    });
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
        userType: 'dispatcher',
        limit: 50 // 获取足够数量的订单显示在模态框中
      });
      
      const orders = result.code === 200 && Array.isArray(result.data) ? result.data : [];
      
      // 格式化订单
      const formattedOrders = orders.map(order => ({
        ...order,
        createdAt: format.formatDateTime(order.createdAt) || '暂无创建时间',
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
  }
});