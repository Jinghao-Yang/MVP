import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/editor': path.resolve(__dirname, './src/editor'),
        '@/layout': path.resolve(__dirname, './src/layout'),
        '@/store': path.resolve(__dirname, './src/store'),
        '@/types': path.resolve(__dirname, './src/@types'),
        '@/data': path.resolve(__dirname, './src/data'),
      },
    },
  };
});
