import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { compression } from 'vite-plugin-compression2';

const ReactCompilerConfig = {
  target: '19',
};

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [
      react({
        babel: {
          plugins: [
            ['babel-plugin-react-compiler', ReactCompilerConfig],
          ],
        },
      }),
      tailwindcss(),
      compression({
        algorithms: ['gzip', 'brotliCompress'],
        threshold: 1024,
        deleteOriginalAssets: false,
      }),
    ],
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
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('@codemirror/view') || id.includes('@codemirror/state')) {
                return 'codemirror-view';
              }
              if (id.includes('@uiw/react-codemirror') || id.includes('@codemirror/lang-markdown')) {
                return 'codemirror-editor';
              }
              if (id.includes('@dnd-kit/core')) {
                return 'dnd-kit-core';
              }
              if (id.includes('@dnd-kit/utilities')) {
                return 'dnd-kit-utils';
              }
              if (id.includes('lucide-react') || id.includes('motion/react') || id.includes('dexie') || id.includes('zustand')) {
                return 'other-vendor';
              }
              return 'vendor';
            }
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
    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      setupFiles: ['./src/test-setup.ts'],
    },
  };
});