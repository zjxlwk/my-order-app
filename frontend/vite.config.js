import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      proxy: {
        '/.netlify/functions/api': {
          target: env.VITE_API_URL || 'http://localhost:8888',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/.netlify\/functions/, '')
        }
      }
    },
    // 确保环境变量在构建时正确处理
    define: {
      'import.meta.env': env
    },
    // 确保构建输出目录正确
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // 配置构建后的资源路径，适合Netlify部署
      emptyOutDir: true
    }
  }
})