import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: true,
        hmr: false,
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          workbox: {
            maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
            navigateFallbackDenylist: [/^\/api\//],
          },
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'Fenômenos de Transporte',
            short_name: 'Fenômenos',
            description: 'Laboratório virtual de Hidrostática e Empuxo',
            theme_color: '#4f46e5',
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png'
              }
            ]
          }
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      optimizeDeps: {
        include: [
          'react',
          'react-dom',
          'react-dom/client',
          'lucide-react',
          'motion/react',
          'three',
          '@react-three/fiber',
          '@react-three/drei',
          'driver.js',
          'katex',
          'html2canvas',
          'jspdf',
        ],
      },
    });
