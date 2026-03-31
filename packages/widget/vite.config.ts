import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.ts'),
      name: 'ChatbotWidget',
      fileName: (format) => `widget.${format}.js`,
      formats: ['es', 'umd'],
    },
    rollupOptions: {
      output: {
        globals: {},
      },
    },
    minify: true,
    cssCodeSplit: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
