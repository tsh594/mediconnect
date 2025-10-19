import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    define: {
        global: 'globalThis',
    },
    resolve: {
        alias: {
            crypto: 'crypto-browserify'
        }
    },
    server: {
        host: true,
        port: 5173,
        strictPort: true,
        hmr: {
            overlay: false
        },
        cors: true
    },
    build: {
        chunkSizeWarningLimit: 1600,
        rollupOptions: {
            external: [],
            onwarn: (warning, warn) => {
                if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
                    return
                }
                warn(warning)
            }
        }
    },
    optimizeDeps: {
        exclude: ['lucide-react'],
        include: ['@google/genai', 'leaflet']
    }
})