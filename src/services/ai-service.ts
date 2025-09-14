// AI Service for job information extraction using Google Gemini API
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface JobInformation {
  companyName: string;
  positionTitle: string;
  jobDescription: string;
}

export interface AIExtractionResult {
  success: boolean;
  data?: JobInformation;
  error?: string;
}

/**
 * AI Service class for extracting job information from web pages
 * Uses Google Gemini API to parse page content and extract structured data
 */
export class AIService {
  private static genAI: GoogleGenerativeAI | null = null;
  private static isInitialized = false;

  /**
   * Initialize the AI service with API key
   */
  static async initialize(): Promise<boolean> {
    try {
      // Try to get API key from Chrome storage
      const result = await chrome.storage.local.get(['geminiApiKey']);
      const apiKey = result.geminiApiKey;

      if (!apiKey) {
        console.warn('⚠️ Gemini API key not found in storage');
        return false;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.isInitialized = true;
      console.info('✅ AI Service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize AI Service:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Check if AI service is ready to use
   */
  static isReady(): boolean {
    return this.isInitialized && this.genAI !== null;
  }

  /**
   * Set the Gemini API key and initialize the service
   */
  static async setApiKey(apiKey: string): Promise<boolean> {
    try {
      await chrome.storage.local.set({ geminiApiKey: apiKey });
      return await this.initialize();
    } catch (error) {
      console.error('❌ Failed to set API key:', error);
      return false;
    }
  }

  /**
   * Extract page content for AI analysis
   */
  private static extractPageContent(): string {
    try {
      // Remove script and style elements
      const scripts = document.querySelectorAll('script, style, noscript');
      scripts.forEach(el => el.remove());

      // Get main content areas
      const contentSelectors = [
        'main',
        '[role="main"]',
        '.job-description',
        '.job-details',
        '.job-content',
        '.posting-description',
        'article',
        '.content',
        'body'
      ];

      let content = '';
      
      for (const selector of contentSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          content = element.textContent || (element as HTMLElement).innerText || '';
          if (content.trim().length > 100) {
            break;
          }
        }
      }

      // Fallback to body if no specific content found
      if (!content.trim()) {
        content = document.body.textContent || (document.body as HTMLElement).innerText || '';
      }

      // Clean up the content
      content = content
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
        .trim();

      // Limit content length to avoid token limits
      if (content.length > 8000) {
        content = content.substring(0, 8000) + '...';
      }

      console.info('📄 Extracted page content length:', content.length);
      return content;
    } catch (error) {
      console.error('❌ Failed to extract page content:', error);
      return '';
    }
  }

  /**
   * Create extraction prompt for Gemini
   */
  private static createExtractionPrompt(content: string): string {
    return `Please analyze the following web page content and extract job-related information. 
Return the information EXACTLY as it appears on the page, without any modifications or reformatting.

Extract the following information:
1. Company/Hiring Company Name
2. Position/Job Title 
3. Full Job Description (including requirements, responsibilities, etc.)

Web page content:
${content}

Please respond in the following JSON format:
{
  "companyName": "exact company name as it appears on the page",
  "positionTitle": "exact position title as it appears on the page", 
  "jobDescription": "complete job description as it appears on the page"
}

If any information is not found, use an empty string for that field. 
Do not make up or infer information that is not explicitly present.`;
  }

  /**
   * Extract job information from current page using AI
   */
  static async extractJobInformation(): Promise<AIExtractionResult> {
    console.info('🤖 Starting AI job information extraction...');

    if (!this.isReady()) {
      const initSuccess = await this.initialize();
      if (!initSuccess) {
        const error = 'AI Service not initialized. Please provide a valid Gemini API key.';
        console.error('❌', error);
        return { success: false, error };
      }
    }

    try {
      // Extract page content
      const pageContent = this.extractPageContent();
      if (!pageContent.trim()) {
        const error = 'No content found on the page to analyze';
        console.error('❌', error);
        return { success: false, error };
      }

      // Create the model instance
      const model = this.genAI!.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Create extraction prompt
      const prompt = this.createExtractionPrompt(pageContent);
      console.info('🔍 Sending extraction request to Gemini...');

      // Generate content
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.info('🤖 AI Response received:', text);

      // Parse the JSON response
      try {
        // Clean the response text to extract JSON
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }

        const jobInfo: JobInformation = JSON.parse(jsonMatch[0]);
        
        // Validate required fields
        if (typeof jobInfo.companyName !== 'string' || 
            typeof jobInfo.positionTitle !== 'string' || 
            typeof jobInfo.jobDescription !== 'string') {
          throw new Error('Invalid response format');
        }

        console.info('✅ Successfully extracted job information:', {
          companyName: jobInfo.companyName.substring(0, 50) + '...',
          positionTitle: jobInfo.positionTitle.substring(0, 50) + '...',
          descriptionLength: jobInfo.jobDescription.length
        });

        return {
          success: true,
          data: jobInfo
        };

      } catch (parseError) {
        const error = `Failed to parse AI response: ${parseError}`;
        console.error('❌', error);
        console.error('Raw response:', text);
        return { success: false, error };
      }

    } catch (error) {
      const errorMessage = `AI extraction failed: ${error}`;
      console.error('❌', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get API key status for debugging
   */
  static async getApiKeyStatus(): Promise<{ hasKey: boolean; isInitialized: boolean }> {
    try {
      const result = await chrome.storage.local.get(['geminiApiKey']);
      return {
        hasKey: !!result.geminiApiKey,
        isInitialized: this.isInitialized
      };
    } catch (error) {
      console.error('Failed to check API key status:', error);
      return { hasKey: false, isInitialized: false };
    }
  }
}