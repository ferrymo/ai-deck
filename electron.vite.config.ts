import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'electron-vite';

export default defineConfig({
  main: {
    build: {
      target: 'node24',
      rolldownOptions: {
        input: { index: resolve('src/main/index.ts'), worker: resolve('src/worker/index.ts') },
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
  preload: {
    build: {
      externalizeDeps: false,
      rolldownOptions: {
        input: resolve('src/preload/index.ts'),
        external: ['electron'],
        output: { format: 'cjs', entryFileNames: 'index.cjs', codeSplitting: false },
      },
    },
  },
  renderer: {
    plugins: [react()],
    build: { target: 'chrome152', rolldownOptions: { input: resolve('src/renderer/index.html') } },
  },
});
