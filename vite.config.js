import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname, basename, relative } from 'path';
import fs from 'fs';
import { globSync } from 'glob';

// 通用配置
const commonConfig = {
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    clean: true,
    chunkSizeWarningLimit: 1000,
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
            return 'options/popup/popup.js';
          }
          return '[name]/index.js';
        },
        chunkFileNames: 'shared/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.includes('icons/')) {
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
            include: ['src/**/*', 'manifest.json'],
            ignored: [
              '**/node_modules/**',
              '**/dist/**',
              '**/.git/**'
            ]
          }
        }
      }
    : commonConfig;

  // 添加插件来复制文件
  config.plugins.push({
    name: 'copy-extension-files',
    generateBundle() {
      // 通用复制函数，支持通配符
      const copyFiles = (pattern, targetDir = '') => {
        const files = globSync(pattern);
        files.forEach(file => {
          const fileName = basename(file);
          const subDir = dirname(file).replace(/^src[\\/]/, '');
          const targetPath = targetDir || subDir;
          // 规范化路径，移除开头的 ./ 和多余的斜杠
          const outputPath = targetPath
            ? `${targetPath}/${fileName}`.replace(/^\.\//, '').replace(/\\/g, '/')
            : fileName;

          const content = fs.readFileSync(file,
            /\.(png|jpg|jpeg|gif|webp|ico|svg)$/i.test(file) ? null : 'utf-8');

          this.emitFile({
            type: 'asset',
            fileName: outputPath,
            source: content
          });
        });
      };

      // 复制 manifest.json
      copyFiles('manifest.json');

      // 复制 HTML 文件
      copyFiles('src/options/**/*.html');

      // 复制 CSS 文件
      copyFiles('src/options/**/*.css');

      // 复制图标文件
      copyFiles('src/assets/icons/*.png', 'icons');

      // 如果有其他类型的文件也需要复制，可以在这里添加
      // 例如：复制字体文件
      // copyFiles('src/assets/fonts/*.*', 'assets/fonts');
    }
  });

  return config;
});