import { useState, useEffect } from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './components/Login'
import Register from './components/Register'
import ReceiverDashboard from './components/ReceiverDashboard'
import DispatcherDashboard from './components/DispatcherDashboard'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // 检查是否已登录
  useEffect(() => {
    const token = localStorage.getItem('token')
    const userInfo = localStorage.getItem('user')
    if (token && userInfo) {
      setUser(JSON.parse(userInfo))
    }
    setLoading(false)
  }, [])

  // 登录处理
  const handleLogin = (userData) => {
    localStorage.setItem('token', userData.token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
  }

  // 登出处理
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={user ? <Navigate to={user.userType === 'receiver' ? '/receiver' : '/dispatcher'} /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={user ? <Navigate to={user.userType === 'receiver' ? '/receiver' : '/dispatcher'} /> : <Register />} />
          <Route path="/receiver" element={user && user.userType === 'receiver' ? <ReceiverDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/dispatcher" element={user && user.userType === 'dispatcher' ? <DispatcherDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App