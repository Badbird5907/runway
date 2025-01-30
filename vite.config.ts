import { defineConfig } from 'vite'
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin'
import tsconfigPaths from 'vite-tsconfig-paths'
import * as fs from 'fs'
import path from 'path'
import dynamicImport from 'vite-plugin-dynamic-import'
import vsixPlugin from '@codingame/monaco-vscode-rollup-vsix-plugin'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(
  fs.readFileSync(new URL('./package.json', import.meta.url)).toString()
)

const localDependencies = Object.entries(pkg.dependencies as Record<string, string>)
  .filter(([, version]) => version.startsWith('file:../'))
  .map(([name]) => name)

const port = 5173
export default defineConfig({
  build: {
    target: 'esnext',

    rollupOptions: {
      input: {
        main: './index.html',
        webcontainer: './react.html'
      }
    }
  },

  worker: {
    format: 'es'
  },
  assetsInclude: ['**/*.html'],
  plugins: [
    {
      // For the *-language-features extensions which use SharedArrayBuffer
      name: 'configure-response-headers',
      apply: 'serve',
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless')
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
          next()
        })
      }
    },
    {
      name: 'force-prevent-transform-assets',
      apply: 'serve',
      configureServer(server) {
        return () => {
          server.middlewares.use(async (req, res, next) => {
            if (req.originalUrl != null) {
              const pathname = new URL(req.originalUrl, 'http://dummy').pathname
              if (pathname.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html')
                res.writeHead(200)
                console.log("-> serving", pathname)
                // check if the file exists
                const filePath = path.join('.', pathname)
                if (fs.existsSync(filePath)) {
                  res.write(fs.readFileSync(filePath))
                } else {
                  res.write("File not found")
                }
                res.end()
              }
            }

            next()
          })
        }
      }
    },
    tsconfigPaths(),
    dynamicImport(),
    vsixPlugin(),
    tailwindcss(),
    react()
  ],
  esbuild: {
    minifySyntax: false
  },
  optimizeDeps: {
    // This is require because vite excludes local dependencies from being optimized
    // Monaco-vscode-api packages are local dependencies and the number of modules makes chrome hang
    include: [
      // add all local dependencies...
      ...localDependencies,
      // and their exports
      'vscode/extensions',
      'vscode/services',
      'vscode/monaco',
      'vscode/localExtensionHost',

      // These 2 lines prevent vite from reloading the whole page when starting a worker (so 2 times in a row after cleaning the vite cache - for the editor then the textmate workers)
      // it's mainly empirical and probably not the best way, fix me if you find a better way
      'vscode-textmate',
      'vscode-oniguruma',
      '@vscode/vscode-languagedetection',
      'marked'
    ],
    exclude: [],
    esbuildOptions: {
      tsconfig: './tsconfig.json',
      plugins: [importMetaUrlPlugin]
    }
  },
  server: {
    port: port,
    host: '0.0.0.0',
    headers: {

      "cross-origin-opener-policy": "same-origin",
      "cross-origin-embedder-policy": "credentialless",
    },
    proxy: {
      "^/webcontainer/.*": {
        target: `http://localhost:${port}`,
        rewrite: () => `/react.html`
      }
    }
  },

  define: {
    rootDirectory: JSON.stringify(__dirname)
  },
  resolve: {
    dedupe: ['vscode', ...localDependencies]
  }
})