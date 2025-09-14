// Enhanced FloatingForm matching dashboard AddNewApplication functionality
import React, { useState, useEffect, useCallback } from "react";
import { JobTrackerAPI } from "../services/job-tracker-api";
import {
  FormContainer,
  DragHandle,
  DragHandleTitle,
  DragHandleIcon,
  AuthStatusIcon,
  WarningMessage,
  ErrorMessage,
  FormInput,
  FormButtonContainer,
  FormButton
} from "../styles/FloatingForm.styles";
import { CompanyAutocomplete, StageSelect } from "./FormComponents";
import {
  useCachedCompanySearch,
  useGetStages,
  useCreateJobApplication
} from "../hooks/useDashboardFeatures";
import { sanitizeInput } from "../utils/validation";
import { BackgroundGraphQLClient } from "../utils/graphql-client";
import { COLORS, SHADOWS } from "../constants/colors";
import { AIService, type JobInformation } from "../services/ai-service";
import AISettings from "./AISettings";
import styled from "@emotion/styled";

// Constants for this component - using build-time constants from Vite
const LOGIN_URL = __LOGIN_URL__;
const isDevelopment = __DEV__;

// Utility function to clean URLs by removing all query parameters
const cleanJobUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove all query parameters (everything after ?)
    urlObj.search = "";
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, manually remove everything after ?
    console.warn("Failed to parse URL, using fallback method:", url, error);
    const questionMarkIndex = url.indexOf("?");
    return questionMarkIndex !== -1 ? url.substring(0, questionMarkIndex) : url;
  }
};

// Enhanced styled components
const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
`;

const FormLabel = styled.label`
  font-size: 13px;
  font-weight: 500;
  color: ${COLORS.GRAY_700};
  margin-bottom: 4px;
`;

const FormColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 2px solid ${COLORS.INPUT_BORDER};
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background-color: ${COLORS.BACKGROUND_PRIMARY};
  color: ${COLORS.TEXT_PRIMARY};
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${COLORS.INPUT_BORDER_FOCUS};
    box-shadow: ${SHADOWS.INPUT_FOCUS_PRIMARY};
    background-color: ${COLORS.BACKGROUND_PRIMARY};
  }

  &::placeholder {
    color: ${COLORS.GRAY_400};
  }
`;

const RequiredIndicator = styled.span`
  color: ${COLORS.ERROR};
  margin-left: 2px;
`;

const AIButton = styled.button`
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
  box-shadow: ${SHADOWS.BUTTON};

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: ${SHADOWS.BUTTON_HOVER};
  }

  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .ai-icon {
    font-size: 14px;
  }
`;

// Enable development mode for better debugging
declare global {
  interface Window {
    __DEV_GRAPHQL__: boolean;
  }
}

// Dev mode configuration (enable debug logging)
if (typeof window !== "undefined") {
  window.__DEV_GRAPHQL__ = true; // Force enable for debugging
  if (window.__DEV_GRAPHQL__) {
    BackgroundGraphQLClient.enableDevMode(true);
    console.log("🔧 Debug mode enabled for form");
  }
}

interface EnhancedFloatingFormProps {
  onCancel: () => void;
  onDrag: (e: React.MouseEvent<HTMLDivElement>) => void;
  style: React.CSSProperties;
}

export default function FloatingForm({
  onCancel,
  onDrag,
  style
}: EnhancedFloatingFormProps) {
  const formRef = React.useRef<HTMLDivElement>(null);

  // Form state
  const [position, setPosition] = useState("");
  const [notes, setNotes] = useState("");
  const [salary, setSalary] = useState<number | "">("");
  const [jobUrl, setJobUrl] = useState(() => {
    // Remove tracking parameters from URL for cleaner job links
    return cleanJobUrl(window.location.href);
  });

  // Validation state
  const [positionError, setPositionError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // AI extraction state
  const [isExtractingAI, setIsExtractingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showAISettings, setShowAISettings] = useState(false);
  const [aiReady, setAiReady] = useState(false);

  // Enhanced hooks for dashboard functionality
  const {
    companies,
    loading: companiesLoading,
    error: companiesError,
    searchCompanies,
    selectedCompany,
    setSelectedCompany,
    clearSearch
  } = useCachedCompanySearch();

  const { stages, loading: stagesLoading, error: stagesError } = useGetStages();

  const [selectedStageId, setSelectedStageId] = useState<string>("");
  const [companyInputValue, setCompanyInputValue] = useState<string>("");

  const {
    createApplication,
    loading: createLoading,
    error: createError
  } = useCreateJobApplication();

  // Set default stage to first element when stages are loaded
  useEffect(() => {
    if (stages?.length > 0 && !selectedStageId) {
      setSelectedStageId(stages[0].id);
    }
  }, [stages, selectedStageId]);

  // Auth state monitoring
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const result = await chrome.storage.local.get(["isAuthenticated"]);
        setIsAuthenticated(result.isAuthenticated ?? true);
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuthState();

    // Listen for auth changes
    const handleStorageChange = (changes: {
      [key: string]: chrome.storage.StorageChange;
    }) => {
      if (changes.isAuthenticated) {
        setIsAuthenticated(changes.isAuthenticated.newValue ?? false);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Auto-fill position from page content
  useEffect(() => {
    // Try to extract job title from the current page
    const extractJobTitle = () => {
      const selectors = [
        'h1[data-testid="job-title"]',
        ".job-title",
        "h1.jobsearch-JobInfoHeader-title",
        'h1[class*="jobTitle"]',
        'h1[class*="job-title"]',
        'h1:contains("developer"):first',
        'h1:contains("engineer"):first'
      ];

      for (const selector of selectors) {
        try {
          const element = document.querySelector(selector);
          if (element?.textContent?.trim()) {
            return element.textContent.trim();
          }
        } catch {
          // Continue with next selector
        }
      }

      return "";
    };

    const detectedPosition = extractJobTitle();
    if (detectedPosition && !position) {
      setPosition(detectedPosition);
    }
  }, [position]);

  // Auto-fill company from hostname
  useEffect(() => {
    if (!selectedCompany) {
      const hostname = window.location.hostname.replace("www.", "");
      const companyName = hostname.split(".")[0];

      if (companyName) {
        // Search for the company
        searchCompanies(companyName);
      }
    }
  }, [selectedCompany, searchCompanies]);

  // Check AI service status on mount
  useEffect(() => {
    const checkAIStatus = async () => {
      const status = await AIService.getApiKeyStatus();
      setAiReady(status.hasKey && status.isInitialized);
      if (!status.hasKey) {
        setShowAISettings(true);
      }
    };
    checkAIStatus();
  }, []);

  // Handle Escape key press to close the form
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    // Add event listener to document
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup event listener on component unmount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onCancel]);

  const validateForm = useCallback(() => {
    let isValid = true;

    // Validate position (required)
    if (!position.trim()) {
      setPositionError("Position is required");
      isValid = false;
    } else {
      setPositionError(null);
    }

    return isValid;
  }, [position]);

  const handleAIExtraction = async () => {
    console.info('🤖 Starting AI extraction process...');
    setIsExtractingAI(true);
    setAiError(null);

    try {
      const result = await AIService.extractJobInformation();
      
      if (result.success && result.data) {
        const jobInfo: JobInformation = result.data;
        
        console.info('✅ AI extraction successful:', jobInfo);
        
        // Auto-fill form fields with AI extracted data
        if (jobInfo.positionTitle && !position) {
          setPosition(jobInfo.positionTitle);
        }
        
        if (jobInfo.jobDescription && !notes) {
          setNotes(jobInfo.jobDescription);
        }
        
        if (jobInfo.companyName && !selectedCompany && !companyInputValue) {
          setCompanyInputValue(jobInfo.companyName);
          // Also search for this company in the database
          searchCompanies(jobInfo.companyName);
        }
        
        console.info('📝 Form fields populated with AI data');
      } else {
        setAiError(result.error || 'AI extraction failed');
        console.error('❌ AI extraction failed:', result.error);
      }
    } catch (error) {
      const errorMessage = `AI extraction error: ${error}`;
      setAiError(errorMessage);
      console.error('❌', errorMessage);
    } finally {
      setIsExtractingAI(false);
    }
  };

  const handleSetApiKey = async () => {
    // This function is now handled by the AISettings component
    const status = await AIService.getApiKeyStatus();
    setAiReady(status.hasKey && status.isInitialized);
    setShowAISettings(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitError(null);

    try {
      // First, get the current job search ID
      const jobSearchId = await JobTrackerAPI.getLastJobSearch();
      if (!jobSearchId) {
        setSubmitError(
          "No active job search found. Please create a job search first in the dashboard."
        );
        return;
      }

      const companyName =
        companyInputValue || window.location.hostname.replace("www.", "");
      console.log("🏢 Company debug:", {
        selectedCompany,
        companyInputValue,
        hostname: window.location.hostname,
        finalCompanyName: companyName
      });

      const applicationData = {
        positionTitle: sanitizeInput(position),
        currentStageId: selectedStageId || stages[0]?.id || "applied", // Use first stage as default
        company: selectedCompany
          ? {
              existingCompanyId: selectedCompany.id
            }
          : {
              newCompany: {
                name: sanitizeInput(companyName)
              }
            },
        jobLinks: [jobUrl.trim()],
        jobSearchId,
        jobDescription: notes.trim() || undefined,
        salary: salary || undefined
      };

      const success = await createApplication(applicationData);

      if (success) {
        console.log("✅ Job application created successfully");

        // Reset form
        setPosition("");
        setNotes("");
        setSalary("");
        setJobUrl(cleanJobUrl(window.location.href));
        setSelectedCompany(null);
        setCompanyInputValue("");
        clearSearch();

        // Close form after short delay to show success
        setTimeout(() => onCancel(), 1000);
      } else {
        setSubmitError(createError || "Failed to create job application");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    }
  };

  const isLoading = createLoading || stagesLoading;
  const hasErrors = companiesError || stagesError || createError;

  return (
    <FormContainer ref={formRef} style={style} data-interactive>
      {/* Drag Handle */}
      <DragHandle onMouseDown={onDrag}>
        <DragHandleTitle>
          Add Job Application
          <AuthStatusIcon isAuthenticated={isAuthenticated}>
            {isAuthenticated ? "🔐" : "🔓"}
          </AuthStatusIcon>
        </DragHandleTitle>
        <DragHandleIcon>⋯</DragHandleIcon>
      </DragHandle>

      {/* Warning for unauthenticated users */}
      {!isAuthenticated && (
        <WarningMessage>
          ⚠️ Authentication required.{" "}
          <a href={LOGIN_URL} target="_blank" rel="noopener noreferrer">
            Please log in.
          </a>
          {isDevelopment && (
            <div style={{ fontSize: "10px", opacity: 0.7, marginTop: "4px" }}>
              Dev Mode: {LOGIN_URL}
            </div>
          )}
        </WarningMessage>
      )}

      {/* AI Settings */}
      {showAISettings && (
        <AISettings onClose={handleSetApiKey} />
      )}

      {/* AI Extraction Button */}
      {!showAISettings && (
        <AIButton 
          onClick={handleAIExtraction} 
          disabled={isExtractingAI || !aiReady}
          type="button"
        >
          <span className="ai-icon">🤖</span>
          {isExtractingAI ? 'Extracting with AI...' : 'Extract Job Info with AI'}
          {!aiReady && <span style={{ fontSize: '10px', marginLeft: '4px' }}>(Configure AI first)</span>}
        </AIButton>
      )}

      {/* AI Settings Toggle */}
      {!showAISettings && (
        <div style={{ textAlign: 'right', marginBottom: '12px' }}>
          <button
            onClick={() => setShowAISettings(true)}
            style={{
              background: 'none',
              border: 'none',
              color: COLORS.GRAY_500,
              fontSize: '10px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ⚙️ AI Settings
          </button>
        </div>
      )}

      {/* AI Error Display */}
      {aiError && (
        <ErrorMessage>
          AI Error: {aiError}
          {aiError.includes('API key') && (
            <button 
              onClick={() => setShowAISettings(true)}
              style={{
                marginLeft: '8px',
                background: 'none',
                border: 'none',
                color: 'inherit',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'inherit'
              }}
            >
              Configure AI
            </button>
          )}
        </ErrorMessage>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <FormSection>
          {/* Company Search */}
          <FormColumn>
            <FormLabel>Company</FormLabel>
            <CompanyAutocomplete
              companies={companies}
              loading={companiesLoading}
              onSearch={searchCompanies}
              onSelect={setSelectedCompany}
              onInputChange={setCompanyInputValue}
              selectedCompany={selectedCompany}
              placeholder="Search companies or add new..."
            />
            {companiesError && <ErrorMessage>{companiesError}</ErrorMessage>}
          </FormColumn>

          {/* Position Field */}
          <FormColumn>
            <FormLabel>
              Position <RequiredIndicator>*</RequiredIndicator>
            </FormLabel>
            <FormInput
              type="text"
              value={position}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setPosition(e.target.value);
                if (positionError) setPositionError(null);
              }}
              placeholder="e.g. Frontend Developer"
              required
            />
            {positionError && <ErrorMessage>{positionError}</ErrorMessage>}
          </FormColumn>

          {/* Stage Selection */}
          <FormColumn>
            <FormLabel>Stage</FormLabel>
            <StageSelect
              stages={stages}
              selectedStageId={selectedStageId}
              onSelect={setSelectedStageId}
              loading={stagesLoading}
              placeholder="Select application stage..."
            />
            {stagesError && <ErrorMessage>{stagesError}</ErrorMessage>}
          </FormColumn>

          {/* Job URL */}
          <FormColumn>
            <FormLabel>Job URL</FormLabel>
            <FormInput
              type="url"
              value={jobUrl}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setJobUrl(e.target.value)
              }
              placeholder="https://..."
            />
          </FormColumn>

          {/* Salary */}
          <FormColumn>
            <FormLabel>Salary</FormLabel>
            <FormInput
              type="number"
              min="0"
              value={salary}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const value = e.target.value;
                if (value === "") {
                  setSalary("");
                } else {
                  const numValue = parseInt(value, 10);
                  // Validate the number is positive and reasonable
                  if (
                    !isNaN(numValue) &&
                    numValue >= 0 &&
                    numValue <= 10000000
                  ) {
                    setSalary(numValue);
                  }
                }
              }}
              placeholder="e.g., 80000"
            />
          </FormColumn>

          {/* Notes */}
          <FormColumn>
            <FormLabel>Job Description</FormLabel>
            <TextArea
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setNotes(e.target.value)
              }
              placeholder="Job description and requirements..."
            />
          </FormColumn>
        </FormSection>

        {/* Error Messages */}
        {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
        {hasErrors && (
          <WarningMessage>
            Some features may not work properly due to connection issues.
          </WarningMessage>
        )}

        {/* Form Buttons */}
        <FormButtonContainer>
          <FormButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </FormButton>
          <FormButton
            type="submit"
            variant="primary"
            disabled={isLoading || !isAuthenticated}
          >
            {isLoading ? "Creating..." : "Create Application"}
          </FormButton>
        </FormButtonContainer>
      </form>
    </FormContainer>
  );
}
