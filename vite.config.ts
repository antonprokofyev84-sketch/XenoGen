import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ command }) => {
  const isProduction = command === 'build';

  return {
    plugins: [react(), svgr()],
    base: isProduction ? '/XenoGen/' : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});
