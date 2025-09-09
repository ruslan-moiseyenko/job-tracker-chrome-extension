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

// Auto-detect environment based on Vite mode
// Vite automatically sets import.meta.env.DEV in development
const isDev = import.meta.env.DEV;

export const ENV: Environment = isDev ? DEVELOPMENT : PRODUCTION;

// Export individual constants for convenience
export const API_ENDPOINT = ENV.API_ENDPOINT;
export const WEB_APP_URL = ENV.WEB_APP_URL;
export const LOGIN_URL = ENV.LOGIN_URL;
export const isDevelopment = ENV.isDevelopment;
