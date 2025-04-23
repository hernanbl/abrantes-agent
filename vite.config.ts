import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Configuración para deshabilitar eval y hacerlo compatible con CSP
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        passes: 1
      }
    },
    rollupOptions: {
      output: {
        format: 'es'
      }
    },
    // Deshabilitar code-splitting para mejorar compatibilidad CSP
    cssCodeSplit: false
  },
  // Configuración específica para desarrollo
  optimizeDeps: {
    esbuildOptions: {
      minify: false
    }
  },
  // Configuración explícita para manejo de módulos JavaScript
  esbuild: {
    // Deshabilitar minificación que podría usar eval
    minify: false,
    // Forzar a usar funciones normales en lugar de construcciones que podrían usar eval
    target: 'es2020'
  }
}));
