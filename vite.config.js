import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: ['@mui/material/Tooltip', '@mui/material/Unstable_Grid2'],
    exclude: ['@mui/icons-material']
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  }
})
