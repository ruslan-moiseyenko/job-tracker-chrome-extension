/* eslint-disable @typescript-eslint/no-explicit-any */
// Enhanced GraphQL client for Chrome Extensions
// Combines best practices with extension-specific optimizations

// Enhanced error typing (from your version ✅)
export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, any>;
}

export interface GraphQLResponse<T = any> {
  success: boolean;
  data?: T;
  errors?: GraphQLError[];
  error?: string;
  // Debugging metadata
  requestId?: string;
  timestamp?: number;
  fromCache?: boolean;
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: any;
    message: string;
  };
  error?: string;
  requestId?: string;
}

// 2. Client configuration (adapted for Chrome Extensions)
interface ClientConfig {
  timeout?: number;
  retries?: number;
  defaultCacheTTL?: number;
  enableLogging?: boolean;
  retryDelay?: number; // Base delay for exponential backoff
}

// 3. Enhanced client with Chrome Extension optimizations
export class BackgroundGraphQLClient {
  private static config: ClientConfig = {
    timeout: 20000, // 20 seconds (shorter for extensions)
    retries: 2, // Less retries for faster UX
    defaultCacheTTL: 3 * 60 * 1000, // 3 minutes (shorter for fresher data)
    enableLogging: false, // Default off for performance
    retryDelay: 1000 // 1 second base delay
  };

  // Configuration (your idea ✅)
  static configure(config: Partial<ClientConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Enable/disable logging based on extension context
  static enableDevMode(enabled: boolean = true) {
    this.config.enableLogging = enabled;
    if (enabled) {
      console.log("🔧 GraphQL Client: Development mode enabled");
    }
  }

  // Main query method with retry logic (your approach ✅)
  static async query<T = any>(
    query: string,
    variables?: Record<string, any>,
    options: {
      useCache?: boolean;
      cacheTTL?: number;
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<GraphQLResponse<T>> {
    const requestOptions = {
      useCache: options.useCache || false,
      cacheTTL: options.cacheTTL || this.config.defaultCacheTTL,
      timeout: options.timeout || this.config.timeout,
      retries: options.retries || this.config.retries
    };

    return this.executeWithRetry(query, variables, requestOptions);
  }

  // Retry logic with exponential backoff (your implementation ✅)
  private static async executeWithRetry<T>(
    query: string,
    variables: Record<string, any> = {},
    options: any,
    attempt = 1
  ): Promise<GraphQLResponse<T>> {
    try {
      return await this.executeQuery<T>(query, variables, options);
    } catch (error) {
      if (attempt <= options.retries && this.isRetriableError(error)) {
        if (this.config.enableLogging) {
          console.warn(
            `🔄 GraphQL retry ${attempt}/${options.retries}:`,
            error
          );
        }

        // Exponential backoff with jitter (better for extensions)
        const delay =
          this.config.retryDelay! * Math.pow(2, attempt - 1) +
          Math.random() * 1000;
        await this.delay(delay);

        return this.executeWithRetry(query, variables, options, attempt + 1);
      }

      throw error;
    }
  }

  // Retriable error check (your logic ✅)
  private static isRetriableError(error: any): boolean {
    if (typeof error?.message === "string") {
      const message = error.message.toLowerCase();
      return (
        message.includes("timeout") ||
        message.includes("network") ||
        message.includes("fetch") ||
        message.includes("connection")
      );
    }
    return false;
  }

  // Main execution with timeout and request tracking (enhanced)
  private static async executeQuery<T>(
    query: string,
    variables: Record<string, any>,
    options: any
  ): Promise<GraphQLResponse<T>> {
    const requestId = this.generateRequestId();
    const timestamp = Date.now();

    if (this.config.enableLogging) {
      console.log(`📤 [${requestId}] GraphQL:`, {
        operation: this.getOperationType(query),
        variables: Object.keys(variables),
        cache: options.useCache
      });
    }

    return new Promise((resolve, reject) => {
      // Timeout handling (your approach ✅)
      const timeoutId = setTimeout(() => {
        reject(new Error(`GraphQL request timeout (${options.timeout}ms)`));
      }, options.timeout);

      chrome.runtime.sendMessage(
        {
          action: "graphqlRequest",
          query,
          variables,
          useCache: options.useCache,
          cacheTTL: options.cacheTTL,
          requestId,
          timestamp
        },
        (response: GraphQLResponse<T>) => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            const error = {
              success: false,
              error: chrome.runtime.lastError.message,
              requestId,
              timestamp
            } as GraphQLResponse<T>;

            if (this.config.enableLogging) {
              console.error(
                `❌ [${requestId}] Chrome error:`,
                chrome.runtime.lastError.message
              );
            }

            resolve(error);
          } else {
            if (this.config.enableLogging) {
              const status = response.success ? "✅" : "❌";
              console.log(`${status} [${requestId}] Response:`, {
                success: response.success,
                hasData: !!response.data,
                fromCache: response.fromCache,
                errors: response.errors?.length || 0
              });
            }

            resolve({
              ...response,
              requestId,
              timestamp
            });
          }
        }
      );
    });
  }

  // Batch requests for performance (research recommendation)
  static async batchRequests<T>(
    requests: Array<{
      query: string;
      variables?: Record<string, any>;
      operationName?: string;
    }>,
    options: {
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<GraphQLResponse<T>[]> {
    const timeout = options.timeout ?? this.config.timeout!;
    const retries = options.retries ?? this.config.retries!;
    const retryDelay = this.config.retryDelay!;

    const batchQuery = requests.map((req) => ({
      query: req.query,
      variables: req.variables || {},
      operationName: req.operationName || this.getOperationType(req.query)
    }));

    if (this.config.enableLogging) {
      console.log(`📦 [BATCH] Executing ${requests.length} GraphQL operations`);
    }

    // Execute batch with retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.executeBatchQuery<T>(batchQuery, { timeout });
      } catch (error) {
        if (attempt === retries) throw error;

        const delay = Math.min(retryDelay * Math.pow(2, attempt), 10000);
        if (this.config.enableLogging) {
          console.log(
            `🔄 [BATCH] Retry attempt ${attempt + 1}/${
              retries + 1
            } in ${delay}ms`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return []; // Fallback (never reached due to throw above)
  }

  private static async executeBatchQuery<T>(
    batchQuery: any[],
    options: any
  ): Promise<GraphQLResponse<T>[]> {
    const requestId = this.generateRequestId();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(
          new Error(`Batch GraphQL request timeout (${options.timeout}ms)`)
        );
      }, options.timeout);

      chrome.runtime.sendMessage(
        {
          action: "graphqlBatch",
          queries: batchQuery,
          requestId,
          timestamp: Date.now()
        },
        (response: GraphQLResponse<T>[]) => {
          clearTimeout(timeoutId);

          if (chrome.runtime.lastError) {
            const error = {
              success: false,
              error: chrome.runtime.lastError.message,
              requestId
            } as GraphQLResponse<T>;

            resolve([error]);
          } else {
            resolve(response || []);
          }
        }
      );
    });
  }

  // Mutation with better error handling (your approach ✅)
  static async mutate<T = any>(
    mutation: string,
    variables?: Record<string, any>,
    options: {
      timeout?: number;
      retries?: number;
    } = {}
  ): Promise<GraphQLResponse<T>> {
    return this.query<T>(mutation, variables, {
      useCache: false,
      ...options
    });
  }

  // Enhanced authentication (your improvement ✅)
  static async authenticate(credentials: {
    email: string;
    password: string;
  }): Promise<AuthResponse> {
    const requestId = this.generateRequestId();

    if (this.config.enableLogging) {
      console.log(`🔐 [${requestId}] Auth attempt:`, credentials.email);
    }

    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "authenticate",
          credentials,
          requestId
        },
        (response: AuthResponse) => {
          if (chrome.runtime.lastError) {
            resolve({
              success: false,
              error: chrome.runtime.lastError.message,
              requestId
            });
          } else {
            if (this.config.enableLogging) {
              const status = response.success ? "✅" : "❌";
              console.log(
                `${status} [${requestId}] Auth result:`,
                response.success
              );
            }
            resolve({ ...response, requestId });
          }
        }
      );
    });
  }

  // Utility methods
  private static generateRequestId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  private static getOperationType(query: string): string {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith("mutation")) return "mutation";
    if (trimmed.startsWith("subscription")) return "subscription";
    return "query";
  }

  private static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Cache invalidation helper
  static async invalidateCache(pattern?: string): Promise<void> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          action: "invalidateCache",
          pattern: pattern || "*"
        },
        () => {
          if (this.config.enableLogging) {
            console.log("🗑️ Cache invalidated:", pattern);
          }
          resolve();
        }
      );
    });
  }
}
