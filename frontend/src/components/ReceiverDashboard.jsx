import { useState, useEffect } from 'react'
import axios from 'axios'
import './ReceiverDashboard.css'

function ReceiverDashboard({ user, onLogout }) {
  const [pendingOrders, setPendingOrders] = useState([])
  const [deliveringOrders, setDeliveringOrders] = useState([])
  const [completedOrders, setCompletedOrders] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    deliveringCount: 0,
    completedCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statsLoading, setStatsLoading] = useState(true)
  
  // 查询相关状态
  const [queryInfo, setQueryInfo] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  // 获取待接单订单
  const fetchPendingOrders = async () => {
    try {
      const response = await axios.get('/api/orders/pending', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setPendingOrders(response.data)
    } catch (err) {
      setError('获取待接单订单失败')
    }
  }

  // 获取接单员的所有订单
  const fetchReceiverOrders = async () => {
    try {
      const response = await axios.get('/api/orders/receiver', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // 分离配送中和已完成订单
      const delivering = response.data.filter(order => order.status === 'delivering')
      const completed = response.data.filter(order => order.status === 'completed')
      
      setDeliveringOrders(delivering)
      setCompletedOrders(completed)
    } catch (err) {
      setError('获取订单失败')
    }
  }

  // 接单
  const handleAcceptOrder = async (orderId) => {
    try {
      console.log('正在接受订单，订单ID:', orderId);
      await axios.put(`/api/orders/accept/${orderId}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // 重新获取订单列表和统计数据
      fetchPendingOrders()
      fetchReceiverOrders()
      fetchStats()
    } catch (err) {
      console.error('接单错误详情:', err);
      const errorMessage = err.response?.data?.message || '接单失败';
      setError(`接单失败: ${errorMessage}`);
    }
  }

  // 完成订单
  const handleCompleteOrder = async (orderId) => {
    try {
      await axios.put(`/api/orders/complete/${orderId}`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      // 重新获取订单列表和统计数据
      fetchReceiverOrders()
      fetchStats()
    } catch (err) {
      setError('完成订单失败')
    }
  }

  // 订单查询功能
  const handleSearch = async () => {
    if (!queryInfo.trim()) {
      setSearchError('请输入查询信息')
      return
    }
    
    try {
      setSearchLoading(true)
      setSearchError('')
      
      const response = await axios.get('/api/orders/search', {
        params: { info: queryInfo.trim() },
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      setSearchResults(response.data)
      setShowSearchResults(true)
    } catch (err) {
      console.error('查询订单失败:', err)
      setSearchError('查询失败，请稍后重试')
    } finally {
      setSearchLoading(false)
    }
  }

  const resetSearch = () => {
    setQueryInfo('')
    setSearchResults([])
    setSearchError('')
    setShowSearchResults(false)
  }

  // 获取订单统计数据
  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const response = await axios.get('/api/orders/stats/receiver', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setStats(response.data)
    } catch (err) {
      console.error('获取统计数据失败:', err)
      // 不显示错误，因为不影响核心功能
    } finally {
      setStatsLoading(false)
    }
  }

  // 页面加载和刷新时获取订单和统计数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchPendingOrders(), fetchReceiverOrders(), fetchStats()])
      setLoading(false)
    }
    fetchData()

    // 定时刷新订单列表和统计数据（每30秒）
    const interval = setInterval(() => {
      fetchPendingOrders()
      fetchReceiverOrders()
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>接单员仪表盘</h1>
        <div className="user-info">
          <span>欢迎, {user.username}</span>
          <button onClick={onLogout} className="logout-btn">退出登录</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        {/* 订单查询区域 */}
        <section className="search-section">
          <h2>订单查询</h2>
          <div className="search-form">
            <input
              type="text"
              placeholder="请输入订单号、收货人姓名或手机号"
              value={queryInfo}
              onChange={(e) => setQueryInfo(e.target.value)}
              className="search-input"
            />
            <button 
              onClick={handleSearch} 
              className="search-btn"
              disabled={searchLoading}
            >
              {searchLoading ? '查询中...' : '查询'}
            </button>
            <button 
              onClick={resetSearch} 
              className="reset-btn"
            >
              重置
            </button>
          </div>
          
          {searchError && <div className="search-error">{searchError}</div>}
          
          {showSearchResults && (
            <div className="search-results">
              <div className="result-summary">
                找到 {searchResults.length} 个订单
              </div>
              <div className="search-orders-list">
                {searchResults.map((order) => (
                  <div key={order._id} className="order-card">
                    <div className="order-header">
                      <span className="order-id">订单号: {order._id}</span>
                      <span className={`order-status ${
                        order.status === 'pending' ? 'pending' :
                        order.status === 'delivering' ? 'delivering' : 'completed'
                      }`}>
                        {order.status === 'pending' ? '待接单' :
                         order.status === 'delivering' ? '配送中' : '已完成'}
                      </span>
                    </div>
                    <div className="order-info">
                      <div className="info-item">
                        <span className="label">收货人: </span>
                        <span className="value">{order.receiverName}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">电话: </span>
                        <span className="value">{order.receiverPhone}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">地址: </span>
                        <span className="value">{order.deliveryAddress}</span>
                      </div>
                      <div className="info-item">
                        <span className="label">下单时间: </span>
                        <span className="value">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
        
        {/* 订单统计卡片 */}
        <section className="stats-section">
          <h2>订单统计</h2>
          <div className="stats-cards">
            <div className="stat-card total">
              <div className="stat-value">{statsLoading ? '--' : stats.totalOrders}</div>
              <div className="stat-label">总接取订单</div>
            </div>
            <div className="stat-card delivering">
              <div className="stat-value">{statsLoading ? '--' : stats.deliveringCount}</div>
              <div className="stat-label">配送中</div>
            </div>
            <div className="stat-card completed">
              <div className="stat-value">{statsLoading ? '--' : stats.completedCount}</div>
              <div className="stat-label">已完成</div>
            </div>
          </div>
        </section>
        
        {/* 待接单订单 */}
        <section className="order-section">
          <h2>待接单订单</h2>
          {pendingOrders.length === 0 ? (
            <div className="no-orders">暂无待接单订单</div>
          ) : (
            <div className="order-list">
              {pendingOrders.map(order => (
                <div key={order.id} className="order-card pending">
                  <div className="order-header">
                    <span className="order-number">订单号: {order.orderNumber}</span>
                    <span className="order-status">待接单</span>
                  </div>
                  <div className="order-content">
                    <p>{order.content}</p>
                  </div>
                  <div className="order-footer">
                    <span className="order-time">
                      创建时间: {new Date(order.createdAt).toLocaleString()}
                    </span>
                    <button 
                      className="accept-btn"
                      onClick={() => handleAcceptOrder(order.id)}
                    >
                      接单
                    </button>
                  </div>
                  {/* 显示派单员信息 */}
                  <div className="order-dispatcher-info">
                    <strong>派单员:</strong> 
                    {order.dispatcherName || '未知派单员'}
                    {order.dispatcherPhone && (
                      <span className="dispatcher-phone"> ({order.dispatcherPhone})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 配送中订单 */}
        <section className="order-section">
          <h2>配送中订单</h2>
          {deliveringOrders.length === 0 ? (
            <div className="no-orders">暂无配送中订单</div>
          ) : (
            <div className="order-list">
              {deliveringOrders.map(order => (
                <div key={order.id} className="order-card delivering">
                  <div className="order-header">
                    <span className="order-number">订单号: {order.orderNumber}</span>
                    <span className="order-status">配送中</span>
                  </div>
                  <div className="order-content">
                    <p>{order.content}</p>
                  </div>
                  <div className="order-footer">
                    <span className="order-time">
                      接单时间: {new Date(order.updatedAt).toLocaleString()}
                    </span>
                    <button 
                      className="complete-btn"
                      onClick={() => handleCompleteOrder(order.id)}
                    >
                      完成
                    </button></div>
                  {/* 显示派单员信息 */}
                  <div className="order-dispatcher-info">
                    <strong>派单员:</strong> 
                    {order.dispatcherName || '未知派单员'}
                    {order.dispatcherPhone && (
                      <span className="dispatcher-phone"> ({order.dispatcherPhone})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 已完成订单 */}
        <section className="order-section">
          <h2>已完成订单</h2>
          {completedOrders.length === 0 ? (
            <div className="no-orders">暂无已完成订单</div>
          ) : (
            <div className="order-list">
              {completedOrders.map(order => (
                <div key={order.id} className="order-card completed">
                  <div className="order-header">
                    <span className="order-number">订单号: {order.orderNumber}</span>
                    <span className="order-status">已完成</span>
                  </div>
                  <div className="order-content">
                    <p>{order.content}</p>
                  </div>
                  <div className="order-footer">
                    <span className="order-time">
                      完成时间: {new Date(order.updatedAt).toLocaleString()}
                    </span>
                  </div>
                  {/* 显示派单员信息 */}
                  <div className="order-dispatcher-info">
                    <strong>派单员:</strong> 
                    {order.dispatcherName || '未知派单员'}
                    {order.dispatcherPhone && (
                      <span className="dispatcher-phone"> ({order.dispatcherPhone})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ReceiverDashboard