import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // Same host as API — Express serves these outside `/api` (see `app.js`).
      "/image": { target: "http://localhost:3000", changeOrigin: true },
      "/pdf": { target: "http://localhost:3000", changeOrigin: true },
      "/video": { target: "http://localhost:3000", changeOrigin: true },
      "/audio": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
