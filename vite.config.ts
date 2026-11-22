import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
// @ts-expect-error Shared ESM API module for dev & production server
import { handleApiRequest } from './server-api.mjs';

function specPageApiPlugin(): Plugin {
  const middleware = (
    req: Parameters<typeof handleApiRequest>[0],
    res: Parameters<typeof handleApiRequest>[1],
    next: () => void
  ) => {
    void handleApiRequest(req, res).then((handled: boolean) => {
      if (!handled) next();
    });
  };

  return {
    name: 'specpage-api-middleware',
    configureServer(server) {
      server.middlewares.use(middleware);
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware);
    },
  };
}

export default defineConfig({
  plugins: [react(), specPageApiPlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-dom/server'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
