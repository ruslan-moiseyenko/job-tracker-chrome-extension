// Clean Service Worker with lightweight GraphQL client
// No Apollo dependencies - optimized for Chrome Extensions

// Local colors to avoid external imports that cause chunk splitting
const COLORS = {
  SUCCESS: "#10b981", // Green for visible button
  ERROR: "#ef4444" // Red for hidden button
};

import type {
  ExtensionMessage,
  GraphQLMessage,
  AuthMessage,
  CacheInvalidateMessage,
  CacheEntry
} from "../utils/types.js";

// Auth state monitoring service
class AuthStateMonitor {
  static async init() {
    // Monitor cookie changes for reactive auth state
    chrome.cookies.onChanged.addListener(async changeInfo => {
      // Monitor auth-related cookies (adjust cookie names to match your backend)
      const authCookieNames = [
        "auth_token",
        "jwt",
        "session",
        "token",
        "access_token",
        "refresh_token"
      ];

      if (authCookieNames.includes(changeInfo.cookie.name)) {
        const isAuthenticated =
          !changeInfo.removed && changeInfo.cookie.httpOnly;

        // Update auth state in storage
        await chrome.storage.local.set({
          isAuthenticated,
          lastAuthCheck: Date.now()
        });

        // Notify all content scripts of auth state change
        this.notifyAllContentScripts({
          type: changeInfo.removed ? "AUTH_LOGOUT" : "AUTH_LOGIN",
          isAuthenticated
        });

        console.log(
          `🔐 Auth state changed: ${
            isAuthenticated ? "logged in" : "logged out"
          }`
        );
      }
    });
  }

  static async checkAuthStatus() {
    try {
      // Check for auth cookies across your API domains
      const cookies = await chrome.cookies.getAll({
        url: API_ENDPOINT.replace("/graphql", "") // Remove /graphql suffix
      });

      const authCookie = cookies.find(
        c =>
          [
            "auth_token",
            "jwt",
            "session",
            "token",
            "access_token",
            "refresh_token"
          ].includes(c.name) && c.httpOnly
      );

      const isAuthenticated = !!authCookie;

      await chrome.storage.local.set({
        isAuthenticated,
        lastAuthCheck: Date.now()
      });

      return isAuthenticated;
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      return false;
    }
  }

  static async notifyAllContentScripts(message: {
    type: string;
    isAuthenticated?: boolean;
  }) {
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, message).catch(() => {
          // Ignore errors for inactive tabs
        });
      }
    });
  }
}

// Initialize auth monitoring
AuthStateMonitor.init();

// Handle extension icon clicks
chrome.action.onClicked.addListener(async tab => {
  if (!tab.id) return;

  try {
    // Get current button state for this tab
    const storageKey = `showFloatingButton_${tab.id}`;
    const result = await chrome.storage.local.get([storageKey]);
    const currentState = result[storageKey] ?? true; // Default to true if not set
    const newState = !currentState;

    // Update storage
    await chrome.storage.local.set({ [storageKey]: newState });

    // Send message to content script to update the button state
    chrome.tabs
      .sendMessage(tab.id, {
        type: "TOGGLE_FLOATING_BUTTON",
        showButton: newState
      })
      .catch(() => {
        // Ignore errors if content script is not ready
      });

    // Update extension badge to show current state
    chrome.action.setBadgeText({
      text: newState ? "" : "X",
      tabId: tab.id
    });

    chrome.action.setBadgeBackgroundColor({
      color: newState ? COLORS.SUCCESS : COLORS.ERROR,
      tabId: tab.id
    });
  } catch (error) {
    console.error("Failed to toggle floating button:", error);
  }
});

// Service Worker lifecycle management
chrome.runtime.onStartup.addListener(() => {
  console.log("🚀 Service Worker startup");
  AuthStateMonitor.checkAuthStatus();
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("📦 Extension installed/updated");
  AuthStateMonitor.checkAuthStatus();
});

// Update badge when tab is activated to show current button state
chrome.tabs.onActivated.addListener(async activeInfo => {
  try {
    const storageKey = `showFloatingButton_${activeInfo.tabId}`;
    const result = await chrome.storage.local.get([storageKey]);
    const isVisible = result[storageKey] ?? true;

    chrome.action.setBadgeText({
      text: isVisible ? "" : "X",
      tabId: activeInfo.tabId
    });

    chrome.action.setBadgeBackgroundColor({
      color: isVisible ? COLORS.SUCCESS : COLORS.ERROR,
      tabId: activeInfo.tabId
    });
  } catch {
    // Ignore errors
  }
});

// Clean up storage when tabs are closed
chrome.tabs.onRemoved.addListener(async tabId => {
  try {
    const storageKey = `showFloatingButton_${tabId}`;
    await chrome.storage.local.remove(storageKey);
  } catch {
    // Ignore errors
  }
});

// Keep service worker alive during active requests
let activeRequests = 0;

function incrementActiveRequests() {
  activeRequests++;
  console.log(`📈 Active requests: ${activeRequests}`);
}

function decrementActiveRequests() {
  activeRequests = Math.max(0, activeRequests - 1);
  console.log(`📉 Active requests: ${activeRequests}`);
}

// Cache management
const CACHE_PREFIX = "graphql_cache_";

// DEVELOPMENT MODE - Using mock responses instead of real API
// Change this to false and set real endpoints when you have a backend ready
const USE_MOCK_DATA = false;

// TODO: Replace with your real API endpoints
const API_ENDPOINT = "http://localhost:4000/graphql"; // Fixed port typo (was 400, should be 4000)
const AUTH_ENDPOINT = "https://your-api-domain.com/auth";

// Main message handler
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: unknown) => void
  ) => {
    // Security check
    if (!sender.tab) {
      sendResponse({ success: false, error: "Invalid sender" });
      return false;
    }

    switch (message.action) {
      case "graphqlRequest":
        handleGraphQLRequest(message, sendResponse);
        break;

      case "authenticate":
        handleAuthentication(message, sendResponse);
        break;

      case "invalidateCache":
        handleCacheInvalidation(message, sendResponse);
        break;

      default:
        sendResponse({ success: false, error: "Unknown action" });
    }

    return true; // Async response
  }
);

async function handleGraphQLRequest(
  message: GraphQLMessage,
  sendResponse: (response: unknown) => void
) {
  const requestId = message.requestId || generateRequestId();

  // MOCK MODE: Return fake data for development
  if (USE_MOCK_DATA) {
    console.log(`🔧 [${requestId}] MOCK MODE: Simulating GraphQL response`);

    if (message.query.includes("createJobApplication")) {
      // Simulate successful job application creation
      const variables = message.variables as {
        input?: {
          name?: string;
          surname?: string;
          position?: string;
          company?: string;
        };
      };

      const mockData = {
        createJobApplication: {
          id: `mock_${Date.now()}`,
          name: variables?.input?.name || "Test Name",
          surname: variables?.input?.surname || "Test Surname",
          position: variables?.input?.position || "Software Developer",
          company: variables?.input?.company || "Test Company",
          status: "APPLIED",
          createdAt: new Date().toISOString()
        }
      };

      // Simulate network delay
      setTimeout(() => {
        console.log(
          `✅ [${requestId}] Mock job application created:`,
          mockData
        );
        sendResponse({
          success: true,
          data: mockData,
          requestId,
          timestamp: message.timestamp
        });
      }, 500);
      return;
    }

    // For other queries, return empty results
    setTimeout(() => {
      sendResponse({
        success: true,
        data: { jobApplications: [] },
        requestId,
        timestamp: message.timestamp
      });
    }, 300);
    return;
  }

  // Track active requests for service worker lifecycle (only for real API requests)
  if (!USE_MOCK_DATA) {
    incrementActiveRequests();
  }

  try {
    // Check cache first if requested
    if (message.useCache) {
      const cached = await getCachedResponse(message);
      if (cached) {
        console.log(`📋 [${requestId}] Cache hit`);
        sendResponse({
          success: true,
          data: cached,
          requestId,
          timestamp: message.timestamp,
          fromCache: true
        });
        return;
      }
    }

    // Make GraphQL request
    console.log(`📤 [${requestId}] Making GraphQL request to:`, API_ENDPOINT);
    console.log(
      `📤 [${requestId}] Query:`,
      message.query.substring(0, 100) + "..."
    );
    console.log(`📤 [${requestId}] Variables:`, message.variables);

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      credentials: "include", // CRITICAL: sends httpOnly cookies
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        "X-Client": "chrome-extension"
      },
      body: JSON.stringify({
        query: message.query,
        variables: message.variables
      })
    });

    if (!response.ok) {
      console.error(
        `❌ [${requestId}] HTTP Error ${response.status}: ${response.statusText}`
      );
      console.error(`❌ [${requestId}] Response URL: ${response.url}`);

      // Enhanced HTTP error handling based on research
      if (response.status === 400) {
        const responseText = await response.text();
        console.error(`❌ [${requestId}] Bad Request Response:`, responseText);
        throw new Error(`Bad Request (400): ${responseText.substring(0, 200)}`);
      }

      if (response.status === 401) {
        console.log(
          `🔐 [${requestId}] Auth required, attempting token refresh`
        );

        // Check if we still have auth cookies
        const hasAuthCookies = await AuthStateMonitor.checkAuthStatus();
        if (!hasAuthCookies) {
          throw new Error("Authentication required - no valid cookies found");
        }

        // Try token refresh
        const refreshed = await refreshToken();
        if (refreshed) {
          console.log(`🔄 [${requestId}] Token refreshed, retrying request`);
          return handleGraphQLRequest(message, sendResponse);
        } else {
          throw new Error("Authentication failed - unable to refresh token");
        }
      }

      if (response.status === 403) {
        throw new Error("Forbidden - insufficient permissions");
      }

      if (response.status >= 500) {
        throw new Error(
          `Server error (${response.status}) - please try again later`
        );
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    // Cache successful responses
    if (message.useCache && result.data && !result.errors) {
      await setCachedResponse(
        message,
        result.data,
        message.cacheTTL || 5 * 60 * 1000
      );
    }

    console.log(`✅ [${requestId}] GraphQL success`);
    sendResponse({
      success: true,
      data: result.data,
      errors: result.errors,
      requestId,
      timestamp: message.timestamp
    });
  } catch (error) {
    console.error(`❌ [${requestId}] GraphQL error:`, error);

    // Provide more specific error messages
    let errorMessage = "Unknown error";
    if (error instanceof Error) {
      if (error.message.includes("Failed to fetch")) {
        errorMessage =
          `Network error: Cannot connect to ${API_ENDPOINT}. ` +
          `Check if your GraphQL server is running and CORS is configured for Chrome extensions.`;
      } else {
        errorMessage = error.message;
      }
    }

    sendResponse({
      success: false,
      error: errorMessage,
      requestId,
      timestamp: message.timestamp
    });
  } finally {
    // Always decrement active request counter (only for real API requests)
    if (!USE_MOCK_DATA) {
      decrementActiveRequests();
    }
  }
}

// Authentication handler
async function handleAuthentication(
  message: AuthMessage,
  sendResponse: (response: unknown) => void
) {
  const requestId = message.requestId || generateRequestId();

  try {
    console.log(`🔐 [${requestId}] Authentication attempt`);

    const response = await fetch(`${AUTH_ENDPOINT}/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId
      },
      body: JSON.stringify(message.credentials)
    });

    const data = await response.json();

    if (response.ok) {
      // Clear cache on successful auth
      await clearAllCache();
      console.log(`✅ [${requestId}] Authentication success`);

      sendResponse({
        success: true,
        data: data,
        requestId
      });
    } else {
      console.log(`❌ [${requestId}] Authentication failed`);
      sendResponse({
        success: false,
        error: data.message || "Authentication failed",
        requestId
      });
    }
  } catch (error) {
    console.error(`❌ [${requestId}] Auth error:`, error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
      requestId
    });
  }
}

// Cache invalidation handler
async function handleCacheInvalidation(
  message: CacheInvalidateMessage,
  sendResponse: (response: unknown) => void
) {
  try {
    if (message.pattern) {
      await clearCacheByPattern(message.pattern);
    } else {
      await clearAllCache();
    }

    console.log("🗑️ Cache cleared:", message.pattern || "all");
    sendResponse({ success: true });
  } catch (error) {
    console.error("Cache clear error:", error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : "Cache clear failed"
    });
  }
}

// Cache utilities
async function getCachedResponse<T>(
  message: GraphQLMessage
): Promise<T | null> {
  try {
    const cacheKey = getCacheKey(message);
    const result = await chrome.storage.local.get(cacheKey);
    const cached = result[cacheKey] as CacheEntry<T> | undefined;

    if (cached && Date.now() < cached.timestamp + cached.ttl) {
      return cached.data;
    }

    // Remove expired cache
    if (cached) {
      await chrome.storage.local.remove(cacheKey);
    }

    return null;
  } catch (error) {
    console.warn("Cache read error:", error);
    return null;
  }
}

async function setCachedResponse<T>(
  message: GraphQLMessage,
  data: T,
  ttl: number
): Promise<void> {
  try {
    const cacheKey = getCacheKey(message);
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    await chrome.storage.local.set({ [cacheKey]: cacheEntry });
  } catch (error) {
    console.warn("Cache write error:", error);
  }
}

function getCacheKey(message: GraphQLMessage): string {
  const key = JSON.stringify({
    query: message.query,
    variables: message.variables
  });
  return `${CACHE_PREFIX}${hashCode(key)}`;
}

async function clearCacheByPattern(pattern: string): Promise<void> {
  const items = await chrome.storage.local.get();
  const keysToRemove = Object.keys(items).filter(
    key => key.startsWith(CACHE_PREFIX) && key.includes(pattern)
  );

  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
  }
}

async function clearAllCache(): Promise<void> {
  const items = await chrome.storage.local.get();
  const keysToRemove = Object.keys(items).filter(key =>
    key.startsWith(CACHE_PREFIX)
  );

  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
  }
}

// Token refresh
async function refreshToken(): Promise<boolean> {
  try {
    const response = await fetch(`${AUTH_ENDPOINT}/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });

    return response.ok;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

// Utilities
function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString();
}

// Service Worker lifecycle
self.addEventListener("install", () => {
  console.log("🚀 Service Worker installing...");
  // @ts-expect-error - Service Worker API not fully typed
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  console.log("✅ Service Worker activated");
  // @ts-expect-error - Service Worker API not fully typed
  event.waitUntil(self.clients.claim());
});

// Periodic cache cleanup
setInterval(async () => {
  try {
    const items = await chrome.storage.local.get();
    const now = Date.now();
    const keysToRemove: string[] = [];

    Object.entries(items).forEach(([key, value]) => {
      if (
        key.startsWith(CACHE_PREFIX) &&
        typeof value === "object" &&
        value !== null
      ) {
        const cacheEntry = value as CacheEntry;
        if (now > cacheEntry.timestamp + cacheEntry.ttl) {
          keysToRemove.push(key);
        }
      }
    });

    if (keysToRemove.length > 0) {
      await chrome.storage.local.remove(keysToRemove);
      console.log(`🧹 Cleaned ${keysToRemove.length} expired cache entries`);
    }
  } catch (error) {
    console.error("Cache cleanup error:", error);
  }
}, 10 * 60 * 1000); // Every 10 minutes

console.log("🎯 Lightweight GraphQL Service Worker ready!");
