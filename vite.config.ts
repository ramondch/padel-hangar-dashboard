import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// NOTA: Cambia 'padel-hangar-dashboard' por el nombre exacto de tu repositorio en GitHub.
export default defineConfig({
  plugins: [react()],
  base: '/padel-hangar-dashboard/',
})
