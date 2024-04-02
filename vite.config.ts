import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // manualChunks: {
        //   react: ['react', 'react-is', 'react/jsx-runtime'],
        //   'react-dom': ['react-dom'],
        // },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if(id.includes('/react-dom')){
              return 'react-dom'
            }
            if(id.includes('/react')){
              return 'react'
            }
            if(id.includes('rc-')){
              return 'rc'
            }
            if(id.includes('@ant-design+icons')){
              return 'icons'
            }
            if(id.includes('@ant-design+')){
              return 'antd1'
            }
            if(id.includes('antd')){
              return 'antd'
            }
            if(id.includes('babel')){
              return 'babel'
            }
            console.log(id)
          }
          
        }
      },
    },
  },
  plugins: [react()],
})
