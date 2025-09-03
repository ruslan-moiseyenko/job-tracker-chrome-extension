// Lightweight GraphQL client for Chrome Extension Service Workers
// Optimized to work with httpOnly cookies and chrome.storage

interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: Array<string | number>;
  }>;
}

interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export class ChromeGraphQLClient {
  private endpoint: string;
  private defaultHeaders: Record<string, string>;
  private cachePrefix = "graphql_cache_";

  constructor(
    endpoint: string,
    options: {
      headers?: Record<string, string>;
      defaultCacheTTL?: number;
    } = {}
  ) {
    this.endpoint = endpoint;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...options.headers
    };
  }

  // Main method to execute GraphQL requests
  async request<T = unknown>(
    request: GraphQLRequest,
    options: {
      useCache?: boolean;
      cacheTTL?: number;
      retries?: number;
    } = {}
  ): Promise<GraphQLResponse<T>> {
    const { useCache = false, cacheTTL = 5 * 60 * 1000, retries = 1 } = options;

    // Check cache
    if (useCache) {
      const cached = await this.getCachedResponse<T>(request);
      if (cached) {
        return { data: cached };
      }
    }

    let lastError: Error | null = null;

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          credentials: "include", // CRITICAL: sends httpOnly cookies
          headers: this.defaultHeaders,
          body: JSON.stringify({
            query: request.query,
            variables: request.variables,
            operationName: request.operationName
          })
        });

        if (!response.ok) {
          // HTTP error handling
          console.log("HTTP error:", response.status, response.statusText);
          if (response.status === 401) {
            // Attempt to refresh token
            const refreshed = await this.refreshToken();
            if (refreshed && attempt < retries) {
              continue; // Retry with fresh token
            }
          }
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result: GraphQLResponse<T> = await response.json();

        // Check GraphQL errors
        if (result.errors && result.errors.length > 0) {
          console.warn("GraphQL errors:", result.errors);
          // Do not interrupt execution, return result with errors
        }

        // Cache successful result
        if (useCache && result.data && !result.errors) {
          await this.setCachedResponse(request, result.data, cacheTTL);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");

        if (attempt < retries) {
          // Exponential backoff
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error("Request failed");
  }

  // Helper methods for caching with chrome.storage
  private async getCachedResponse<T>(
    request: GraphQLRequest
  ): Promise<T | null> {
    try {
      const cacheKey = this.getCacheKey(request);
      const result = await chrome.storage.local.get(cacheKey);
      const cached = result[cacheKey] as CacheEntry<T> | undefined;

      if (cached && Date.now() < cached.timestamp + cached.ttl) {
        return cached.data;
      }

      // Remove stale cache
      if (cached) {
        await chrome.storage.local.remove(cacheKey);
      }

      return null;
    } catch (error) {
      console.warn("Cache read error:", error);
      return null;
    }
  }

  private async setCachedResponse<T>(
    request: GraphQLRequest,
    data: T,
    ttl: number
  ): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(request);
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

  private getCacheKey(request: GraphQLRequest): string {
    const key = JSON.stringify({
      query: request.query,
      variables: request.variables
    });
    return `${this.cachePrefix}${this.hashCode(key)}`;
  }

  private hashCode(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString();
  }

  // Token refresh via refresh endpoint
  private async refreshToken(): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.endpoint.replace("/graphql", "/auth/refresh")}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" }
        }
      );

      return response.ok;
    } catch (error) {
      console.error("Token refresh failed:", error);
      return false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Очистка кэша
  async clearCache(): Promise<void> {
    try {
      const items = await chrome.storage.local.get();
      const keysToRemove = Object.keys(items).filter((key) =>
        key.startsWith(this.cachePrefix)
      );

      if (keysToRemove.length > 0) {
        await chrome.storage.local.remove(keysToRemove);
      }
    } catch (error) {
      console.error("Cache clear error:", error);
    }
  }
}

// Complete GraphQL queries
export const GRAPHQL_QUERIES = {
  CREATE_JOB_APPLICATION: `
    mutation CreateJobApplication($input: JobApplicationInput!) {
      createJobApplication(input: $input) {
        id
        name
        surname
        position
        company
        status
        createdAt
      }
    }
  `,

  GET_JOB_APPLICATIONS: `
    query GetJobApplications($limit: Int, $offset: Int) {
      jobApplications(limit: $limit, offset: $offset) {
        id
        name
        surname
        position
        company
        status
        createdAt
        updatedAt
      }
    }
  `,

  UPDATE_JOB_APPLICATION_STATUS: `
    mutation UpdateJobApplicationStatus($id: ID!, $status: JobApplicationStatus!) {
      updateJobApplicationStatus(id: $id, status: $status) {
        id
        status
        updatedAt
      }
    }
  `
};

// Export client instance
export const graphqlClient = new ChromeGraphQLClient(
  "https://your-api-domain.com/graphql",
  {
    headers: {
      "X-Client": "chrome-extension"
    }
  }
);
