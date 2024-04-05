import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 23336,
    proxy: {
      "/api": {
        target: "http://localhost:9000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/ws": {
        target: "localhost:9000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ws/, ""),
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // manualChunks: {
        //   react: ['react', 'react-is', 'react/jsx-runtime'],
        //   'react-dom': ['react-dom'],
        // },
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("/react")) {
              return "react";
            }
            if (id.includes("/react-dom")) {
              return "react-dom";
            }
            // if(id.includes('@ant-design') || id.includes('antd') || id.includes('rc-')){
            //   return 'antd'
            // }
            if (
              !id.includes("@ant-design") &&
              !id.includes("antd") &&
              !id.includes("rc-")
            ) {
              return "vendors";
            }
            // if(id.includes('@ant-design+icons')){
            //   return 'icons'
            // }
            // if(id.includes('@ant-design+')){
            //   return 'antd1'
            // }
            // if(id.includes('babel')){
            //   return 'babel'
            // }
            // console.log(id)
          }
        },
      },
    },
  },
  plugins: [react()],
});
