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
    sourcemap: true,
    cssCodeSplit: false
  }
});
