import { useState } from 'react'
import axios from 'axios'

// 配置axios基础URL
// 适配Netlify Functions的API路径
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '/.netlify/functions/api'
import { Link, useNavigate } from 'react-router-dom'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    try {
      const response = await axios.post('/users/login', {
        username,
        password
      })
      
      // 登录成功，保存用户信息
      onLogin(response.data)
      
      // 根据用户类型跳转到相应的仪表盘
      if (response.data.userType === 'receiver') {
        navigate('/receiver')
      } else {
        navigate('/dispatcher')
      }
    } catch (err) {
      setError(err.response?.data?.message || '登录失败，请检查用户名和密码')
    }
  }

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>登录</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">登录</button>
        </form>
        <p className="register-link">
          还没有账号？ <Link to="/register">注册</Link>
        </p>
      </div>
    </div>
  )
}

export default Login