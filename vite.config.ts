import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react({
      jsxImportSource: "@emotion/react",
      babel: {
        plugins: ["@emotion/babel-plugin"]
      }
    })
  ],
  define: {
    // Define build-time constants that will be replaced during build
    __DEV__: JSON.stringify(mode === "development"),
    __API_ENDPOINT__: JSON.stringify(
      mode === "production"
        ? "https://your-api-domain.com/graphql"
        : "http://localhost:4000/graphql"
    ),
    __LOGIN_URL__: JSON.stringify(
      mode === "production"
        ? "https://your-web-app.com/login"
        : "http://localhost:3000/login"
    )
  },
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
}));
