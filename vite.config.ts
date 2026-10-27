import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // Address of the backend as seen by the Vite process. The default works for
  // local development only; when Vite runs in a container or the backend binds
  // to another interface, point this at the reachable address
  // (e.g. http://backend:8000, http://host.docker.internal:8000 or the
  // Tailscale IP). A mismatch here makes every /api request return 500.
  const apiProxyTarget = env.VITE_API_PROXY_TARGET?.trim() || 'http://127.0.0.1:8000'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      allowedHosts: ['odin.markhor-tone.ts.net', 'odin-server.markhor-tone.ts.net'],
      port: 5173,
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'three-core': ['three', '@react-three/fiber'],
          },
        },
      },
    },
  }
})
