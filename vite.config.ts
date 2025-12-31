// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => {
  const isProd = command === 'build';

  return {
    plugins: [react()],
    // リポジトリ名 "cross-city-minimal" を指定
    base: isProd ? '/cross-city-minimal/' : '/',
  }
})
