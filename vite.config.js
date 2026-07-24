import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Allows Tailscale Serve (https://<host>.<tailnet>.ts.net) to proxy to this
    // dev server for testing real mic input on a phone over the tailnet.
    allowedHosts: ['ryans-macbook-pro.tail0bfa0d.ts.net'],
  },
});
