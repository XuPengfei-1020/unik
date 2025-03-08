import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    watch: {
      include: ['options/src/**/*'],
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.git/**',
        '**/options/index.html'
      ]
    },
    rollupOptions: {
      input: resolve(__dirname, 'options/index.html'),
      output: {
        dir: 'dist',
        entryFileNames: 'options/[name].js',
        chunkFileNames: 'options/chunks/[name].[hash].js',
        assetFileNames: 'options/assets/[name].[ext]'
      }
    }
  }
});