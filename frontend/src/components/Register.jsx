import { useState } from 'react'
import axios from 'axios'
import { Link, useNavigate } from 'react-router-dom'

// 配置axios基础URL，使用简化的API路径
axios.defaults.baseURL = ''

function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [userType, setUserType] = useState('receiver')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // 验证密码是否一致
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    try {
      await axios.post('/api/users/register', {
        username,
        password,
        userType
      })
      
      // 注册成功，跳转到登录页面
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.message || '注册失败，请稍后重试')
    }
  }

  return (
    <div className="register-container">
      <div className="register-form">
        <h2>注册</h2>
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
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>用户类型</label>
            <div className="user-type-options">
              <label>
                <input
                  type="radio"
                  value="receiver"
                  checked={userType === 'receiver'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                接单员
              </label>
              <label>
                <input
                  type="radio"
                  value="dispatcher"
                  checked={userType === 'dispatcher'}
                  onChange={(e) => setUserType(e.target.value)}
                />
                派单员
              </label>
            </div>
          </div>
          <button type="submit">注册</button>
        </form>
        <p className="login-link">
          已有账号？ <Link to="/login">登录</Link>
        </p>
      </div>
    </div>
  )
}

export default Register