import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        cors: true,
        allowedHosts: true
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks(id) {
              if (id.includes('node_modules')) {
                if (id.includes('recharts')) return 'vendor-charts';
                if (id.includes('jspdf')) return 'vendor-pdf';
                if (id.includes('tesseract')) return 'vendor-ocr';
                if (id.includes('@supabase')) return 'vendor-supabase';
                if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('react-markdown')) return 'vendor-ui';
              }
            }
          }
        }
      }
    };
});
