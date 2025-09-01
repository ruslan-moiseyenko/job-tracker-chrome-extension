import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        content: "src/content.tsx"
      },
      output: {
        entryFileNames: "content.js",
        // Ensure CSS is inlined into the JS bundle for Shadow DOM injection
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "content.css";
          }
          return "[name].[ext]";
        }
      }
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    // Ensure CSS is processed and can be imported
    cssCodeSplit: false
  }
});
