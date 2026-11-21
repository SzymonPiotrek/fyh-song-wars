import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: './client',
  server: {
    port: 3000,
    open: true
  },
  resolve: {
    alias: {
      shared: path.resolve(__dirname, 'shared/types'),
      '@': path.resolve(__dirname, 'client/src')
    }
  }
});
