import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"]
      }
    })
  ],
  build: {
    rollupOptions: {
      input: {
        content: "src/content.tsx",
        background: "src/background/service-worker.ts"
      },
      output: {
        entryFileNames: chunkInfo => {
          if (chunkInfo.name === "background") {
            return "background.js";
          }
          return "content.js";
        },
        // Ensure CSS is inlined into the JS bundle for Shadow DOM injection
        assetFileNames: assetInfo => {
          if (assetInfo.names?.[0]?.endsWith(".css")) {
            return "content.css";
          }
          return "[name].[ext]";
        }
      }
    },
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: true, // Enable sourcemaps for better debugging
    // Ensure CSS is processed and can be imported
    cssCodeSplit: false
  }
});
