/* eslint-disable @typescript-eslint/no-explicit-any */
// Shared utilities for AI operations
// Common functions used across AI-related file  // Job-related section patterns
// const jobSectionPatterns = [
//   new RegExp(
//     "job description[:\\s]*([\\s\\S]*?)(?:\\n\\s*" +
//       "(?:requirements|qualifications|responsibilities|benefits|salary|location|about us|company|apply|$))",
//     "gi"
//   ),
//   new RegExp(
//     "about the role[:\\s]*([\\s\\S]*?)(?:\\n\\s*" +
//       "(?:requirements|qualifications|responsibilities|benefits|salary|location|about us|company|apply|$))",
//     "gi"
//   ),
//   new RegExp(
//     "responsibilities[:\\s]*([\\s\\S]*?)(?:\\n\\s*" +
//       "(?:requirements|qualifications|benefits|salary|location|about us|company|apply|$))",
//     "gi"
//   ),
//   new RegExp(
//     "requirements[:\\s]*([\\s\\S]*?)(?:\\n\\s*" +
//       "(?:qualifications|responsibilities|benefits|salary|location|about us|company|apply|$))",
//     "gi"
//   ),
//   new RegExp(
//     "qualifications[:\\s]*([\\s\\S]*?)(?:\\n\\s*" +
//       "(?:responsibilities|benefits|salary|location|about us|company|apply|$))",
//     "gi"
//   ),
//   new RegExp(
//     "benefits[:\\s]*([\\s\\S]*?)(?:\\n\\s*" +
//       "(?:salary|location|about us|company|apply|$))",
//     "gi"
//   )
// ];
export const AI_CONFIG = {
  MAX_CONTENT_LENGTH: 10000,
  CACHE_DURATION: 30000, // 30 seconds
  DEBOUNCE_DELAY: 500,
  MAX_DEBUG_LOGS: 50,
  DOWNLOAD_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000
} as const;

export type AvailabilityStatus =
  | "unavailable"
  | "downloadable"
  | "downloading"
  | "available";

export interface DebugLogger {
  log: (message: string, data?: any) => void;
  getLogs: () => string[];
  clearLogs: () => void;
}

/**
 * Create a conditional debug logger
 */
export function createDebugLogger(debugMode: boolean = false): DebugLogger {
  const logs: string[] = [];

  const log = (message: string, data?: any): void => {
    if (!debugMode) return;

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;

    if (data) {
      console.log(`🤖 AI Debug: ${logEntry}`, data);
    } else {
      console.log(`🤖 AI Debug: ${logEntry}`);
    }

    logs.push(logEntry);

    // Keep only last N logs to prevent memory issues
    if (logs.length > AI_CONFIG.MAX_DEBUG_LOGS) {
      logs.shift();
    }
  };

  const getLogs = (): string[] => [...logs];

  const clearLogs = (): void => {
    logs.length = 0;
  };

  return { log, getLogs, clearLogs };
}

/**
 * Cache for API availability status
 */
export class AvailabilityCache {
  private cache: { status: AvailabilityStatus; timestamp: number } | null =
    null;

  isValid(): boolean {
    return (
      this.cache !== null &&
      Date.now() - this.cache.timestamp < AI_CONFIG.CACHE_DURATION
    );
  }

  get(): AvailabilityStatus | null {
    return this.isValid() ? this.cache!.status : null;
  }

  set(status: AvailabilityStatus): void {
    this.cache = { status, timestamp: Date.now() };
  }

  clear(): void {
    this.cache = null;
  }
}

/**
 * Debounce utility for rapid events
 */
export class Debouncer {
  private timer: number | null = null;

  debounce(
    callback: () => void,
    delay: number = AI_CONFIG.DEBOUNCE_DELAY
  ): void {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = window.setTimeout(callback, delay);
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  destroy(): void {
    this.cancel();
  }
}

/**
 * Retry utility with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = AI_CONFIG.MAX_RETRIES,
  baseDelay: number = AI_CONFIG.RETRY_DELAY
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (i === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Optimize content by prioritizing job-related sections
 */
export function optimizeContent(
  content: string,
  maxLength: number = AI_CONFIG.MAX_CONTENT_LENGTH
): string {
  if (content.length <= maxLength) return content;

  // Simple keyword-based prioritization
  const jobKeywords = [
    "job description",
    "responsibilities",
    "requirements",
    "qualifications",
    "benefits",
    "about the role"
  ];
  const sections: string[] = [];

  for (const keyword of jobKeywords) {
    const pattern = new RegExp(
      `${keyword}[:\\s]*([\\s\\S]*?)(?=\\n\\s*(?:${jobKeywords.join("|")}|$))`,
      "gi"
    );
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].trim().length > 50) {
        sections.push(match[1].trim());
      }
    }
  }

  // If we found good sections, use them
  if (sections.length > 0) {
    const optimized = sections.join("\n\n");
    if (optimized.length <= maxLength) return optimized;
  }

  // Fallback to smart truncation
  return content.slice(0, maxLength);
}

/**
 * Enhanced JSON parsing with comprehensive fixes
 */
export function parseAIResponse(response: string): any {
  try {
    // Clean up the response
    let cleaned = response.trim();

    // Remove markdown code blocks more aggressively
    cleaned = cleaned.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, "$1");
    cleaned = cleaned.replace(/^```\s*json\s*\n([\s\S]*?)\n```$/g, "$1");
    cleaned = cleaned.replace(/^```\s*\n([\s\S]*?)\n```$/g, "$1");
    cleaned = cleaned.replace(/```/g, "");

    // Remove any leading/trailing non-JSON content
    cleaned = cleaned.trim();

    // Extract JSON content between first { and last }
    const startBrace = cleaned.indexOf("{");
    const endBrace = cleaned.lastIndexOf("}");

    if (startBrace !== -1 && endBrace !== -1 && endBrace > startBrace) {
      cleaned = cleaned.substring(startBrace, endBrace + 1);
    } else if (startBrace !== -1) {
      // If no closing brace, try to find a reasonable end
      cleaned = cleaned.substring(startBrace);
      // Try to close incomplete JSON
      const openBraces = (cleaned.match(/{/g) || []).length;
      const closeBraces = (cleaned.match(/}/g) || []).length;
      if (openBraces > closeBraces) {
        cleaned += "}".repeat(openBraces - closeBraces);
      }
    }

    // Remove any remaining non-JSON prefix (like invisible characters)
    cleaned = cleaned.replace(/^[^{]*/, "");

    // Try parsing as-is first
    try {
      return JSON.parse(cleaned);
    } catch {
      // Apply comprehensive JSON fixes
      let fixed = cleaned
        .replace(/'/g, '"') // Single to double quotes
        .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
        .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
        .replace(/:\s*([^",{[\s][^",}\]]*?)(\s*[,}\]])/g, ': "$1"$2') // Quote unquoted string values
        .replace(/:\s*"([^"]*)"([^",}\]]*?)"(\s*[,}\]])/g, ': "$1$2"$3') // Fix split quoted strings
        .replace(/\n/g, "\\n") // Escape newlines in strings
        .replace(/\t/g, "\\t") // Escape tabs in strings
        .replace(/\r/g, "\\r"); // Escape carriage returns

      // Handle incomplete strings by trying to close them
      const lastQuote = fixed.lastIndexOf('"');
      const colonAfterQuote = fixed.indexOf(":", lastQuote);
      const commaAfterQuote = fixed.indexOf(",", lastQuote);
      const braceAfterQuote = fixed.indexOf("}", lastQuote);

      if (
        lastQuote !== -1 &&
        colonAfterQuote === -1 &&
        commaAfterQuote === -1 &&
        braceAfterQuote === -1
      ) {
        // String appears to be incomplete, try to close it
        fixed += '"';
      }

      try {
        return JSON.parse(fixed);
      } catch (secondError) {
        // If still failing, try to extract partial data
        console.warn(
          "JSON parsing failed, attempting partial extraction:",
          secondError
        );

        // Try multiple extraction strategies
        let partialResult: any = {};

        // Strategy 1: Extract key-value pairs manually
        const keyValuePairs = fixed.match(/"([^"]+)":\s*"([^"]*)"[^,}]*[,}]/g);
        if (keyValuePairs) {
          keyValuePairs.forEach(pair => {
            const match = pair.match(/"([^"]+)":\s*"([^"]*)"[^,}]*[,}]/);
            if (match) {
              partialResult[match[1]] = match[2];
            }
          });
        }

        // Strategy 2: Try to extract from the original response if strategy 1 failed
        if (Object.keys(partialResult).length === 0) {
          const originalPairs = response.match(
            /"([^"]+)":\s*"([^"]*)"[^,}]*[,}]/g
          );
          if (originalPairs) {
            originalPairs.forEach(pair => {
              const match = pair.match(/"([^"]+)":\s*"([^"]*)"[^,}]*[,}]/);
              if (match) {
                partialResult[match[1]] = match[2];
              }
            });
          }
        }

        // Strategy 3: Extract from markdown-wrapped content
        if (Object.keys(partialResult).length === 0) {
          const markdownMatch = response.match(
            /```(?:json)?\s*(\{[\s\S]*?\})\s*```/
          );
          if (markdownMatch) {
            try {
              partialResult = JSON.parse(markdownMatch[1]);
            } catch {
              // Try to extract key-value pairs from markdown content
              const markdownPairs = markdownMatch[1].match(
                /"([^"]+)":\s*"([^"]*)"[^,}]*[,}]/g
              );
              if (markdownPairs) {
                markdownPairs.forEach(pair => {
                  const match = pair.match(/"([^"]+)":\s*"([^"]*)"[^,}]*[,}]/);
                  if (match) {
                    partialResult[match[1]] = match[2];
                  }
                });
              }
            }
          }
        }

        if (Object.keys(partialResult).length > 0) {
          console.warn("Returning partial JSON data:", partialResult);
          return partialResult;
        }

        throw secondError;
      }
    }
  } catch (error) {
    throw new Error(`Failed to parse AI response: ${(error as Error).message}`);
  }
}

/**
 * Validate and clean extracted job data
 */
export function validateAndCleanJobData(data: any): {
  company: string;
  position: string;
  jobDescription: string;
} {
  const result = {
    company: (data.company || "unknown").toString().trim(),
    position: (data.position || "unknown").toString().trim(),
    jobDescription: (data.jobDescription || "unknown").toString().trim()
  };

  // Clean up the job description - fix escaped characters
  result.jobDescription = result.jobDescription
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\"/g, '"');

  return result;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  // Check for development indicators in browser environment
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  const isLocalhost = hostname === "localhost";
  const isLocalIP = hostname === "127.0.0.1";
  const isFileProtocol = protocol === "file:";
  const isDevPort = Boolean(
    port && ["3000", "5173", "8080", "4000"].includes(port)
  );

  return isLocalhost || isLocalIP || isFileProtocol || isDevPort;
}
