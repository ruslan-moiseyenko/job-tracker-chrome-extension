// Environment configuration for Chrome Extension
// This file contains all environment-specific constants

export interface Environment {
  API_ENDPOINT: string;
  WEB_APP_URL: string;
  LOGIN_URL: string;
  isDevelopment: boolean;
}

// Development environment
const DEVELOPMENT: Environment = {
  API_ENDPOINT: "http://localhost:4000/graphql",
  WEB_APP_URL: "http://localhost:3000",
  LOGIN_URL: "http://localhost:3000/login",
  isDevelopment: true
};

// Production environment
const PRODUCTION: Environment = {
  API_ENDPOINT: "https://your-api-domain.com/graphql",
  WEB_APP_URL: "https://your-web-app.com",
  LOGIN_URL: "https://your-web-app.com/login",
  isDevelopment: false
};

// Auto-detect environment based on manifest
// In development, extension ID changes frequently
// In production, you'll have a stable extension ID
const isProduction = chrome.runtime.id === "your-production-extension-id-here";

export const ENV: Environment = isProduction ? PRODUCTION : DEVELOPMENT;

// Export individual constants for convenience
export const { API_ENDPOINT, WEB_APP_URL, LOGIN_URL, isDevelopment } = ENV;
