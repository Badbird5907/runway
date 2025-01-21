import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import vsixPlugin from "@codingame/monaco-vscode-rollup-vsix-plugin";
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';

import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), vsixPlugin()],
  build: {
    target: "es2022",
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'index.html')
      },
    },
    emptyOutDir: false,
    assetsInlineLimit: 0,
    outDir: path.resolve(__dirname, 'production')
  },
  server: {
    port: 7581,
    cors: {
      origin: "*"
    },
    headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  worker: {
    format: "es"
  },
  esbuild: {
    minifySyntax: false,
  },
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        importMetaUrlPlugin
      ]
    },
    include: [
      'vscode-textmate',
      'vscode-oniguruma'
    ]
  }
});

