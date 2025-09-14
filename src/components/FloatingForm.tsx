/* eslint-disable @typescript-eslint/no-explicit-any */
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
import styled from "@emotion/styled";

// Constants for this component - using build-time constants from Vite
const LOGIN_URL = __LOGIN_URL__;
const isDevelopment = __DEV__;

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
    // Keep full URL with all parameters
    return window.location.href;
  });

  // Validation state
  const [positionError, setPositionError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // AI extraction state
  const [isAiExtracting, setIsAiExtracting] = useState<boolean>(false);
  const [aiStatus, setAiStatus] = useState<
    "checking" | "available" | "unavailable"
  >("checking");
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

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

  // Check AI availability on form mount
  useEffect(() => {
    const checkAIAvailability = async () => {
      try {
        setAiStatus("checking");
        // Check if content AI extractor is available
        if (
          typeof window !== "undefined" &&
          (window as any).contentAIExtractor
        ) {
          const extractor = (window as any).contentAIExtractor;
          const availability = await extractor.checkAvailability();
          setAiStatus(availability.available ? "available" : "unavailable");
        } else {
          setAiStatus("unavailable");
        }
      } catch (error) {
        console.warn("Error checking AI availability:", error);
        setAiStatus("unavailable");
      }
    };

    checkAIAvailability();
  }, []);

  // Helper function to fill form with job data (supports partial updates)
  const fillFormWithJobData = useCallback(
    async (jobData: any, isPartial: boolean = false) => {
      try {
        console.log(
          "🤖 AI Debug: Starting form fill with data:",
          jobData,
          isPartial ? "(partial)" : "(complete)"
        );

        // Fill form fields only if AI found data (not "unknown")
        if (jobData.company && jobData.company !== "unknown") {
          console.log("🤖 AI Debug: Setting company name:", jobData.company);
          // Don't trigger expensive searchCompanies API call during auto-fill
          // Just set the company name directly for fast form filling
          setSelectedCompany({
            id: "",
            name: jobData.company,
            location: ""
          });
          // Update the input value to show the company name
          setCompanyInputValue(jobData.company);
        }

        if (jobData.position && jobData.position !== "unknown") {
          console.log("🤖 AI Debug: Setting position:", jobData.position);
          setPosition(jobData.position);
          setPositionError(null);
        }

        if (jobData.jobDescription && jobData.jobDescription !== "unknown") {
          console.log(
            "🤖 AI Debug: Setting job description (length:",
            jobData.jobDescription.length,
            ")"
          );
          setNotes(jobData.jobDescription);
        }

        if (!isPartial) {
          console.log("🤖 AI Debug: Form auto-filled successfully");
        } else {
          console.log(
            "🤖 AI Debug: Form partially filled (progressive update)"
          );
        }
      } catch (error) {
        console.error("🤖 AI Debug: Error filling form:", error);
      }
    },
    [
      setSelectedCompany,
      setPosition,
      setNotes,
      setCompanyInputValue,
      setPositionError
    ]
  ); // Dependencies for useCallback

  // AI auto-fill function
  const handleAiAutoFill = useCallback(async () => {
    if (isAiExtracting) {
      // Cancel extraction if already running
      if (abortController) {
        abortController.abort();

        // Handle cancellation for window messaging fallback
        if ((abortController as any).cancelMessage) {
          (abortController as any).cancelMessage();
        }

        // Handle cleanup for window messaging fallback
        if ((abortController as any).cleanup) {
          (abortController as any).cleanup();
        } else {
          setAbortController(null);
          setIsAiExtracting(false);
        }
      } else {
        setIsAiExtracting(false);
      }
      console.log("🤖 AI Debug: AI extraction cancelled by user");
      return;
    }

    setIsAiExtracting(true);
    const controller = new AbortController();
    setAbortController(controller);

    console.log("🤖 AI Debug: Starting manual AI extraction");

    try {
      // Extract page content
      const pageContent = {
        title: document.title,
        content: document.body.innerText,
        url: window.location.href,
        hostname: window.location.hostname
      };

      // Check if content AI extractor is directly available
      if (typeof window !== "undefined" && (window as any).contentAIExtractor) {
        console.log("🤖 AI Debug: Using direct AI extractor access");
        const extractor = (window as any).contentAIExtractor;

        try {
          // Use quick extraction method to leverage caching with progressive updates
          const jobData = await extractor.extractJobDataQuick(
            {
              force: true,
              source: "user-triggered",
              signal: controller.signal
            },
            (fieldName: string, data: string) => {
              // Progressive form filling - update form as each field is extracted
              console.log(
                `🚀 AI Debug: Progressive update for ${fieldName}: ${data.substring(
                  0,
                  50
                )}...`
              );

              // Use setTimeout to ensure each update is processed individually
              setTimeout(() => {
                const partialData = { [fieldName]: data };
                fillFormWithJobData(partialData, true);
              }, 0);
            }
          );

          console.log("🤖 AI Debug: AI extraction response:", jobData);
          await fillFormWithJobData(jobData, false); // Complete result

          // Reset extraction state after successful completion
          setIsAiExtracting(false);
          setAbortController(null);
          console.log("🤖 AI Debug: AI extraction completed successfully");
        } catch (extractionError) {
          if (
            extractionError instanceof Error &&
            extractionError.name === "AbortError"
          ) {
            console.log("🤖 AI Debug: Direct AI extraction was cancelled");
          } else {
            console.error(
              "🤖 AI Debug: Direct AI extraction failed:",
              extractionError
            );
          }
          // Reset state on error
          setIsAiExtracting(false);
          setAbortController(null);
          throw extractionError; // Re-throw to be caught by outer catch block
        }
      } else {
        console.log(
          "🤖 AI Debug: Content AI extractor not available, using window messaging"
        );
        // Fallback: use window messaging
        const requestId = Date.now().toString();
        window.postMessage(
          {
            type: "EXTRACT_JOB_DATA_INTERNAL",
            source: "floating-form",
            requestId,
            payload: { pageContent }
          },
          "*"
        );

        console.log("🤖 AI Debug: Posted message for AI extraction");

        // Store cleanup function in controller for cancellation
        const cleanup = () => {
          window.removeEventListener("message", handleMessage);
          setIsAiExtracting(false);
          setAbortController(null);
        };

        // Listen for response
        const handleMessage = (event: MessageEvent) => {
          if (
            event.data.type === "JOB_DATA_EXTRACTED_RESPONSE" &&
            event.data.source === "content-script" &&
            event.data.requestId === requestId
          ) {
            console.log("🤖 AI Debug: AI extraction response:", event.data);

            if (event.data.cancelled) {
              console.log("🤖 AI Debug: AI extraction was cancelled");
            } else if (event.data.success && event.data.data) {
              fillFormWithJobData(event.data.data, false);
            } else {
              console.log(
                "🤖 AI Debug: No job data extracted or extraction failed"
              );
            }

            cleanup();
          }
        };

        window.addEventListener("message", handleMessage);

        // Store cleanup and cancellation functions for abort controller
        (controller as any).cleanup = cleanup;
        (controller as any).cancelMessage = () => {
          window.postMessage(
            {
              type: "CANCEL_EXTRACTION",
              source: "floating-form",
              requestId
            },
            "*"
          );
        };

        // Cleanup after timeout
        setTimeout(() => {
          if (isAiExtracting) {
            cleanup();
          }
        }, 15000);

        return; // Exit early for messaging approach
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.log("🤖 AI Debug: AI extraction was cancelled");
      } else {
        console.error("🤖 AI Debug: AI auto-fill failed:", error);
      }
    } finally {
      if (isAiExtracting) {
        setIsAiExtracting(false);
        setAbortController(null);
      }
    }
  }, [
    isAiExtracting,
    abortController,
    setIsAiExtracting,
    setAbortController,
    fillFormWithJobData
  ]); // Dependencies for useCallback

  // Auto-trigger AI extraction on form mount - DISABLED to prevent background CPU usage
  // This useEffect has been commented out to only perform extraction when explicitly requested by user
  /*
  useEffect(() => {
    const performAutoExtraction = async () => {
      // Don't auto-fill if already done
      if (hasBeenAutoFilled) {
        console.log("🚫 AI Debug: Form already auto-filled, skipping");
        return;
      }

      // Check if we already have pre-extracted data first
      const preExtracted =
        window.preExtractedJobDataCache?.[window.location.href];
      if (preExtracted) {
        console.log(
          "🚀 AI Debug: Pre-extracted data available, using it immediately"
        );
        setIsAiExtracting(true);
        setHasBeenAutoFilled(true);
        await fillFormWithJobData(preExtracted.data, false);
        setIsAiExtracting(false);
        console.log("🚀 AI Debug: Form filled with pre-extracted data");
        return;
      }

      // Check if extraction is already in progress - wait for it
      const extractionInProgress = window.extractionInProgress;
      if (extractionInProgress) {
        console.log(
          "🚀 AI Debug: Extraction in progress on form mount, waiting for it"
        );
        setIsAiExtracting(true);
        try {
          const jobData = await extractionInProgress;
          console.log(
            "🚀 AI Debug: Using data from ongoing extraction on form mount"
          );
          setHasBeenAutoFilled(true);
          await fillFormWithJobData(jobData, false);
          setIsAiExtracting(false);
          return;
        } catch (error) {
          console.log(
            "🚀 AI Debug: Ongoing extraction failed on form mount:",
            error
          );
          setIsAiExtracting(false);
          // Don't start new extraction here, let user trigger manually if needed
          return;
        }
      }

      // Only trigger live extraction if no pre-extracted data and nothing in progress
      console.log(
        "🤖 AI Debug: No pre-extracted data, auto-triggering live AI extraction"
      );
      handleAiAutoFill();
    };

    performAutoExtraction();
  }, [fillFormWithJobData, handleAiAutoFill, hasBeenAutoFilled]); // Dependencies included
  */

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

  // Reset auto-fill state when URL changes
  useEffect(() => {
    const currentUrl = window.location.href;
    const handleUrlChange = () => {
      if (window.location.href !== currentUrl) {
        console.log("🔄 AI Debug: URL changed, resetting auto-fill state");
        // setHasBeenAutoFilled(false); // Commented out since AI extraction is disabled
      }
    };

    // Listen for navigation events
    window.addEventListener("popstate", handleUrlChange);
    const observer = new MutationObserver(() => {
      if (window.location.href !== currentUrl) {
        handleUrlChange();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("popstate", handleUrlChange);
      observer.disconnect();
    };
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
        setJobUrl(window.location.href);
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
              inputValue={companyInputValue}
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

        {/* AI Status and Auto-fill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            padding: "8px",
            borderRadius: "6px",
            backgroundColor: COLORS.BACKGROUND_SECONDARY,
            fontSize: "12px"
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor:
                aiStatus === "available"
                  ? COLORS.SUCCESS
                  : aiStatus === "checking"
                  ? COLORS.WARNING_BORDER
                  : COLORS.GRAY_400
            }}
          />
          <span>
            AI Auto-fill:{" "}
            {aiStatus === "checking"
              ? "Checking..."
              : aiStatus === "available"
              ? "Available"
              : "Not available"}
          </span>
          {aiStatus === "available" && (
            <button
              type="button"
              onClick={() => {
                handleAiAutoFill().catch(error => {
                  // This catch block ensures no unhandled promise rejections
                  // The error is already handled inside handleAiAutoFill, this is just a safety net
                  if (error instanceof Error && error.name === "AbortError") {
                    console.log(
                      "🤖 AI Debug: Button click handler caught AbortError (already handled)"
                    );
                  } else {
                    console.error(
                      "🤖 AI Debug: Button click handler caught unexpected error:",
                      error
                    );
                  }
                });
              }}
              disabled={false}
              style={{
                background: isAiExtracting
                  ? "linear-gradient(135deg, #dc2626, #b91c1c)"
                  : "linear-gradient(135deg, #10b981, #059669)",
                color: "white",
                border: "none",
                padding: "6px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px"
              }}
            >
              <span>🤖</span>
              {isAiExtracting ? "Cancel" : "Auto-fill"}
            </button>
          )}
        </div>

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
            {isLoading ? "Creating..." : "Add New"}
          </FormButton>
        </FormButtonContainer>
      </form>
    </FormContainer>
  );
}
