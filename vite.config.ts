import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // GitHub Pages project site lives at /access-grant-room/. Local/dev keeps relative URLs.
  base: process.env.GITHUB_PAGES === "true" ? "/access-grant-room/" : "./",
  resolve: {
    alias: {
      "@": path.resolve(root, "./src"),
    },
  },
  server: {
    host: "127.0.0.1",
    port: 47391,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 47391,
    strictPort: true,
  },
});
