import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        '@/editor': path.resolve(__dirname, './src/editor'),
        '@/layout': path.resolve(__dirname, './src/layout'),
        '@/stores': path.resolve(__dirname, './src/stores'),
        '@/db': path.resolve(__dirname, './src/db'),
        '@/hooks': path.resolve(__dirname, './src/hooks'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/data': path.resolve(__dirname, './src/data'),
      },
    },
    build: {
      minify: 'esbuild',
      esbuild: {
        drop: isProduction ? ['console', 'debugger'] : [],
      },
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'codemirror': ['@uiw/react-codemirror', '@codemirror/lang-markdown', '@codemirror/view'],
            'dnd-kit': ['@dnd-kit/core', '@dnd-kit/utilities'],
            'other-vendor': ['lucide-react', 'motion/react', 'dexie', 'zustand'],
          },
        },
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react', 'motion/react', 'zustand'],
      force: false,
    },
    server: {
      force: false,
    },
  };
});
