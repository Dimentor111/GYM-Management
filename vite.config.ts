import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The sql.js WASM binary is imported via `?url` (see src/data/db.ts) and served
// as a static asset; no special config is required in dev or build.
export default defineConfig({
  plugins: [react()],
});
