import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'chrome69',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-db': ['dexie'],
            'core': [
              './src/core/ServiceContainer.ts',
              './src/core/EventBus.ts',
              './src/core/Logger.ts',
              './src/core/navigation/FocusEngine.ts',
              './src/core/navigation/FocusGroup.ts',
              './src/core/navigation/NavigationManager.ts',
            ],
            'rendering': [
              './src/core/rendering/ImageManager.ts',
              './src/core/rendering/PrefetchManager.ts',
              './src/core/rendering/RenderMetrics.ts',
              './src/components/LazyImage.tsx',
            ],
            'metadata': [
              './src/core/metadata/MetadataManager.ts',
            ],
            'providers': [
              './src/providers/index.ts',
              './src/providers/indianMediaCatalog.ts'
            ],
            'iptv': ['./src/components/IPTVView.tsx', './src/core/iptv/IptvManager.ts'],
            'search': ['./src/components/SearchView.tsx'],
            'details': ['./src/components/UniversalMediaDetailView.tsx'],
            'player': ['./src/components/TVPlayer.tsx'],
            'settings': ['./src/components/SettingsView.tsx'],
            'diagnostics': ['./src/components/AuditPanel.tsx']
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
