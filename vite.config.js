import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

// 通用配置
const commonConfig = {
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    clean: true,
    rollupOptions: {
      input: {
        options: resolve(__dirname, 'src/options/index.jsx'),
        popup: resolve(__dirname, 'src/options/popup/popup.js'),
        background: resolve(__dirname, 'src/background/background.js')
      },
      output: {
        dir: 'dist',
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'background/background.js';
          }
          if (chunkInfo.name === 'popup') {
            return 'popup/popup.js';
          }
          return '[name]/index.js';
        },
        chunkFileNames: 'shared/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.includes('icons/')) {
            return assetInfo.name;
          }
          return 'assets/[name].[ext]';
        }
      }
    }
  }
};

// 根据命令行参数返回不同的配置
export default defineConfig(({ command, mode }) => {
  const config = command === 'serve' || mode === 'development'
    ? {
        ...commonConfig,
        build: {
          ...commonConfig.build,
          watch: {
            include: ['src/**/*'],
            ignored: [
              '**/node_modules/**',
              '**/dist/**',
              '**/.git/**'
            ]
          }
        }
      }
    : commonConfig;

  // 添加插件来复制 manifest.json 和图标
  config.plugins.push({
    name: 'copy-extension-files',
    generateBundle() {
      // 复制 manifest.json
      const manifestPath = resolve(__dirname, 'manifest.json');
      const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
      this.emitFile({
        type: 'asset',
        fileName: 'manifest.json',
        source: manifestContent
      });

      // 复制 options 的 HTML 和 CSS
      const optionsHtmlPath = resolve(__dirname, 'src/options/index.html');
      const optionsHtmlContent = fs.readFileSync(optionsHtmlPath, 'utf-8');
      this.emitFile({
        type: 'asset',
        fileName: 'options/index.html',
        source: optionsHtmlContent
      });

      const optionsCssPath = resolve(__dirname, 'src/options/options.css');
      const optionsCssContent = fs.readFileSync(optionsCssPath, 'utf-8');
      this.emitFile({
        type: 'asset',
        fileName: 'options/options.css',
        source: optionsCssContent
      });

      // 复制 popup 的 HTML 和 CSS
      const popupHtmlPath = resolve(__dirname, 'src/options/popup/index.html');
      const popupHtmlContent = fs.readFileSync(popupHtmlPath, 'utf-8');
      this.emitFile({
        type: 'asset',
        fileName: 'popup/index.html',
        source: popupHtmlContent
      });

      const popupCssPath = resolve(__dirname, 'src/options/popup/popup.css');
      const popupCssContent = fs.readFileSync(popupCssPath, 'utf-8');
      this.emitFile({
        type: 'asset',
        fileName: 'popup/popup.css',
        source: popupCssContent
      });

      // 复制图标文件
      const iconSizes = ['16', '48', '128'];
      iconSizes.forEach(size => {
        const iconPath = resolve(__dirname, `src/assets/icons/icon${size}.png`);
        const iconContent = fs.readFileSync(iconPath);
        this.emitFile({
          type: 'asset',
          fileName: `icons/icon${size}.png`,
          source: iconContent
        });
      });
    }
  });

  return config;
});