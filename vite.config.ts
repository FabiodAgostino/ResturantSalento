import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// vite.config.ts per GitHub Pages
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  base: "/TripPaste/", // Nome del tuo repository su GitHub
  build: {
    outDir: path.resolve(__dirname, "docs"),
    emptyOutDir: true,
  },
  // Configurazione per supportare Firebase nel browser
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/firestore']
  }
});