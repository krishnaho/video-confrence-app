import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic' // Modern JSX transform
  })],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'styled-components',
      'peerjs'
    ],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      }
    }
  },
  define: {
    global: 'globalThis' // Fix for peerjs and crypto issues
  }
});