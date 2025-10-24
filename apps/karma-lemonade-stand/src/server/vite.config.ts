import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'server',
      fileName: 'index',
      formats: ['cjs']
    },
    outDir: '../../dist/server',
    emptyOutDir: true,
    rollupOptions: {
      external: ['@devvit/web', 'express'],
      output: {
        format: 'cjs',
        entryFileNames: 'index.cjs'
      }
    },
    target: 'node18',
    ssr: true
  },
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared')
    }
  }
});
