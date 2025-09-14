// Content extraction script for job pages
// Simplified version without external dependencies

export interface ExtractedPageContent {
  title: string;
  content: string;
  url: string;
  hostname: string;
  textContent: string;
  length: number;
}

/**
 * Extract clean, readable content from the current page
 */
export function extractPageContent(): ExtractedPageContent {
  const url = window.location.href;
  const hostname = window.location.hostname;

  // Get page title
  const title = document.title || "Untitled Page";

  // Extract clean content
  const content = extractCleanContent();

  return {
    title,
    content: content,
    url,
    hostname,
    textContent: content,
    length: content.length
  };
}

/**
 * Extract clean content from the page
 */
function extractCleanContent(): string {
  // Try to find main content areas (common job board patterns)
  const contentSelectors = [
    "main",
    '[role="main"]',
    ".job-description",
    ".job-details",
    ".posting-details",
    ".job-content",
    ".description",
    ".content",
    "article",
    "#job-description",
    "#description",
    ".job-post",
    ".listing-details"
  ];

  let content = "";

  // Try each selector to find the best content area
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      content = getElementText(element);
      if (content.length > 100) {
        // Only use if substantial content
        break;
      }
    }
  }

  // If no good content found, use body but clean it up
  if (content.length < 100) {
    content = extractFromBody();
  }

  // Clean up the content
  content = content
    .replace(/\s+/g, " ") // Multiple spaces to single space
    .replace(/\n\s*\n/g, "\n") // Multiple newlines to single newline
    .trim();

  return content;
}

/**
 * Get clean text from an element
 */
function getElementText(element: Element): string {
  return element.textContent || "";
}

/**
 * Extract content from body with cleanup
 */
function extractFromBody(): string {
  const bodyClone = document.body.cloneNode(true) as HTMLElement;

  // Remove common unwanted elements
  const unwantedSelectors = [
    "script",
    "style",
    "nav",
    "header",
    "footer",
    "aside",
    ".advertisement",
    ".ads",
    "#ads",
    '[class*="ad-"]',
    '[id*="ad-"]',
    ".cookie-banner",
    ".newsletter",
    ".social-share",
    ".sidebar",
    ".comments",
    ".related-posts",
    ".footer",
    ".header"
  ];

  unwantedSelectors.forEach(selector => {
    const elements = bodyClone.querySelectorAll(selector);
    elements.forEach(el => el.remove());
  });

  return bodyClone.textContent || "";
}

/**
 * Check if current page appears to be a job posting
 */
export function isJobPostingPage(): boolean {
  const url = window.location.href.toLowerCase();
  const title = document.title.toLowerCase();
  const content = document.body.textContent?.toLowerCase() || "";

  // URL-based detection
  const jobUrlPatterns = [
    /jobs?\/|career/,
    /linkedin\.com\/jobs/,
    /indeed\.com\/viewjob/,
    /glassdoor\.com\/job/,
    /monster\.com\/job/,
    /ziprecruiter\.com\/jobs/,
    /careerbuilder\.com\/job/,
    /lever\.co\/|greenhouse\.io\/|workday\.com/,
    /apply\.workable\.com/,
    /boards\.greenhouse\.io/,
    /recruiting\.ultipro\.com/,
    /careers\.|job-board/
  ];

  const hasJobUrl = jobUrlPatterns.some(pattern => pattern.test(url));

  // Content-based detection
  const jobKeywords = [
    "job description",
    "responsibilities",
    "requirements",
    "qualifications",
    "apply now",
    "salary",
    "compensation",
    "benefits",
    "remote",
    "full-time",
    "part-time",
    "contract",
    "internship",
    "employment",
    "position",
    "role"
  ];

  const jobKeywordCount = jobKeywords.reduce((count, keyword) => {
    return content.includes(keyword) ? count + 1 : count;
  }, 0);

  // Title-based detection
  const jobTitlePatterns = [
    /job|career|position|role|opening|opportunity/,
    /hiring|recruiting|apply/,
    /software engineer|developer|manager|analyst|designer/
  ];

  const hasJobTitle = jobTitlePatterns.some(pattern => pattern.test(title));

  // Return true if multiple indicators suggest this is a job page
  return hasJobUrl || jobKeywordCount >= 3 || hasJobTitle;
}
