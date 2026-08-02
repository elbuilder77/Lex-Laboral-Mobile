import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const exposeDevServer = env.VITE_EXPOSE_DEV_SERVER === 'true';
    return {
      server: {
        port: 5173,
        host: exposeDevServer ? '0.0.0.0' : '127.0.0.1',
        cors: exposeDevServer
          ? { origin: [/^http:\/\/localhost:\d+$/, /^http:\/\/127\.0\.0\.1:\d+$/] }
          : false,
        allowedHosts: exposeDevServer ? true : ['localhost', '127.0.0.1'],
        proxy: {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          },
        },
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        modulePreload: {
          resolveDependencies(_, deps, context) {
            if (context.hostType !== 'html') return deps;

            return deps.filter((dep) =>
              !dep.includes('vendor-pdf') && !dep.includes('vendor-charts')
            );
          },
        },
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                const normalizedId = id.replace(/\\/g, '/');
                if (
                  normalizedId.includes('/node_modules/react/') ||
                  normalizedId.includes('/node_modules/react-dom/') ||
                  normalizedId.includes('/node_modules/scheduler/')
                ) {
                  return 'vendor-react';
                }
                if (id.includes('recharts')) return 'vendor-charts';
                if (id.includes('jspdf')) return 'vendor-pdf';
                if (id.includes('@supabase')) return 'vendor-supabase';
                if (id.includes('framer-motion')) return 'vendor-motion';
                if (
                  id.includes('react-markdown') ||
                  id.includes('remark-') ||
                  id.includes('micromark') ||
                  id.includes('unified') ||
                  id.includes('hast-') ||
                  id.includes('mdast-') ||
                  id.includes('unist-') ||
                  id.includes('vfile')
                ) {
                  return 'vendor-markdown';
                }
                if (id.includes('lucide-react')) return 'vendor-icons';
              }
            }
          }
        }
      }
    };
});
