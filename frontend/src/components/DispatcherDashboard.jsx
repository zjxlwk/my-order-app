import { useState, useEffect } from 'react'
import axios from 'axios'
import './DispatcherDashboard.css'

function DispatcherDashboard({ user, onLogout }) {
  const [orderContent, setOrderContent] = useState('')
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingCount: 0,
    deliveringCount: 0,
    completedCount: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [statsLoading, setStatsLoading] = useState(true)
  
  // 查询相关状态
  const [searchUsername, setSearchUsername] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [showSearchResults, setShowSearchResults] = useState(false)

  // 获取已派订单
  const fetchOrders = async () => {
    try {
      const response = await axios.get('/orders/dispatcher', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      setOrders(response.data)
    } catch (err) {
      setError('获取订单失败')
    }
  }

  // 创建新订单（派单）
  const handleCreateOrder = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (!orderContent.trim()) {
      setError('订单内容不能为空')
      return
    }

    try {
      await axios.post('/orders/create', {
        content: orderContent
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })

      // 清空表单
      setOrderContent('')
      
      // 显示成功消息
      setSuccessMessage('订单创建成功')
      
      // 重新获取订单列表和统计数据
      fetchOrders()
      fetchStats()

      // 3秒后清除成功消息
      setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
    } catch (err) {
      setError('创建订单失败')
    }
  }

  // 获取订单统计数据
  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const response = await axios.get('/orders/stats/dispatcher', {
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
      await fetchOrders()
      await fetchStats()
      setLoading(false)
    }
    fetchData()

    // 定时刷新订单列表和统计数据（每30秒）
    const interval = setInterval(() => {
      fetchOrders()
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // 获取订单状态显示文本
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '待接单'
      case 'delivering':
        return '配送中'
      case 'completed':
        return '已完成'
      default:
        return status
    }
  }

  // 获取订单状态对应的样式类
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'pending'
      case 'delivering':
        return 'delivering'
      case 'completed':
        return 'completed'
      default:
        return ''
    }
  }

  if (loading) {
    return <div className="loading">加载中...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>派单员仪表盘</h1>
        <div className="user-info">
          <span>欢迎, {user.username}</span>
          <button onClick={onLogout} className="logout-btn">退出登录</button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="dashboard-content">
        {/* 订单统计卡片 */}
        <section className="stats-section">
          <h2>订单统计</h2>
          <div className="stats-cards">
            <div className="stat-card total">
              <div className="stat-value">{statsLoading ? '--' : stats.totalOrders}</div>
              <div className="stat-label">总派出订单</div>
            </div>
            <div className="stat-card pending">
              <div className="stat-value">{statsLoading ? '--' : stats.pendingCount}</div>
              <div className="stat-label">待接单</div>
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
        
        {/* 派单表单 */}
        <section className="order-section">
          <h2>创建新订单</h2>
          <form onSubmit={handleCreateOrder} className="create-order-form">
            <div className="form-group">
              <label>订单内容</label>
              <textarea
                value={orderContent}
                onChange={(e) => setOrderContent(e.target.value)}
                placeholder="请输入订单内容..."
                rows="4"
                required
              ></textarea>
            </div>
            <button type="submit" className="create-btn">创建订单</button>
          </form>
        </section>

        {/* 已派订单列表 */}
        <section className="order-section">
          <h2>已派订单</h2>
          {orders.length === 0 ? (
            <div className="no-orders">暂无已派订单</div>
          ) : (
            <div className="order-list">
              {orders.map(order => (
                <div key={order.id} className={`order-card ${getStatusClass(order.status)}`}>
                  <div className="order-header">
                    <span className="order-number">订单号: {order.orderNumber}</span>
                    <span className={`order-status ${getStatusClass(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div className="order-content">
                    <p>{order.content}</p>
                  </div>
                  <div className="order-footer">
                    <span className="order-time">
                      创建时间: {new Date(order.createdAt).toLocaleString()}
                    </span>
                    {order.updatedAt && order.updatedAt !== order.createdAt && (
                      <span className="order-time">
                        更新时间: {new Date(order.updatedAt).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {/* 显示接单员信息（仅当订单已被接单时） */}
                  {(order.status === 'delivering' || order.status === 'completed') && (
                    <div className="order-receiver-info">
                      <strong>接单员:</strong> 
                      {order.receiverUsername || '未知接单员'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
        
        {/* 接单员订单查询 */}
        <section className="order-section">
          <h2>查询接单员订单</h2>
          <form onSubmit={handleSearch} className="search-form">
            <div className="form-group">
              <label>接单员用户名</label>
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder="请输入接单员用户名..."
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="search-btn" disabled={searchLoading}>
                {searchLoading ? '查询中...' : '查询'}
              </button>
              {showSearchResults && (
                <button type="button" className="reset-btn" onClick={resetSearch}>
                  重置
                </button>
              )}
            </div>
          </form>
          
          {searchError && (
            <div className="error-message">{searchError}</div>
          )}
          
          {showSearchResults && !searchLoading && (
            <div className="search-results">
              <h3>查询结果 - 接单员: {searchUsername}</h3>
              <div className="result-summary">
                共 {searchResults.length} 个订单
              </div>
              
              {searchResults.length === 0 ? (
                <div className="no-orders">未找到此接单员的订单</div>
              ) : (
                <div className="order-list">
                  {searchResults.map(order => (
                    <div key={order.id} className={`order-card ${getStatusClass(order.status)}`}>
                      <div className="order-header">
                        <span className="order-number">订单号: {order.orderNumber || order.id}</span>
                        <span className={`order-status ${getStatusClass(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <div className="order-content">
                        <p>{order.content}</p>
                      </div>
                      <div className="order-footer">
                        <span className="order-time">
                          创建时间: {new Date(order.createdAt).toLocaleString()}
                        </span>
                        {order.updatedAt && order.updatedAt !== order.createdAt && (
                          <span className="order-time">
                            更新时间: {new Date(order.updatedAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <div className="order-dispatcher-info">
                        <strong>派单员:</strong> {order.dispatcherUsername || '未知派单员'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

  // 处理接单员订单查询
  const handleSearch = async (e) => {
    e.preventDefault()
    setSearchError('')
    setSearchLoading(true)
    
    try {
      const response = await axios.get(`/orders/search/receiver?username=${encodeURIComponent(searchUsername)}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      setSearchResults(response.data)
      setShowSearchResults(true)
    } catch (err) {
      setSearchError('查询失败，请检查接单员用户名是否正确')
      console.error('查询接单员订单失败:', err)
    } finally {
      setSearchLoading(false)
    }
  }
  
  // 重置查询
  const resetSearch = () => {
    setSearchUsername('')
    setSearchResults([])
    setShowSearchResults(false)
    setSearchError('')
  }

export default DispatcherDashboard