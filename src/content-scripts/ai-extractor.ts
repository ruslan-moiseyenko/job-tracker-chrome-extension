/* eslint-disable @typescript-eslint/no-explicit-any */
// Content script to inject AI job extraction capabilities
// This script runs in the content world to access AI APIs

import type { ExtractedPageContent } from "../utils/content-extractor";
import { extractPageContent } from "../utils/content-extractor";
import type { ExtractedJobData } from "../utils/types";
import {
  AI_CONFIG,
  AvailabilityCache,
  Debouncer,
  createDebugLogger,
  isDevelopment,
  optimizeContent,
  parseAIResponse,
  validateAndCleanJobData
} from "../utils/ai-utils";

// Message types for communication
interface AIExtractionResponse {
  type: "JOB_DATA_EXTRACTED";
  success: boolean;
  data?: any;
  error?: string;
}

// Global AI types (Chrome built-in APIs) - Updated to match official API
declare global {
  interface Window {
    ai?: {
      languageModel?: {
        availability: () => Promise<
          "unavailable" | "downloadable" | "downloading" | "available"
        >;
        create: (options?: {
          temperature?: number;
          topK?: number;
          language?: string;
          initialPrompts?: Array<{
            role: "system" | "user" | "assistant";
            content: string;
          }>;
          signal?: AbortSignal;
          monitor?: (monitor: {
            addEventListener: (
              event: string,
              callback: (e: any) => void
            ) => void;
          }) => void;
        }) => Promise<any>;
        params: () => Promise<{
          defaultTopK: number;
          maxTopK: number;
          defaultTemperature: number;
          maxTemperature: number;
        }>;
      };
      summarizer?: {
        availability: () => Promise<
          "unavailable" | "downloadable" | "downloading" | "available"
        >;
        create: (options?: {
          type?: "key-points" | "tl;dr" | "teaser" | "headline";
          format?: "plain-text" | "markdown";
          length?: "short" | "medium" | "long";
          language?: string;
          signal?: AbortSignal;
          monitor?: (monitor: {
            addEventListener: (
              event: string,
              callback: (e: any) => void
            ) => void;
          }) => void;
        }) => Promise<any>;
      };
    };
    // Legacy support for older API versions
    LanguageModel?: {
      availability: () => Promise<string>;
      create: (options: any) => Promise<any>;
      params: () => Promise<any>;
    };
    AISummarizer?: {
      availability: () => Promise<string>;
      create: (options: any) => Promise<any>;
    };
    // Extraction cancellation support
    activeExtractionControllers?: Map<string, AbortController>;
  }
}

interface AISession {
  prompt: (text: string, options?: { signal?: AbortSignal }) => Promise<string>;
  promptStreaming?: (
    text: string,
    options?: { signal?: AbortSignal }
  ) => ReadableStream<string>;
  clone?: (options?: { signal?: AbortSignal }) => Promise<AISession>;
  destroy: () => void;
  inputUsage?: number;
  inputQuota?: number;
}

interface DownloadProgressEvent {
  loaded: number;
  total?: number;
}

type AvailabilityStatus =
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

// Simple page-oriented cache interface
interface PageCache {
  content: ExtractedPageContent;
  extractedData?: ExtractedJobData;
}

// Chrome extension storage keys
const CACHE_KEYS = {
  PAGE_CONTENT: "job_tracker_page_content",
  EXTRACTED_DATA: "job_tracker_extracted_data"
} as const;

// URL patterns for job sites that use SPA with job IDs
const SPA_JOB_PATTERNS = [
  // LinkedIn job collections with currentJobId
  {
    pattern: /^https:\/\/[^.]*\.?linkedin\.com\/jobs\/collections\/[^?]*/,
    jobIdParam: "currentJobId"
  },
  // LinkedIn job search with currentJobId
  {
    pattern: /^https:\/\/[^.]*\.?linkedin\.com\/jobs\/search/,
    jobIdParam: "currentJobId"
  },
  // Indeed job view with vjk parameter
  {
    pattern: /^https:\/\/[^.]*\.?indeed\.[^/]+\/viewjob/,
    jobIdParam: "jk"
  },
  // Glassdoor job listings
  {
    pattern: /^https:\/\/[^.]*\.?glassdoor\.[^/]+\/job-listing/,
    jobIdParam: "jl"
  }
] as const;

class ContentAIExtractor {
  private promptSession: AISession | null = null;
  private debugLogger = createDebugLogger(isDevelopment());
  private initializationPromise: Promise<void> | null = null;
  private extractionInProgress: Map<string, Promise<ExtractedJobData>> =
    new Map();
  private availabilityCache = new AvailabilityCache();
  private debouncer = new Debouncer();
  private isInitialized = false;
  private pageContentCache: ExtractedPageContent | null = null;
  private preWarmingPromise: Promise<void> | null = null;

  // Session persistence
  private sessionKeepAliveInterval: number | null = null;
  private lastSessionActivity: number = 0;
  private sessionMaxIdleTime: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Add debug log entry
   */
  private addDebugLog(message: string, data?: unknown): void {
    this.debugLogger.log(message, data);
  }

  /**
   * Get debug logs
   */
  getDebugLogs(): string[] {
    return this.debugLogger.getLogs();
  }

  /**
   * Update session activity timestamp and reset keep-alive
   */
  private updateSessionActivity(): void {
    this.lastSessionActivity = Date.now();
  }

  /**
   * Start session keep-alive mechanism
   */
  private startSessionKeepAlive(): void {
    // Clear existing interval
    if (this.sessionKeepAliveInterval) {
      clearInterval(this.sessionKeepAliveInterval);
    }

    // Check session health every 2 minutes
    this.sessionKeepAliveInterval = window.setInterval(async () => {
      const timeSinceActivity = Date.now() - this.lastSessionActivity;

      // If session has been idle too long, clean it up
      if (timeSinceActivity > this.sessionMaxIdleTime) {
        console.log("🧹 AI Session: Cleaning up idle session");
        await this.cleanupSession();
        return;
      }

      // Test session health
      if (this.promptSession && this.isInitialized) {
        try {
          const healthCheck = Promise.race([
            this.promptSession.prompt("test"),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Keep-alive timeout")), 2000)
            )
          ]);

          await healthCheck;
          console.log("💗 AI Session: Keep-alive check successful");
        } catch (error) {
          console.log(
            "💔 AI Session: Keep-alive failed, will recreate on next use",
            error
          );
          await this.cleanupSession();
        }
      }
    }, 2 * 60 * 1000); // Every 2 minutes
  }

  /**
   * Clean up current session
   */
  private async cleanupSession(): Promise<void> {
    try {
      if (this.promptSession && this.promptSession.destroy) {
        await this.promptSession.destroy();
      }
    } catch (error) {
      console.log("Error during session cleanup:", error);
    }

    this.promptSession = null;
    this.isInitialized = false;
    this.initializationPromise = null;

    if (this.sessionKeepAliveInterval) {
      clearInterval(this.sessionKeepAliveInterval);
      this.sessionKeepAliveInterval = null;
    }
  }

  /**
   * Get current page URL for caching (full URL with all parameters)
   */
  private getCurrentPageUrl(): string {
    return window.location.href;
  }

  /**
   * Get current page URL (full URL with all parameters)
   */
  private getNormalizedPageUrl(): string {
    return window.location.href;
  }

  /**
   * Get current job ID from URL if applicable
   */
  private getCurrentJobId(): string | null {
    const currentUrl = window.location.href;

    for (const spaPattern of SPA_JOB_PATTERNS) {
      if (spaPattern.pattern.test(currentUrl)) {
        try {
          const url = new URL(currentUrl);
          const jobId = url.searchParams.get(spaPattern.jobIdParam);
          if (jobId) {
            console.log(
              `🎯 AI Cache: Detected job ID '${jobId}' from ${spaPattern.jobIdParam} parameter`
            );
            return jobId;
          }
        } catch (error) {
          console.warn("Failed to extract job ID:", error);
        }
      }
    }

    return null;
  }

  /**
   * Generate cache key for job-specific extraction
   */
  private getJobExtractionCacheKey(): string {
    const jobId = this.getCurrentJobId();
    const normalizedUrl = this.getNormalizedPageUrl();

    if (jobId) {
      // For SPA sites: base_url + job_id
      return `${normalizedUrl}#job_${jobId}`;
    } else {
      // For regular sites: full URL
      return normalizedUrl;
    }
  }

  /**
   * Get cached page content from Chrome extension storage
   */
  private async getCachedPageContent(): Promise<ExtractedPageContent | null> {
    try {
      // Check if chrome.storage is available (content script context check)
      if (typeof chrome === "undefined" || !chrome.storage) {
        console.log(
          "📋 AI Cache: Chrome storage not available in current context, skipping cache"
        );
        return null;
      }

      const result = await chrome.storage.session.get(CACHE_KEYS.PAGE_CONTENT);
      const cached = result[CACHE_KEYS.PAGE_CONTENT];

      if (!cached) return null;

      const pageCache: PageCache = cached;

      // Verify it's for the current normalized URL (for SPA compatibility)
      const currentNormalizedUrl = this.getNormalizedPageUrl();
      const cachedNormalizedUrl = this.normalizeUrlForComparison(
        pageCache.content.url
      );

      if (cachedNormalizedUrl !== currentNormalizedUrl) {
        await this.clearPageCache();
        return null;
      }

      console.log(
        "📋 AI Cache: Using cached page content from extension storage"
      );
      return pageCache.content;
    } catch (error) {
      console.warn("Failed to load cached page content:", error);
      // Don't try to clear cache if storage access failed
      return null;
    }
  }

  /**
   * Cache page content in Chrome extension storage
   */
  private async cachePageContent(content: ExtractedPageContent): Promise<void> {
    try {
      // Check if chrome.storage is available (content script context check)
      if (typeof chrome === "undefined" || !chrome.storage) {
        console.log(
          "💾 AI Cache: Chrome storage not available in current context, skipping cache"
        );
        return;
      }

      // Store with normalized URL for SPA compatibility
      const normalizedContent = {
        ...content,
        url: this.getNormalizedPageUrl() // Store normalized URL for cache key
      };

      const pageCache: PageCache = { content: normalizedContent };
      await chrome.storage.session.set({
        [CACHE_KEYS.PAGE_CONTENT]: pageCache
      });

      const jobId = this.getCurrentJobId();
      if (jobId) {
        console.log(
          `💾 AI Cache: Cached page content (normalized) for SPA with job ID '${jobId}'`
        );
      } else {
        console.log("💾 AI Cache: Cached page content to extension storage");
      }
    } catch (error) {
      console.warn("Failed to cache page content:", error);
    }
  }

  /**
   * Get cached extracted data from Chrome extension storage
   */
  private async getCachedExtraction(): Promise<ExtractedJobData | null> {
    try {
      // Check if chrome.storage is available (content script context check)
      if (typeof chrome === "undefined" || !chrome.storage) {
        console.log(
          "🚀 AI Cache: Chrome storage not available in current context, skipping cache"
        );
        return null;
      }

      const result = await chrome.storage.session.get(
        CACHE_KEYS.EXTRACTED_DATA
      );
      const cached = result[CACHE_KEYS.EXTRACTED_DATA];

      if (!cached) return null;

      // Verify it's for the current job extraction key
      const currentCacheKey = this.getJobExtractionCacheKey();

      if (cached.cacheKey !== currentCacheKey) {
        await this.clearExtractionCache();
        return null;
      }

      console.log(
        "🚀 AI Cache: Using cached extraction from extension storage"
      );
      return cached.extractedData;
    } catch (error) {
      console.warn("Failed to load cached extraction:", error);
      // Don't try to clear cache if storage access failed
      return null;
    }
  }

  /**
   * Cache extracted data in Chrome extension storage
   */
  private async cacheExtraction(data: ExtractedJobData): Promise<void> {
    try {
      // Check if chrome.storage is available (content script context check)
      if (typeof chrome === "undefined" || !chrome.storage) {
        console.log(
          "💾 AI Cache: Chrome storage not available in current context, skipping cache"
        );
        return;
      }

      const cacheKey = this.getJobExtractionCacheKey();
      const cacheData = {
        cacheKey,
        url: this.getCurrentPageUrl(), // Keep original URL for reference
        extractedData: data
      };
      await chrome.storage.session.set({
        [CACHE_KEYS.EXTRACTED_DATA]: cacheData
      });

      const jobId = this.getCurrentJobId();
      if (jobId) {
        console.log(
          `💾 AI Cache: Cached extraction for job ID '${jobId}' to extension storage`
        );
      } else {
        console.log("💾 AI Cache: Cached extraction to extension storage");
      }
    } catch (error) {
      console.warn("Failed to cache extraction:", error);
    }
  }

  /**
   * Clear page content cache
   */
  private async clearPageCache(): Promise<void> {
    try {
      // Check if chrome.storage is available (content script context check)
      if (typeof chrome === "undefined" || !chrome.storage) {
        console.log(
          "🧹 AI Cache: Chrome storage not available in current context, skipping cache clear"
        );
        return;
      }

      await chrome.storage.session.remove(CACHE_KEYS.PAGE_CONTENT);
    } catch (error) {
      console.warn("Failed to clear page cache:", error);
    }
  }

  /**
   * Clear extraction cache
   */
  private async clearExtractionCache(): Promise<void> {
    try {
      // Check if chrome.storage is available (content script context check)
      if (typeof chrome === "undefined" || !chrome.storage) {
        console.log(
          "🧹 AI Cache: Chrome storage not available in current context, skipping cache clear"
        );
        return;
      }

      await chrome.storage.session.remove(CACHE_KEYS.EXTRACTED_DATA);
    } catch (error) {
      console.warn("Failed to clear extraction cache:", error);
    }
  }

  /**
   * Clear all caches for current page
   */
  private async clearAllCaches(): Promise<void> {
    await Promise.all([this.clearPageCache(), this.clearExtractionCache()]);
  }

  /**
   * Pre-warm AI session in background (call this on page load)
   */
  async preWarmSession(): Promise<void> {
    // If already initialized or pre-warming in progress, return
    if (this.isInitialized || this.preWarmingPromise) {
      console.log("🔥 AI Pre-warming: Already initialized or in progress");
      return;
    }

    const preWarmStartTime = performance.now();
    console.log(
      "🔥 AI Pre-warming: Starting background session initialization..."
    );

    this.preWarmingPromise = this._preWarmSession();

    try {
      await this.preWarmingPromise;
      const preWarmTime = performance.now() - preWarmStartTime;
      console.log(
        `🔥 AI Pre-warming: Completed in ${preWarmTime.toFixed(1)}ms`
      );
    } catch (error) {
      const preWarmTime = performance.now() - preWarmStartTime;
      console.log(
        `🔥 AI Pre-warming: Failed after ${preWarmTime.toFixed(1)}ms:`,
        error
      );
    } finally {
      this.preWarmingPromise = null;
    }
  }

  /**
   * Internal pre-warming method
   */
  private async _preWarmSession(): Promise<void> {
    try {
      // Check availability first (fast operation)
      const availability = await this.checkAvailability();

      if (!availability.available) {
        console.log("� AI Extractor: AI not available, skipping pre-warming");
        return;
      }

      // Only initialize session if available (not downloading)
      if (availability.status === "available") {
        console.log("🔥 AI Extractor: Pre-warming session in background...");
        await this.initializeSessions();
        console.log("🔥 AI Extractor: Session pre-warmed successfully!");
      } else {
        console.log(
          `🔥 AI Extractor: Model ${availability.status}, will initialize on demand`
        );
      }
    } catch (error) {
      console.log("🔥 AI Extractor: Pre-warming failed (non-critical):", error);
    }
  }

  /**
   * Initialize LanguageModel session with true persistence
   */
  async initializeSessions(): Promise<void> {
    // Check if existing session is still valid
    if (this.isInitialized && this.promptSession) {
      try {
        // Test session health with a simple prompt - but use a timeout
        const healthCheck = Promise.race([
          this.promptSession.prompt("test"),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Health check timeout")), 1000)
          )
        ]);

        await healthCheck;
        console.log("⚡ AI Extractor: Existing session is healthy, reusing...");
        this.updateSessionActivity();
        return;
      } catch (error) {
        console.log(
          "🔄 AI Extractor: Existing session unhealthy, recreating...",
          error
        );
        await this.cleanupSession();
      }
    }

    // Return existing initialization promise if already in progress
    if (this.initializationPromise) {
      console.log(
        "🔄 AI Extractor: Initialization already in progress, waiting..."
      );
      return this.initializationPromise;
    }

    // Create new initialization promise
    this.initializationPromise = this._initializeSessions();
    return this.initializationPromise;
  }

  /**
   * Internal initialization method
   */
  private async _initializeSessions(): Promise<void> {
    const initStartTime = performance.now();
    console.log(
      "🔄 AI Extractor: Starting LanguageModel session initialization"
    );
    this.addDebugLog("🔄 Starting LanguageModel session initialization");

    try {
      console.log("🔍 AI Extractor: Checking available APIs");
      console.log(
        "🔍 AI Extractor: window.ai?.languageModel:",
        !!window.ai?.languageModel
      );
      console.log(
        "🔍 AI Extractor: window.LanguageModel:",
        !!window.LanguageModel
      );

      const apiCheckTime = performance.now();
      console.log(
        `⏱️ Init Timing: API check took ${(
          apiCheckTime - initStartTime
        ).toFixed(1)}ms`
      );

      // Check for new API first (Chrome 138+)
      if (window.ai?.languageModel) {
        console.log("🆕 AI Extractor: Using new LanguageModel API");
        console.log(
          `🔄 AI Debug: Session exists: ${!!this
            .promptSession} (reusing if available)`
        );

        const newApiStartTime = performance.now();
        await this.initializeLanguageModelNew();
        const newApiEndTime = performance.now();
        console.log(
          `⏱️ Init Timing: New API initialization took ${(
            newApiEndTime - newApiStartTime
          ).toFixed(1)}ms`
        );
      }
      // Fallback to legacy API
      else if (window.LanguageModel) {
        console.log("🔄 AI Extractor: Using legacy LanguageModel API");
        console.log(
          `🔄 AI Debug: Session exists: ${!!this
            .promptSession} (reusing if available)`
        );

        const legacyApiStartTime = performance.now();
        await this.initializeLanguageModelLegacy();
        const legacyApiEndTime = performance.now();
        console.log(
          `⏱️ Init Timing: Legacy API initialization took ${(
            legacyApiEndTime - legacyApiStartTime
          ).toFixed(1)}ms`
        );
      } else {
        console.error(
          "❌ AI Extractor: No LanguageModel API found - AI extraction not available"
        );
        this.addDebugLog(
          "❌ No LanguageModel API found - AI extraction not available"
        );
      }

      console.log(
        "✅ AI Extractor: Session initialization completed. promptSession:",
        !!this.promptSession
      );

      // Mark as initialized if we have a session
      if (this.promptSession) {
        this.isInitialized = true;
        this.updateSessionActivity();
        this.startSessionKeepAlive();
      }
    } catch (error) {
      console.error("💥 AI Extractor: Session initialization failed", error);
      this.addDebugLog("💥 Session initialization failed", error);
    } finally {
      // Clear the promise when done
      this.initializationPromise = null;
    }
  }

  /**
   * Initialize new Language Model API (Chrome 138+)
   */
  private async initializeLanguageModelNew(): Promise<void> {
    this.addDebugLog(
      "🆕 Trying new LanguageModel API (window.ai.languageModel)"
    );

    if (!window.ai?.languageModel) {
      throw new Error("LanguageModel API not available");
    }

    const availability = await window.ai.languageModel.availability();
    this.addDebugLog(`📊 LanguageModel availability: ${availability}`);

    switch (availability) {
      case "unavailable":
        this.addDebugLog(
          "🚫 LanguageModel: Not supported on this device/browser"
        );
        break;

      case "downloadable":
        this.addDebugLog("⬇️ LanguageModel: Model needs to be downloaded");
        this.addDebugLog("🔄 Triggering model download...");
        await this.createLanguageModelWithDownloadTracking();
        break;

      case "downloading": {
        this.addDebugLog("📥 LanguageModel: Model is currently downloading");
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 2000));
        const newStatus = await window.ai.languageModel.availability();
        this.addDebugLog(
          `📊 LanguageModel availability after wait: ${newStatus}`
        );

        if (newStatus === "available") {
          await this.createLanguageModelSession();
        } else {
          this.addDebugLog(
            "⏱️ LanguageModel: Still downloading, will retry later"
          );
        }
        break;
      }

      case "available":
        this.addDebugLog("✅ LanguageModel: Ready to use");
        await this.createLanguageModelSession();
        break;
    }
  }

  /**
   * Create Language Model session with download progress tracking
   */
  private async createLanguageModelWithDownloadTracking(): Promise<void> {
    if (!window.ai?.languageModel) {
      throw new Error("LanguageModel API not available");
    }

    try {
      this.addDebugLog(
        "🎯 Creating LanguageModel session with download monitoring"
      );

      const session = await window.ai.languageModel.create({
        language: "en",
        monitor: monitor => {
          monitor.addEventListener(
            "downloadprogress",
            (e: DownloadProgressEvent) => {
              const percentage = Math.round(e.loaded * 100);
              this.addDebugLog(`📊 Download progress: ${percentage}%`, {
                loaded: e.loaded,
                total: e.total
              });
            }
          );
        }
      });

      this.promptSession = session as AISession;
      this.addDebugLog("✅ LanguageModel session created successfully");
    } catch (error) {
      this.addDebugLog("❌ Failed to create LanguageModel session", error);
    }
  }

  /**
   * Create Language Model session (no download needed)
   */
  private async createLanguageModelSession(): Promise<void> {
    if (!window.ai?.languageModel) {
      throw new Error("LanguageModel API not available");
    }

    try {
      // Get model parameters first
      const params = await window.ai.languageModel.params();
      this.addDebugLog("📋 LanguageModel parameters", params);

      const session = await window.ai.languageModel.create({
        language: "en",
        // Lower temperature for more focused responses
        temperature: Math.min(
          params.defaultTemperature * 0.8,
          params.maxTemperature
        ),
        topK: params.defaultTopK
      });

      this.promptSession = session as AISession;
      this.addDebugLog(
        "✅ LanguageModel session created with custom parameters"
      );
    } catch (error) {
      this.addDebugLog("❌ Failed to create LanguageModel session", error);
    }
  }

  /**
   * Initialize legacy Language Model API
   */
  private async initializeLanguageModelLegacy(): Promise<void> {
    this.addDebugLog(
      "🔄 Trying legacy LanguageModel API (window.LanguageModel)"
    );

    if (!window.LanguageModel) return;

    const availability = await window.LanguageModel.availability();
    this.addDebugLog(`📊 Legacy LanguageModel availability: ${availability}`);

    if (availability === "available") {
      try {
        this.promptSession = (await window.LanguageModel.create({
          temperature: 0,
          topK: 1.0,
          language: "en"
        })) as AISession;
        this.addDebugLog("✅ Legacy LanguageModel session created");
      } catch (error) {
        this.addDebugLog(
          "❌ Failed to create legacy LanguageModel session",
          error
        );
      }
    }
  }

  /**
   * Get cached page content or extract fresh content
   */
  async getPageContent(): Promise<ExtractedPageContent> {
    const currentUrl = this.getCurrentPageUrl();

    // Check extension storage cache first
    const cachedContent = await this.getCachedPageContent();
    if (cachedContent) {
      this.pageContentCache = cachedContent;
      return cachedContent;
    }

    // Check memory cache as fallback
    if (this.pageContentCache && this.pageContentCache.url === currentUrl) {
      console.log("📋 AI Extractor: Using memory cached page content");
      return this.pageContentCache;
    }

    // Extract fresh content
    console.log("📄 AI Extractor: Extracting fresh page content");
    const extractStartTime = performance.now();
    const content = extractPageContent();
    const extractTime = performance.now() - extractStartTime;

    console.log(
      `⏱️ AI Content: Fresh extraction took ${extractTime.toFixed(1)}ms`
    );
    console.log(
      `📊 AI Content: Extracted ${content.content.length} characters`
    );

    // Store in both memory and extension storage
    this.pageContentCache = content;
    await this.cachePageContent(content);

    return content;
  }

  /**
   * Get URL for comparison (returns full URL)
   */
  private normalizeUrlForComparison(url: string): string {
    return url;
  }

  /**
   * Quick extraction using cached content (for repeated calls)
   */
  async extractJobDataQuick(
    options: { force?: boolean; source?: string; signal?: AbortSignal } = {},
    onFieldExtracted?: (fieldName: string, data: string) => void
  ): Promise<ExtractedJobData> {
    const methodStartTime = performance.now();
    console.log(
      "⚡ AI Quick: Starting quick extraction with cached content",
      options
    );

    const pageContent = await this.getPageContent();
    const result = await this.extractJobData(
      pageContent,
      options,
      onFieldExtracted
    );

    const totalMethodTime = performance.now() - methodStartTime;
    console.log(`⚡ AI Quick: Completed in ${totalMethodTime.toFixed(1)}ms`);

    return result;
  }

  /**
   * Check if extraction should be performed (prevents duplicates)
   */
  shouldPerformExtraction(
    options: { force?: boolean; source?: string } = {}
  ): boolean {
    const currentUrl = window.location.href;
    const state = window.extractionState;

    console.log(
      `🔍 AI Debug: shouldPerformExtraction called with options:`,
      options
    );

    // Initialize state if not exists
    if (!state) {
      window.extractionState = {
        isExtracting: false,
        lastExtractionUrl: currentUrl,
        lastExtractionTime: 0,
        extractionCount: 0
      };
      console.log(`🔍 AI Debug: Initialized extraction state`);
      return true;
    }

    // Always allow if forced (e.g., user explicitly triggers extraction)
    if (options.force) {
      console.log(
        `🔄 AI Extractor: Forced extraction allowed (${
          options.source || "unknown"
        })`
      );
      return true;
    }

    // Don't extract if already extracting
    if (state.isExtracting) {
      console.log("🚫 AI Extractor: Extraction already in progress, skipping");
      console.log("🔍 AI Debug: Current extraction state:", {
        isExtracting: state.isExtracting,
        lastUrl: state.lastExtractionUrl,
        lastTime: new Date(state.lastExtractionTime).toISOString(),
        count: state.extractionCount
      });
      return false;
    }

    // For same URL, allow extraction after 10 seconds (relaxed from 5)
    if (
      state.lastExtractionUrl === currentUrl &&
      Date.now() - state.lastExtractionTime < 10000
    ) {
      console.log("🚫 AI Extractor: Recent extraction for this URL, skipping");
      return false;
    }

    // For different URLs, allow immediately
    if (state.lastExtractionUrl !== currentUrl) {
      console.log("🔄 AI Extractor: Different URL, allowing extraction");
      return true;
    }

    // Relaxed rate limiting: allow up to 5 extractions in 60 seconds
    if (
      state.extractionCount >= 5 &&
      Date.now() - state.lastExtractionTime < 60000
    ) {
      console.log(
        "🚫 AI Extractor: Rate limited, too many extractions recently"
      );
      return false;
    }

    return true;
  }

  /**
   * Mark extraction as started
   */
  markExtractionStarted(): void {
    const currentUrl = window.location.href;
    window.extractionState = window.extractionState || {
      isExtracting: false,
      lastExtractionUrl: currentUrl,
      lastExtractionTime: 0,
      extractionCount: 0
    };

    window.extractionState.isExtracting = true;
    window.extractionState.lastExtractionUrl = currentUrl;
    window.extractionState.lastExtractionTime = Date.now();
    window.extractionState.extractionCount++;
  }

  /**
   * Clear caches when navigating to a new page
   */
  async clearCaches(): Promise<void> {
    this.pageContentCache = null;
    this.availabilityCache.clear();
    await this.clearAllCaches(); // Clear extension storage caches
    // Clear extraction state for new page
    window.extractionState = undefined;
    console.log("🧹 AI Extractor: All caches cleared for new page");
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): {
    isInitialized: boolean;
    hasCachedContent: boolean;
    cacheAge?: number;
  } {
    return {
      isInitialized: this.isInitialized,
      hasCachedContent: !!this.pageContentCache,
      cacheAge: this.pageContentCache
        ? Date.now() - (this.pageContentCache as any).timestamp
        : undefined
    };
  }

  /**
   * Mark extraction as completed
   */
  markExtractionCompleted(): void {
    if (window.extractionState) {
      window.extractionState.isExtracting = false;
      console.log("✅ AI Debug: Extraction state marked as completed");
    }

    // Safety timeout to reset extraction state if it gets stuck
    setTimeout(() => {
      if (window.extractionState?.isExtracting) {
        console.warn("⚠️ AI Debug: Extraction state was stuck, resetting");
        window.extractionState.isExtracting = false;
      }
    }, 60000); // 60 second timeout
  }

  /**
   * Extract job data using LanguageModel API with smart caching
   */
  async extractJobData(
    pageContent: ExtractedPageContent,
    options: { force?: boolean; source?: string; signal?: AbortSignal } = {},
    onFieldExtracted?: (fieldName: string, data: string) => void
  ): Promise<ExtractedJobData> {
    const methodStartTime = performance.now();
    const cacheKey = pageContent.url;

    console.log(
      `⏱️ AI Timing: extractJobData called for URL: ${cacheKey.substring(
        0,
        50
      )}... with options:`,
      options
    );

    // Check for cached extraction first (unless forced)
    if (!options.force) {
      const cachedExtraction = await this.getCachedExtraction();
      if (cachedExtraction) {
        // Still call field callbacks if provided
        if (onFieldExtracted) {
          if (
            cachedExtraction.company &&
            cachedExtraction.company !== "unknown"
          ) {
            onFieldExtracted("company", cachedExtraction.company);
          }
          if (
            cachedExtraction.position &&
            cachedExtraction.position !== "unknown"
          ) {
            onFieldExtracted("position", cachedExtraction.position);
          }
          if (
            cachedExtraction.jobDescription &&
            cachedExtraction.jobDescription !== "unknown"
          ) {
            onFieldExtracted("jobDescription", cachedExtraction.jobDescription);
          }
        }

        return cachedExtraction;
      }
    }

    // Check if we should perform extraction (prevents duplicates)
    if (!this.shouldPerformExtraction(options)) {
      // Try to return cached data if available
      const cached = window.preExtractedJobDataCache?.[cacheKey];
      if (cached && cached.url === cacheKey) {
        console.log(
          "📋 AI Extractor: Returning legacy cached data due to extraction limits"
        );
        return cached.data;
      }
      throw new Error("Extraction blocked by rate limiting");
    }

    // Mark extraction as started
    this.markExtractionStarted();

    // Cache page content to avoid re-extraction
    this.pageContentCache = pageContent;

    // Create new extraction promise with caching
    const extractionPromise = this._extractJobData(
      pageContent,
      onFieldExtracted,
      options.signal
    ).then(async result => {
      // Cache the successful extraction
      await this.cacheExtraction(result);
      return result;
    });

    this.extractionInProgress.set(cacheKey, extractionPromise);

    // Clean up when done
    extractionPromise.finally(() => {
      this.extractionInProgress.delete(cacheKey);
      const totalMethodTime = performance.now() - methodStartTime;
      console.log(
        `⏱️ AI Timing: extractJobData completed in ${totalMethodTime.toFixed(
          1
        )}ms`
      );
    });

    return extractionPromise;
  }

  /**
   * Create two separate prompts for parallel extraction
   */
  private createExtractionPrompts(
    pageContent: ExtractedPageContent,
    optimizedContent: string
  ): {
    companyAndPosition: string;
    jobDescription: string;
  } {
    const baseContext = `Page: ${pageContent.title}\nURL: ${pageContent.url}\nContent: ${optimizedContent}`;

    return {
      companyAndPosition: `Extract the hiring company name and job title/position from this job posting.
      Fully copy and preserve the exact text as it appears on the page,
      case-sensitive, don't add anything, do not change anything, do not rewrite, do not summarize, do not add anything.
      IMPORTANT: Do not take data from metadata, only from the visible page content, inside <body>.

Return a JSON object with two fields: "company" and "position" accordingly.
If no company is found, use "unknown" for company.
If no position is found, use "unknown" for position.

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or extra text. Just the raw JSON object.

${baseContext}

Return ONLY valid JSON:`,
      jobDescription: `EXTRACT the complete job description from the page content below.

TASK: Find and COPY the job description text exactly as it appears on the page.

WHAT TO EXTRACT:
- Job responsibilities and duties
- Required skills and qualifications
- Preferred skills and experience
- Technologies, tools, programming languages mentioned
- Company benefits and perks
- Work conditions
- Project descriptions
- Team information
- Any other job-related information

INSTRUCTIONS:
1. READ the page content carefully
2. IDENTIFY all text that describes the job, requirements, benefits, etc.
3. COPY that text exactly - do NOT rewrite, summarize, or change anything
4. PRESERVE the original formatting, line breaks, and structure
5. INCLUDE everything related to the job - be comprehensive, not selective

IMPORTANT RULES:
- DO NOT rewrite or rephrase anything
- DO NOT summarize or shorten the content
- DO NOT add your own interpretation
- COPY the exact text from the page content
- PRESERVE original formatting and structure
- INCLUDE ALL job-related details you find

Return a JSON object with field "jobDescription" containing the extracted job description text.
If no job description is found, return "unknown".

IMPORTANT: Return ONLY valid JSON without any markdown formatting, code blocks, or extra text. Just the raw JSON object.

${baseContext}

Return ONLY valid JSON:`
    };
  }

  /**
   * Extract a single field using AI
   */
  private async extractField(
    fieldName: string,
    prompt: string,
    signal?: AbortSignal
  ): Promise<{ data: string; timing: number }> {
    const startTime = performance.now();
    let rawResult = "";

    try {
      console.log(`🔍 AI Debug: Extracting ${fieldName}...`);

      const result = await this.promptSession!.prompt(prompt, { signal });
      rawResult = result; // Store for fallback use
      const endTime = performance.now();
      const timing = endTime - startTime;

      console.log(
        `✅ AI Debug: ${fieldName} extracted in ${timing.toFixed(1)}ms`
      );

      console.log(
        `🔧 AI Debug: Raw ${fieldName} response:`,
        result.substring(0, 200) + "..."
      );

      // Special logging for CSS selector responses
      if (fieldName === "descriptionSelector") {
        console.log(`🎯 AI CSS Selector: Full raw response from AI:`, result);
      }

      // For the new 2-prompt approach, we return the raw result and let the caller parse it
      // This is because we now have complex responses that contain multiple fields

      // Update session activity on successful extraction
      this.updateSessionActivity();

      return {
        data: result, // Return the raw result for caller to parse
        timing
      };
    } catch (error) {
      // Handle AbortError specially
      if (error instanceof Error && error.name === "AbortError") {
        console.log(
          `🛑 AI Debug: ${fieldName} extraction was cancelled (AbortError)`
        );
        // Don't update session activity for cancelled operations
        // Re-throw the AbortError to be handled by the caller
        throw error;
      }

      console.error(`❌ AI Debug: Failed to extract ${fieldName}:`, error);

      // Update session activity even on errors to maintain session health
      this.updateSessionActivity();

      // Try to extract partial data from raw response as fallback
      try {
        console.log(
          `🔧 AI Debug: Attempting fallback extraction for ${fieldName} from raw response`
        );
        const rawText = rawResult.toLowerCase();
        let fallbackValue = "unknown";

        if (fieldName === "company") {
          // Try to extract company from raw text
          const companyPatterns = [
            /company["\s]*:[\s"]*([^",}]+)/i,
            /"([^"]+)"\s*company/i,
            /company[^:]*:([^,}]+)/i
          ];
          for (const pattern of companyPatterns) {
            const match = rawText.match(pattern);
            if (match && match[1]) {
              fallbackValue = match[1].trim().replace(/["']/g, "");
              break;
            }
          }
        } else if (fieldName === "position") {
          // Try to extract position from raw text
          const positionPatterns = [
            /position["\s]*:[\s"]*([^",}]+)/i,
            /"([^"]+)"\s*position/i,
            /position[^:]*:([^,}]+)/i
          ];
          for (const pattern of positionPatterns) {
            const match = rawText.match(pattern);
            if (match && match[1]) {
              fallbackValue = match[1].trim().replace(/["']/g, "");
              break;
            }
          }
        } else if (fieldName === "description") {
          // Try to extract description from raw text
          const descPatterns = [
            /jobdescription["\s]*:[\s"]*([^"}]+)/i,
            /description["\s]*:[\s"]*([^"}]+)/i,
            /"([^"]+)"\s*(?:jobdescription|description)/i
          ];
          for (const pattern of descPatterns) {
            const match = rawText.match(pattern);
            if (match && match[1]) {
              fallbackValue = match[1].trim().replace(/["']/g, "");
              break;
            }
          }
        }

        if (fallbackValue !== "unknown") {
          console.log(
            `🔧 AI Debug: Extracted fallback ${fieldName}: ${fallbackValue}`
          );
        }
      } catch (fallbackError) {
        console.error(
          `❌ AI Debug: Fallback extraction also failed for ${fieldName}:`,
          fallbackError
        );
      }

      return {
        data: "unknown",
        timing: performance.now() - startTime
      };
    }
  }

  /**
   * Internal extraction method - NEW: Parallel 2-prompt extraction with progressive updates
   */
  private async _extractJobData(
    pageContent: ExtractedPageContent,
    onFieldExtracted?: (fieldName: string, data: string) => void,
    signal?: AbortSignal
  ): Promise<ExtractedJobData> {
    const extractionStartTime = performance.now();
    const contentLength = pageContent.content.length;

    console.log(
      "🎯 AI Debug: Starting job data extraction (3-prompt parallel)"
    );
    console.log(`📊 AI Metrics: Content length: ${contentLength} characters`);
    console.log(
      `📊 AI Metrics: Page title: ${pageContent.title.substring(0, 50)}...`
    );

    try {
      // Session initialization timing
      const sessionStartTime = performance.now();
      await this.initializeSessions();
      const sessionEndTime = performance.now();
      const sessionTime = sessionEndTime - sessionStartTime;

      console.log(
        `⏱️ AI Timing: Session initialization took ${sessionTime.toFixed(1)}ms`
      );
      console.log(
        `🔄 AI Debug: Using ${
          this.promptSession ? "PERSISTENT" : "NEW"
        } session`
      );

      // Update session activity for persistence
      this.updateSessionActivity();

      // Content optimization timing
      const optimizeStartTime = performance.now();
      const optimizedContent = optimizeContent(pageContent.content);
      const optimizeEndTime = performance.now();
      const optimizeTime = optimizeEndTime - optimizeStartTime;
      const optimizedLength = optimizedContent.length;

      console.log(
        `⏱️ AI Timing: Content optimization took ${optimizeTime.toFixed(1)}ms`
      );
      console.log(
        `📊 AI Metrics: Optimized content: ${contentLength} → ${optimizedLength} chars`
      );
      console.log(
        `📊 AI Metrics: Content retained: ${(
          (optimizedLength / contentLength) *
          100
        ).toFixed(1)}%`
      );

      if (!this.promptSession) {
        console.error("❌ AI Extractor: No LanguageModel session available");
        this.addDebugLog("❌ No LanguageModel session available");
        this.markExtractionCompleted();
        throw new Error("LanguageModel API not available");
      }

      // Create two separate prompts for parallel extraction
      const prompts = this.createExtractionPrompts(
        pageContent,
        optimizedContent
      );

      console.log(
        "🚀 AI Debug: Starting parallel extraction of 2 fields (company+position and job description content)"
      );

      // Run both prompts in parallel with individual callback handling
      const parallelStartTime = performance.now();

      // Flag to prevent duplicate callbacks after completion
      let extractionCompleted = false;

      // Create promises for each field extraction
      const companyAndPositionPromise = this.extractField(
        "companyAndPosition",
        prompts.companyAndPosition,
        signal
      );
      const jobDescriptionPromise = this.extractField(
        "jobDescription",
        prompts.jobDescription,
        signal
      );

      // Handle each promise individually to call callbacks progressively
      const results = await Promise.allSettled([
        companyAndPositionPromise.then(result => {
          if (
            onFieldExtracted &&
            result.data !== "unknown" &&
            !extractionCompleted
          ) {
            try {
              // Parse the combined company and position data using parseAIResponse
              const parsedData = parseAIResponse(result.data);
              if (parsedData.company && parsedData.company !== "unknown") {
                console.log(
                  "🚀 AI Debug: Calling progressive callback for company"
                );
                onFieldExtracted("company", parsedData.company);
              }
              if (parsedData.position && parsedData.position !== "unknown") {
                console.log(
                  "🚀 AI Debug: Calling progressive callback for position"
                );
                onFieldExtracted("position", parsedData.position);
              }
            } catch (error) {
              console.error(
                "❌ AI Debug: Failed to parse company and position data:",
                error
              );
            }
          }
          return result;
        }),
        jobDescriptionPromise.then(result => {
          // Parse and callback for job description when it completes
          if (
            onFieldExtracted &&
            result.data !== "unknown" &&
            !extractionCompleted
          ) {
            try {
              const parsedJobData = parseAIResponse(result.data);
              const jobDescriptionText =
                parsedJobData.jobDescription || "unknown";
              if (jobDescriptionText !== "unknown") {
                console.log(
                  "🚀 AI Debug: Calling progressive callback for jobDescription"
                );
                onFieldExtracted("jobDescription", jobDescriptionText);
              }
            } catch (error) {
              console.error(
                "❌ AI Debug: Failed to parse job description data:",
                error
              );
            }
          }
          return result;
        })
      ]);

      const parallelEndTime = performance.now();
      const parallelTime = parallelEndTime - parallelStartTime;

      console.log(
        `⏱️ AI Timing: Parallel extraction took ${parallelTime.toFixed(1)}ms`
      );

      // Process results - handle both fulfilled and rejected promises
      const companyAndPositionResult =
        results[0].status === "fulfilled"
          ? results[0].value
          : { data: "unknown", timing: 0 };
      const jobDescriptionResult =
        results[1].status === "fulfilled"
          ? results[1].value
          : { data: "unknown", timing: 0 };

      // Check for cancellation and handle failures
      const cancelledFields: string[] = [];
      const failedFields: string[] = [];

      results.forEach((result, index) => {
        const fieldName = ["companyAndPosition", "jobDescription"][index];
        if (result.status === "rejected") {
          const error = result.reason;
          if (error instanceof Error && error.name === "AbortError") {
            cancelledFields.push(fieldName);
            console.log(`🛑 AI Debug: ${fieldName} extraction was cancelled`);
          } else {
            failedFields.push(fieldName);
            console.error(
              `❌ AI Debug: ${fieldName} extraction failed:`,
              error
            );
          }
        }
      });

      // If any field was cancelled, throw AbortError to propagate cancellation
      if (cancelledFields.length > 0) {
        console.log(
          `🛑 AI Debug: Extraction cancelled for fields: ${cancelledFields.join(
            ", "
          )}`
        );
        const abortError = new Error("Extraction was cancelled");
        abortError.name = "AbortError";
        throw abortError;
      }

      // Log failed fields (non-cancellation errors)
      if (failedFields.length > 0) {
        console.warn(
          `⚠️ AI Debug: Some fields failed to extract: ${failedFields.join(
            ", "
          )}`
        );
      }

      console.log(`📊 AI Metrics: Individual field times:`, {
        companyAndPosition: companyAndPositionResult.timing,
        jobDescription: jobDescriptionResult.timing
      });

      // Parse company and position data
      let company = "unknown";
      let position = "unknown";

      try {
        if (companyAndPositionResult.data !== "unknown") {
          const parsedData = parseAIResponse(companyAndPositionResult.data);
          company = parsedData.company || "unknown";
          position = parsedData.position || "unknown";
        }
      } catch (error) {
        console.error(
          "❌ AI Debug: Failed to parse company and position data:",
          error
        );
      }

      // Parse job description directly from AI response
      let jobDescription = "unknown";

      try {
        if (jobDescriptionResult.data !== "unknown") {
          console.log(
            `🤖 AI Job Description Response: Raw data from AI:`,
            jobDescriptionResult.data.substring(0, 400) + "..."
          );

          const parsedJobData = parseAIResponse(jobDescriptionResult.data);
          jobDescription = parsedJobData.jobDescription || "unknown";

          console.log(
            `✅ AI Job Description: Extracted job description (${jobDescription.length} characters)`
          );

          if (jobDescription !== "unknown") {
            // Log the full content to console as requested
            console.log(
              `📋 FULL JOB DESCRIPTION CONTENT (AI EXTRACTED):`,
              jobDescription
            );

            // The callback was already called in the promise handler above,
            // but we can call it again here if it wasn't called yet
            if (
              onFieldExtracted &&
              jobDescription !== "unknown" &&
              !extractionCompleted
            ) {
              console.log(
                "🚀 AI Debug: Calling final callback for jobDescription"
              );
              onFieldExtracted("jobDescription", jobDescription);
            }
          } else {
            console.log(
              `⚠️ AI Job Description: AI returned "unknown" - no job description found`
            );
          }
        } else {
          console.log(
            `⚠️ AI Job Description: AI response was "unknown" - no job description extracted`
          );
        }
      } catch (error) {
        console.error(
          "❌ AI Job Description: Failed to parse job description:",
          error
        );
        console.log(
          `❌ AI Job Description: Raw response that caused error:`,
          jobDescriptionResult.data
        );
      }

      // Combine results
      const combinedData = {
        company,
        position,
        jobDescription
      };

      // Validate and clean the combined data
      const parseStartTime = performance.now();
      const parsedData = validateAndCleanJobData(combinedData);
      const parseEndTime = performance.now();
      const parseTime = parseEndTime - parseStartTime;

      console.log(
        `⏱️ AI Timing: Result validation took ${parseTime.toFixed(1)}ms`
      );

      // Final timing summary
      const totalTime = performance.now() - extractionStartTime;
      const parallelPercentage = ((parallelTime / totalTime) * 100).toFixed(1);
      const preProcessingPercentage = (
        ((sessionTime + optimizeTime) / totalTime) *
        100
      ).toFixed(1);
      const parsingPercentage = ((parseTime / totalTime) * 100).toFixed(1);

      console.log(
        `⏱️ AI Timing: TOTAL extraction time: ${totalTime.toFixed(1)}ms`
      );
      console.log(`📊 AI Timing Breakdown:`);
      console.log(
        `   • Pre-processing: ${(sessionTime + optimizeTime).toFixed(
          1
        )}ms (${preProcessingPercentage}%)`
      );
      console.log(
        `   • Parallel AI Inference: ${parallelTime.toFixed(
          1
        )}ms (${parallelPercentage}%)`
      );
      console.log(
        `   • Result Validation: ${parseTime.toFixed(
          1
        )}ms (${parsingPercentage}%)`
      );

      // Performance analysis
      const successfulExtractions = [
        companyAndPositionResult,
        jobDescriptionResult
      ].filter(result => result.timing > 0).length;

      if (parallelTime > 15000) {
        console.warn(
          `⚠️ AI Performance: Slow parallel extraction - ${parallelTime.toFixed(
            1
          )}ms (${successfulExtractions}/2 fields successful)`
        );
      }

      if (successfulExtractions < 2) {
        console.warn(
          `⚠️ AI Extraction: Partial failure - only ${successfulExtractions}/2 fields extracted successfully`
        );
      }
      if (totalTime > 20000) {
        console.warn(
          `⚠️ AI Performance: Total extraction - ${totalTime.toFixed(1)}ms`
        );
      }

      // Mark extraction as completed before returning
      extractionCompleted = true;
      this.markExtractionCompleted();

      return parsedData;
    } catch (error) {
      // Handle AbortError specifically
      if (error instanceof Error && error.name === "AbortError") {
        console.log("🛑 AI Extractor: Extraction was cancelled by user");
        this.addDebugLog("🛑 Extraction cancelled by user");
      } else {
        console.error("💥 AI Extractor: Parallel extraction failed", error);
        this.addDebugLog("💥 Parallel extraction failed", error);
      }

      this.markExtractionCompleted();
      throw error;
    }
  }

  /**
   * Check LanguageModel availability only
   */
  async checkAvailability(): Promise<{
    available: boolean;
    status?: AvailabilityStatus;
    apiVersion?: string;
    debugLogs?: string[];
  }> {
    const methodStartTime = performance.now();
    this.addDebugLog("🔍 Starting LanguageModel availability check");

    // Check cache first
    const cachedStatus = this.availabilityCache.get();
    if (cachedStatus !== null) {
      console.log(`📋 AI Availability: Using cached status`);
      const totalMethodTime = performance.now() - methodStartTime;
      console.log(
        `⏱️ AI Availability: Cache hit completed in ${totalMethodTime.toFixed(
          1
        )}ms`
      );
      return {
        available:
          cachedStatus === "available" ||
          cachedStatus === "downloadable" ||
          cachedStatus === "downloading",
        status: cachedStatus,
        apiVersion: window.ai?.languageModel
          ? "new"
          : window.LanguageModel
          ? "legacy"
          : undefined,
        debugLogs: this.getDebugLogs()
      };
    }

    console.log("🔍 AI Availability: Checking fresh availability...");
    const checkStartTime = performance.now();

    const result = {
      available: false,
      debugLogs: this.getDebugLogs()
    } as {
      available: boolean;
      status?: AvailabilityStatus;
      apiVersion?: string;
      debugLogs?: string[];
    };

    try {
      // Check for new API first (Chrome 138+)
      if (window.ai?.languageModel) {
        this.addDebugLog("🆕 Found new LanguageModel API (window.ai)");
        result.apiVersion = "new";

        const status =
          (await window.ai.languageModel.availability()) as AvailabilityStatus;
        result.status = status;
        this.addDebugLog(`📊 LanguageModel status: ${status}`);

        result.available =
          status === "available" ||
          status === "downloadable" ||
          status === "downloading";

        // Cache the result
        this.availabilityCache.set(status);
      }
      // Check legacy API
      else if (window.LanguageModel) {
        this.addDebugLog("🔄 Found legacy LanguageModel API");
        result.apiVersion = "legacy";

        const status = await window.LanguageModel.availability();
        result.status = status as AvailabilityStatus;
        this.addDebugLog(`📊 Legacy LanguageModel status: ${status}`);
        result.available = status === "available" || status === "downloadable";

        // Cache the result
        this.availabilityCache.set(status as AvailabilityStatus);
      } else {
        this.addDebugLog("❌ No LanguageModel API found");
      }
    } catch (error) {
      this.addDebugLog("💥 Error checking LanguageModel availability", error);
    }

    // Log final result
    this.addDebugLog("🏁 Availability check complete", {
      available: result.available,
      status: result.status,
      apiVersion: result.apiVersion
    });

    const checkTime = performance.now() - checkStartTime;
    const totalMethodTime = performance.now() - methodStartTime;
    console.log(
      `⏱️ AI Availability: Fresh check took ${checkTime.toFixed(1)}ms`
    );
    console.log(
      `⏱️ AI Availability: Total method completed in ${totalMethodTime.toFixed(
        1
      )}ms`
    );

    return result;
  }

  /**
   * Debounced pre-extraction for tab visibility changes
   */
  debouncedPreExtract = () => {
    this.debouncer.debounce(
      () => this.performPreExtraction(),
      AI_CONFIG.DEBOUNCE_DELAY
    );
  };

  /**
   * Perform pre-extraction logic
   */
  private async performPreExtraction(): Promise<void> {
    console.log("🚀 AI Debug: Tab became active, checking for pre-extraction");

    // Check if we should perform extraction
    if (!this.shouldPerformExtraction({ source: "pre-extraction" })) {
      console.log("� AI Debug: Skipping pre-extraction due to rate limiting");
      return;
    }

    const availability = await this.checkAvailability();
    if (availability.available) {
      console.log("🚀 AI Debug: Pre-extracting job data on newly active tab");

      // Mark extraction as started
      this.markExtractionStarted();

      const textContent = document.body.innerText;
      const pageContent: ExtractedPageContent = {
        title: document.title,
        content: textContent,
        url: window.location.href,
        hostname: window.location.hostname,
        textContent: textContent,
        length: textContent.length
      };

      // Set global extraction promise
      const extractionPromise = this.extractJobData(pageContent, {
        source: "pre-extraction"
      });
      window.extractionInProgress = extractionPromise;

      extractionPromise
        .then(jobData => {
          console.log("🚀 AI Debug: Job data pre-extracted on tab activation");
          window.preExtractedJobDataCache =
            window.preExtractedJobDataCache || {};
          window.preExtractedJobDataCache[window.location.href] = {
            data: jobData,
            timestamp: Date.now(),
            url: window.location.href
          };
          // Clear the in-progress flag
          window.extractionInProgress = undefined;
        })
        .catch(error => {
          console.log(
            "🚀 AI Debug: Pre-extraction on tab activation failed:",
            error.message
          );
          // Clear the in-progress flag even on error
          window.extractionInProgress = undefined;
          this.markExtractionCompleted();
        });
    }
  }
}

// Initialize content AI extractor
const contentAIExtractor = new ContentAIExtractor();

// Make it globally accessible for FloatingForm
(window as any).contentAIExtractor = contentAIExtractor;

// Listen for navigation changes to clear caches
let lastUrl = window.location.href;
const observer = new MutationObserver(() => {
  if (window.location.href !== lastUrl) {
    console.log("🧭 AI Extractor: Page navigation detected, clearing caches");
    contentAIExtractor.clearCaches().catch(error => {
      console.log("Failed to clear caches after navigation:", error);
    });
    lastUrl = window.location.href;
  }
});

// Observe body changes as indicator of navigation
observer.observe(document.body, { childList: true, subtree: true });

// Listen for window messages (for FloatingForm communication)
window.addEventListener("message", event => {
  if (event.data.source === "floating-form") {
    console.log(
      "🤖 AI Debug: Content script received window message:",
      event.data
    );

    if (event.data.type === "CHECK_AI_AVAILABILITY_INTERNAL") {
      contentAIExtractor
        .checkAvailability()
        .then(availability => {
          window.postMessage(
            {
              type: "AI_AVAILABILITY_RESPONSE",
              source: "content-script",
              availability
            },
            "*"
          );
        })
        .catch(error => {
          window.postMessage(
            {
              type: "AI_AVAILABILITY_RESPONSE",
              source: "content-script",
              availability: {
                available: false,
                status: "error",
                error: error.message
              }
            },
            "*"
          );
        });
    }

    if (event.data.type === "EXTRACT_JOB_DATA_INTERNAL") {
      const requestId = event.data.requestId || "default";

      // Store abort controller for this request
      const controller = new AbortController();
      if (!window.activeExtractionControllers) {
        window.activeExtractionControllers = new Map();
      }
      window.activeExtractionControllers.set(requestId, controller);

      // Use quick extraction if no pageContent provided (leverages caching)
      const extractionPromise = event.data.payload?.pageContent
        ? contentAIExtractor.extractJobData(event.data.payload.pageContent, {
            source: "message-handler",
            signal: controller.signal
          })
        : contentAIExtractor.extractJobDataQuick({
            source: "message-handler",
            signal: controller.signal
          });

      extractionPromise
        .then((data: ExtractedJobData) => {
          window.postMessage(
            {
              type: "JOB_DATA_EXTRACTED_RESPONSE",
              source: "content-script",
              success: true,
              data,
              requestId
            },
            "*"
          );
        })
        .catch((error: Error) => {
          const isCancelled = error.name === "AbortError";
          window.postMessage(
            {
              type: "JOB_DATA_EXTRACTED_RESPONSE",
              source: "content-script",
              success: false,
              error: error.message,
              cancelled: isCancelled,
              requestId
            },
            "*"
          );
        })
        .finally(() => {
          // Clean up the controller
          if (window.activeExtractionControllers) {
            window.activeExtractionControllers.delete(requestId);
          }
        });
    }

    if (event.data.type === "CANCEL_EXTRACTION") {
      const requestId = event.data.requestId || "default";
      if (window.activeExtractionControllers?.has(requestId)) {
        const controller = window.activeExtractionControllers.get(requestId);
        controller?.abort();
        console.log(
          `🚫 AI Debug: Extraction cancelled for request ${requestId}`
        );

        window.postMessage(
          {
            type: "JOB_DATA_EXTRACTED_RESPONSE",
            source: "content-script",
            success: false,
            error: "Extraction cancelled by user",
            cancelled: true,
            requestId
          },
          "*"
        );
      }
    }
  }
});

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message: any, _sender, sendResponse) => {
  console.log("🤖 AI Debug: Content script received message:", message);

  if (message.type === "CHECK_AI_AVAILABILITY") {
    // Check AI availability and respond
    contentAIExtractor
      .checkAvailability()
      .then(availability => {
        console.log("🤖 AI Debug: Availability check complete:", availability);
        sendResponse(availability);
      })
      .catch(error => {
        console.error("🤖 AI Debug: Availability check failed:", error);
        sendResponse({
          available: false,
          status: "error",
          error: error.message
        });
      });

    return true; // Will respond asynchronously
  }

  if (message.type === "EXTRACT_JOB_DATA") {
    contentAIExtractor
      .extractJobData(message.payload.pageContent)
      .then(data => {
        const response: AIExtractionResponse = {
          type: "JOB_DATA_EXTRACTED",
          success: true,
          data
        };
        sendResponse(response);
      })
      .catch(error => {
        const response: AIExtractionResponse = {
          type: "JOB_DATA_EXTRACTED",
          success: false,
          error: error.message
        };
        sendResponse(response);
      });

    return true; // Will respond asynchronously
  }
});

// Cleanup on page unload - removed cleanup method for now
// window.addEventListener("beforeunload", () => {
//   contentAIExtractor.cleanup();
// });

export { ContentAIExtractor };
