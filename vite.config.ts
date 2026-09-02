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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules/react-dom")) return "react-dom";
          if (id.includes("node_modules/react")) return "react";
          if (id.includes("node_modules/@radix-ui")) return "radix";
          if (id.includes("node_modules/lucide-react")) return "lucide";
          if (id.includes("/src/engine/")) return "engine";
        },
      },
    },
  },
});
