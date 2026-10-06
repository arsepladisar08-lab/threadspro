process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd(), '');
  const aiMode = env.VITE_AI_MODE || process.env.VITE_AI_MODE || 'direct';
  const isProd = mode === 'production';
  // Hanya inject key di preview/dev atau mode direct, jangan di bundle produksi proxy
  const shouldDefineKey = !isProd || aiMode === 'direct';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    define: {
      'process.env.GEMINI_API_KEY': shouldDefineKey 
        ? JSON.stringify(process.env.GEMINI_API_KEY || process.env.API_KEY || env.GEMINI_API_KEY || '')
        : '""',
      'process.env.API_KEY': shouldDefineKey 
        ? JSON.stringify(process.env.API_KEY || process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || '')
        : '""',
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
