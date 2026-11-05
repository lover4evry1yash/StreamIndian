import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import postcssColorMix from '@csstools/postcss-color-mix-function';
import postcssOklab from '@csstools/postcss-oklab-function';
import postcssCustomProperties from 'postcss-custom-properties';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(({ mode }) => {
  return {
    base: mode === 'tizen' ? './' : '/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'tizen-webapis-bootstrap',
        transformIndexHtml(html) {
          if (mode !== 'tizen') return html;
          return html.replace(
            '</head>',
            '    <script type="text/javascript" src="$WEBAPIS/webapis/webapis.js"></script>\n  </head>'
          );
        },
      },
    ],
    css: mode === 'tizen'
      ? {
          postcss: {
            plugins: [
              postcssCustomProperties({ preserve: true }),
              postcssColorMix({ preserve: true }),
              postcssOklab({ preserve: true }),
            ],
          },
        }
      : undefined,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: mode === 'tizen' ? 'chrome85' : 'chrome69',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/scheduler/')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/dexie/')) {
              return 'vendor-db';
            }
            if (id.includes('node_modules/hls.js/')) {
              return 'hls'; // Should already be separate but good to ensure
            }
            if (id.includes('node_modules/')) {
              return 'vendor'; // Fallback for other node_modules
            }
            // Keep core startup-critical stuff in a single file?
            if (
              id.includes('/src/core/ServiceContainer') ||
              id.includes('/src/core/EventBus') ||
              id.includes('/src/core/Logger') ||
              id.includes('/src/core/navigation/') ||
              id.includes('/src/core/Bootstrap') ||
              id.includes('/src/core/providers/ProviderManager') ||
              id.includes('/src/core/metadata/')
            ) {
              return 'core';
            }
          }
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
