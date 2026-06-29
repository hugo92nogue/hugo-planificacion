import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // permite abrir desde el celular en la misma red (http://IP_DE_TU_PC:5173)
    port: 5173,
  },
})
