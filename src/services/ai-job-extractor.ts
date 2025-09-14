/* eslint-disable @typescript-eslint/no-explicit-any */
// AI-powered job data extraction service
// Combines Prompt API for structured extraction and Summarizer API for content processing

import {
  AvailabilityCache,
  createDebugLogger,
  isDevelopment,
  optimizeContent,
  parseAIResponse,
  validateAndCleanJobData
} from "../utils/ai-utils";

export interface ExtractedJobData {
  company: string;
  position: string;
  jobDescription: string;
  salary?: string;
  location?: string;
  jobType?: string;
  requirements?: string[];
  benefits?: string[];
}

export interface PageContent {
  title: string;
  content: string;
  url: string;
  hostname: string;
}

class AIJobExtractor {
  private promptSession: any = null;
  private summarizerSession: any = null;
  private debugLogger = createDebugLogger(isDevelopment());
  private availabilityCache = new AvailabilityCache();

  /**
   * Check if AI APIs are available with comprehensive debugging
   */
  async checkAvailability(): Promise<{
    promptAPI: boolean;
    summarizerAPI: boolean;
    canExtract: boolean;
  }> {
    this.debugLogger.log("🔍 Starting AI availability check");

    // Check cache first for prompt API
    const cachedPromptStatus = this.availabilityCache.get();
    if (cachedPromptStatus !== null) {
      this.debugLogger.log(
        `📋 Using cached availability status: ${cachedPromptStatus}`
      );
      // For cached results, assume summarizer has same status
      const canExtract =
        cachedPromptStatus === "available" ||
        cachedPromptStatus === "downloadable" ||
        cachedPromptStatus === "downloading";
      return {
        promptAPI: canExtract,
        summarizerAPI: canExtract,
        canExtract
      };
    }

    // Check for new API first (Chrome 138+)
    let promptAvailable = false;
    let summarizerAvailable = false;

    try {
      if ((window as any).ai?.languageModel) {
        this.debugLogger.log("🆕 Found new AI API (window.ai)");
        const status = await (window as any).ai.languageModel.availability();
        this.debugLogger.log(`📊 New LanguageModel status: ${status}`);

        if (status === "available") {
          promptAvailable = true;
          this.debugLogger.log("✅ Language Model is ready to use");
        } else if (status === "downloadable") {
          this.debugLogger.log(
            "⬇️ Model needs to be downloaded - triggering download..."
          );
          try {
            // Trigger download by creating a session
            const session = await (window as any).ai.languageModel.create();
            this.debugLogger.log("📥 Download started successfully");
            promptAvailable = true;
            // Clean up test session
            if (session.destroy) session.destroy();
          } catch (downloadError) {
            this.debugLogger.log(
              `💥 Failed to trigger download: ${downloadError}`
            );
            promptAvailable = false;
          }
        } else if (status === "downloading") {
          this.debugLogger.log(
            "📥 Model is currently downloading - marking as available"
          );
          promptAvailable = true;
        } else if (status === "unavailable") {
          this.debugLogger.log(
            "🚫 Language Model not supported on this device"
          );
          promptAvailable = false;
        }

        // Cache the result
        this.availabilityCache.set(status);
      } else if ("LanguageModel" in window) {
        this.debugLogger.log("🔄 Found legacy LanguageModel API");
        const status = await (window as any).LanguageModel.availability();
        this.debugLogger.log(`📊 Legacy LanguageModel status: ${status}`);

        if (status === "available") {
          promptAvailable = true;
        } else if (status === "downloadable") {
          this.debugLogger.log(
            "⬇️ Legacy model needs download - triggering..."
          );
          try {
            // Add timeout to prevent hanging
            const downloadPromise = (window as any).LanguageModel.create();
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error("Download timeout after 10 seconds")),
                10000
              );
            });

            this.debugLogger.log("⏰ Starting download with 10s timeout...");
            const session = await Promise.race([
              downloadPromise,
              timeoutPromise
            ]);
            this.debugLogger.log("📥 Legacy download started successfully");
            promptAvailable = true;
            // Clean up test session
            if (session && session.destroy) session.destroy();
          } catch (downloadError) {
            this.debugLogger.log(
              `💥 Failed to trigger legacy download: ${downloadError}`
            );
            this.debugLogger.log(
              "🤔 Download may be happening in background despite error"
            );
            // Even if download fails to create session, the download might still be triggered
            // Let's be optimistic and mark as available
            promptAvailable = true;
          }

          // Check status again after download attempt
          try {
            const newStatus = await (
              window as any
            ).LanguageModel.availability();
            this.debugLogger.log(
              `🔄 Status after download attempt: ${newStatus}`
            );
            if (newStatus === "downloading") {
              this.debugLogger.log(
                "📥 Download confirmed - model is now downloading!"
              );
            }
          } catch (statusError) {
            this.debugLogger.log(
              `❌ Could not check status after download attempt: ${statusError}`
            );
          }
        } else {
          promptAvailable = false;
        }
      } else {
        this.debugLogger.log("❌ No LanguageModel API found");
      }
    } catch (error) {
      this.debugLogger.log(`💥 Error checking LanguageModel: ${error}`);
    }

    try {
      if ((window as any).ai?.summarizer) {
        const status = await (window as any).ai.summarizer.availability();
        this.debugLogger.log(`📊 New Summarizer status: ${status}`);

        if (status === "available") {
          summarizerAvailable = true;
        } else if (status === "downloadable") {
          this.debugLogger.log("⬇️ Summarizer needs download - triggering...");
          try {
            const session = await (window as any).ai.summarizer.create();
            this.debugLogger.log("📥 Summarizer download started");
            summarizerAvailable = true;
            if (session.destroy) session.destroy();
          } catch (downloadError) {
            this.debugLogger.log(
              `💥 Failed to trigger summarizer download: ${downloadError}`
            );
            summarizerAvailable = false;
          }
        } else if (status === "downloading") {
          summarizerAvailable = true;
        } else {
          summarizerAvailable = false;
        }
      } else if ("AISummarizer" in window) {
        this.debugLogger.log("🔄 Found legacy Summarizer API");
        const status = await (window as any).AISummarizer.availability();
        this.debugLogger.log(`📊 Legacy Summarizer status: ${status}`);

        if (status === "available") {
          summarizerAvailable = true;
        } else if (status === "downloadable") {
          this.debugLogger.log(
            "⬇️ Legacy summarizer needs download - triggering..."
          );
          try {
            const session = await (window as any).AISummarizer.create();
            this.debugLogger.log("📥 Legacy summarizer download started");
            summarizerAvailable = true;
            if (session.destroy) session.destroy();
          } catch (downloadError) {
            this.debugLogger.log(
              `💥 Failed to trigger legacy summarizer download: ${downloadError}`
            );
            summarizerAvailable = false;
          }
        } else {
          summarizerAvailable = false;
        }
      } else {
        this.debugLogger.log("❌ No Summarizer API found");
      }
    } catch (error) {
      this.debugLogger.log(`💥 Error checking Summarizer: ${error}`);
    }

    const result = {
      promptAPI: promptAvailable,
      summarizerAPI: summarizerAvailable,
      canExtract: promptAvailable || summarizerAvailable
    };

    this.debugLogger.log("🏁 Final availability result:", result);

    // Additional environment info
    this.debugLogger.log("🌍 Environment info:", {
      userAgent: navigator.userAgent,
      chrome: (window as any).chrome ? "Available" : "Not found",
      isSecureContext: window.isSecureContext,
      location: window.location.hostname
    });

    return result;
  }

  /**
   * Initialize AI sessions
   */
  private async initializeSessions() {
    try {
      // Initialize Prompt API session for structured extraction
      if ((window as any).ai?.languageModel) {
        this.debugLogger.log("🔄 Initializing new AI LanguageModel session");
        const status = await (window as any).ai.languageModel.availability();
        this.debugLogger.log(`📊 Status before session creation: ${status}`);

        if (
          status === "available" ||
          status === "downloadable" ||
          status === "downloading"
        ) {
          this.promptSession = await (window as any).ai.languageModel.create({
            temperature: 0,
            topK: 1.0
          });
          this.debugLogger.log("✅ New AI session created successfully");
        } else {
          this.debugLogger.log(`❌ Cannot create session - status: ${status}`);
        }
      } else if ("LanguageModel" in window) {
        this.debugLogger.log("🔄 Initializing legacy LanguageModel session");
        const status = await (window as any).LanguageModel.availability();
        this.debugLogger.log(
          `📊 Legacy status before session creation: ${status}`
        );

        if (status === "available" || status === "downloadable") {
          this.promptSession = await (window as any).LanguageModel.create({
            temperature: 0,
            topK: 1.0
          });
          this.debugLogger.log("✅ Legacy session created successfully");
        } else {
          console.log(
            "🤖 AI Debug: ❌ Cannot create legacy session - status:",
            status
          );
        }
      }

      // Initialize Summarizer API session
      if ((window as any).ai?.summarizer) {
        this.debugLogger.log("🔄 Initializing new AI Summarizer session");
        const status = await (window as any).ai.summarizer.availability();

        if (
          status === "available" ||
          status === "downloadable" ||
          status === "downloading"
        ) {
          this.summarizerSession = await (window as any).ai.summarizer.create({
            type: "key-points",
            format: "plain-text",
            length: "medium"
          });
          this.debugLogger.log("✅ New Summarizer session created");
        }
      } else if ("AISummarizer" in window) {
        this.debugLogger.log("🔄 Initializing legacy Summarizer session");
        const status = await (window as any).AISummarizer.availability();

        if (status === "available" || status === "downloadable") {
          this.summarizerSession = await (window as any).AISummarizer.create({
            type: "key-points",
            format: "plain-text",
            length: "medium"
          });
          this.debugLogger.log("✅ Legacy Summarizer session created");
        }
      }
    } catch (error) {
      this.debugLogger.log(`💥 Failed to initialize AI sessions: ${error}`);
    }
  }

  /**
   * Extract job data from page content using structured prompts
   */
  async extractJobData(pageContent: PageContent): Promise<ExtractedJobData> {
    await this.initializeSessions();

    let extractedData: Partial<ExtractedJobData> = {};

    // Try Prompt API for structured extraction first
    if (this.promptSession) {
      try {
        extractedData = await this.extractWithPromptAPI(pageContent);
      } catch (error) {
        this.debugLogger.log(
          `Prompt API extraction failed, falling back to basic extraction: ${error}`
        );
        extractedData = this.extractBasicJobData(pageContent);
      }
    } else {
      // Fallback to basic extraction
      extractedData = this.extractBasicJobData(pageContent);
    }

    // Enhance job description with Summarizer API if available
    if (this.summarizerSession && extractedData.jobDescription) {
      try {
        extractedData.jobDescription = await this.summarizeJobDescription(
          extractedData.jobDescription
        );
      } catch (error) {
        console.warn(
          "Summarization failed, keeping original description:",
          error
        );
      }
    }

    // Ensure all required fields have fallback values
    return {
      company:
        extractedData.company || this.extractCompanyFromURL(pageContent.url),
      position:
        extractedData.position ||
        this.extractPositionFromTitle(pageContent.title),
      jobDescription:
        extractedData.jobDescription ||
        this.createFallbackDescription(pageContent),
      salary: extractedData.salary,
      location: extractedData.location,
      jobType: extractedData.jobType,
      requirements: extractedData.requirements,
      benefits: extractedData.benefits
    };
  }

  /**
   * Extract job data using Prompt API with structured JSON output
   */
  private async extractWithPromptAPI(
    pageContent: PageContent
  ): Promise<Partial<ExtractedJobData>> {
    // const currentYear = new Date().getFullYear();

    const prompt = `
    Analyze the following job posting and extract key information. Return only valid JSON with these fields:

    REQUIRED FIELDS (always include, use "unknown" if not found):
    - "company": Company/employer name
    - "position": Job title/role
    - "jobDescription": Brief description (2-3 sentences max)

    OPTIONAL FIELDS (only include if clearly stated):
    - "salary": Salary/compensation (include currency and range)
    - "location": Job location (city, state/country or "Remote")
    - "jobType": Employment type (Full-time, Part-time, Contract, Intern)
    - "requirements": Array of key required skills/qualifications (max 5)
    - "benefits": Array of notable benefits mentioned (max 3)

    Page Title: ${pageContent.title}
    Page URL: ${pageContent.url}
    Content: ${optimizeContent(pageContent.content)}

    Return only valid JSON, no additional text:`;

    const result = await this.promptSession.prompt(prompt);

    try {
      return validateAndCleanJobData(parseAIResponse(result));
    } catch (parseError) {
      this.debugLogger.log(`Failed to parse JSON from Prompt API: ${result}`);
      throw parseError;
    }
  }

  /**
   * Summarize job description for better readability
   */
  private async summarizeJobDescription(description: string): Promise<string> {
    if (!description || description.length < 200) {
      return description; // Don't summarize short descriptions
    }

    try {
      const summary = await this.summarizerSession.summarize(description);
      return summary || description;
    } catch (error) {
      this.debugLogger.log(`Summarization failed: ${error}`);
      return description;
    }
  }

  /**
   * Basic extraction without AI for fallback
   */
  private extractBasicJobData(
    pageContent: PageContent
  ): Partial<ExtractedJobData> {
    const content = pageContent.content.toLowerCase();

    return {
      company: this.extractCompanyFromURL(pageContent.url),
      position: this.extractPositionFromTitle(pageContent.title),
      jobDescription: this.createFallbackDescription(pageContent),
      salary: this.extractSalaryPattern(pageContent.content),
      location: this.extractLocationPattern(content),
      jobType: this.extractJobTypePattern(content)
    };
  }

  /**
   * Extract company name from URL hostname
   */
  private extractCompanyFromURL(url: string): string {
    try {
      const hostname = new URL(url).hostname;

      // Common job board patterns
      if (hostname.includes("linkedin.com")) return "LinkedIn Job";
      if (hostname.includes("indeed.com")) return "Indeed Job";
      if (hostname.includes("glassdoor.com")) return "Glassdoor Job";
      if (hostname.includes("monster.com")) return "Monster Job";
      if (hostname.includes("ziprecruiter.com")) return "ZipRecruiter Job";
      if (hostname.includes("careerbuilder.com")) return "CareerBuilder Job";

      // Extract main domain name
      const parts = hostname.split(".");
      if (parts.length >= 2) {
        const mainDomain = parts[parts.length - 2];
        return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
      }

      return hostname;
    } catch {
      return "Unknown Company";
    }
  }

  /**
   * Extract position from page title
   */
  private extractPositionFromTitle(title: string): string {
    // Common patterns in job titles
    const patterns = [
      /(.+?)\s*[-|@]\s*.+/i, // "Software Engineer - Company" or "Software Engineer | Company"
      /(.+?)\s*at\s+.+/i, // "Software Engineer at Company"
      /(.+?)\s*\(.+\)/i // "Software Engineer (Remote)"
    ];

    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Return first part before common separators
    const separators = [" - ", " | ", " at ", " @ "];
    for (const sep of separators) {
      const index = title.indexOf(sep);
      if (index > 0) {
        return title.substring(0, index).trim();
      }
    }

    return title.length > 50 ? title.substring(0, 50) + "..." : title;
  }

  /**
   * Create fallback description from page content
   */
  private createFallbackDescription(pageContent: PageContent): string {
    const content = pageContent.content;

    // Try to find job description section
    const descriptionPatterns = [
      /job description[:\s]+([\s\S]{100,500})/i,
      /description[:\s]+([\s\S]{100,500})/i,
      /about the role[:\s]+([\s\S]{100,500})/i,
      /responsibilities[:\s]+([\s\S]{100,500})/i
    ];

    for (const pattern of descriptionPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim().substring(0, 300) + "...";
      }
    }

    // Fallback to first part of content
    return content.substring(0, 200).trim() + "...";
  }

  /**
   * Extract salary using pattern matching
   */
  private extractSalaryPattern(content: string): string | undefined {
    const salaryPatterns = [
      /\$[\d,]+\s*-\s*\$[\d,]+/g, // $50,000 - $70,000
      /\$[\d,]+k?\s*-\s*[\d,]+k?/g, // $50k - $70k
      /[\d,]+\s*-\s*[\d,]+k?\s*per\s+year/gi // 50,000 - 70,000 per year
    ];

    for (const pattern of salaryPatterns) {
      const match = content.match(pattern);
      if (match) {
        return match[0];
      }
    }

    return undefined;
  }

  /**
   * Extract location using pattern matching
   */
  private extractLocationPattern(content: string): string | undefined {
    const locationPatterns = [
      /location[:\s]+([\w\s,]+)/i,
      /(remote|hybrid|on-site)/i,
      /([A-Z][a-z]+,\s*[A-Z]{2})/g // City, State format
    ];

    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Extract job type using pattern matching
   */
  private extractJobTypePattern(content: string): string | undefined {
    const jobTypes = [
      "full-time",
      "part-time",
      "contract",
      "temporary",
      "internship",
      "freelance"
    ];

    for (const type of jobTypes) {
      if (content.includes(type)) {
        return type
          .split("-")
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join("-");
      }
    }

    return undefined;
  }

  /**
   * Cleanup sessions
   */
  async cleanup(): Promise<void> {
    try {
      if (this.promptSession && this.promptSession.destroy) {
        await this.promptSession.destroy();
        this.promptSession = null;
      }

      if (this.summarizerSession && this.summarizerSession.destroy) {
        await this.summarizerSession.destroy();
        this.summarizerSession = null;
      }

      // Clear cache and debug logs to free memory
      this.availabilityCache.clear();
      this.debugLogger.clearLogs();
    } catch (error) {
      this.debugLogger.log(`Error cleaning up AI sessions: ${error}`);
    }
  }
}

// Export singleton instance
export const aiJobExtractor = new AIJobExtractor();
