import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    include: ['buffer', 'process'],
    exclude: ['lucide-react'],
  },
  define: {
    global: 'window',
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
    },
  },
});
