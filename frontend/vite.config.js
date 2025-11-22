import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  // 确保环境变量在构建时正确处理
  define: {
    'process.env': {}
  },
  // 确保构建输出目录正确
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})