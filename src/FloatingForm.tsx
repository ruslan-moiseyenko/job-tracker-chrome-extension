import React from "react";
import { JobApplicationService } from "./services/legacy-adapter";
import {
  FormContainer,
  DragHandle,
  DragHandleTitle,
  DragHandleIcon,
  AuthStatusIcon,
  WarningMessage,
  ErrorMessage,
  ValidationError,
  FormInput,
  FormButtonContainer,
  FormButton
} from "./styles/FloatingForm.styles";
import { validateName, sanitizeInput } from "./utils/validation";
import { BackgroundGraphQLClient } from "./utils/graphql-client";
import { useThemeColors } from "./hooks/useThemeColors";

// Enable development mode for better debugging in development
declare global {
  interface Window {
    __DEV_GRAPHQL__: boolean;
  }
}

if (typeof window !== "undefined") {
  // Simple development detection for Chrome Extension
  window.__DEV_GRAPHQL__ = true; // Set to false in production

  if (window.__DEV_GRAPHQL__) {
    BackgroundGraphQLClient.enableDevMode(true);
  }
}

interface FloatingFormProps {
  onCancel: () => void;
  onDrag?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}

export default function FloatingForm({ onCancel, onDrag, style }: FloatingFormProps) {
  const formRef = React.useRef<HTMLDivElement>(null);
  const [name, setName] = React.useState("");
  const [surname, setSurname] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [nameErrors, setNameErrors] = React.useState<string[]>([]);
  const [surnameErrors, setSurnameErrors] = React.useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(true);

  const colors = useThemeColors();

  // Auth state monitoring based on research recommendations
  React.useEffect(() => {
    // Check initial auth state from storage
    const checkAuthState = async () => {
      try {
        const result = await chrome.storage.local.get(["isAuthenticated"]);
        setIsAuthenticated(result.isAuthenticated ?? true);
      } catch (error) {
        console.error("Failed to check auth state:", error);
      }
    };

    checkAuthState();

    // Listen for storage changes (auth state updates)
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.isAuthenticated) {
        setIsAuthenticated(changes.isAuthenticated.newValue ?? true);
      }
    };

    // Listen for messages from service worker (auth state changes)
    const handleMessage = (message: { type: string; isAuthenticated?: boolean }) => {
      if (message.type === "AUTH_LOGIN" || message.type === "AUTH_LOGOUT") {
        setIsAuthenticated(message.isAuthenticated ?? message.type === "AUTH_LOGIN");
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);

    // Validate on change
    const validation = validateName(value);
    setNameErrors(validation.errors);
  };

  const handleSurnameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSurname(value);

    // Validate on change
    const validation = validateName(value);
    setSurnameErrors(validation.errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final validation before submission
    const nameValidation = validateName(name);
    const surnameValidation = validateName(surname);

    setNameErrors(nameValidation.errors);
    setSurnameErrors(surnameValidation.errors);

    if (!nameValidation.isValid || !surnameValidation.isValid) {
      return; // Don't submit if validation fails
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Создаем Job Application через Background Service Worker
      const jobApplicationData = {
        name: sanitizeInput(name),
        surname: sanitizeInput(surname),
        position: sanitizeInput(position) || "Software Developer", // Default position
        company: sanitizeInput(company) || window.location.hostname // Current site as company
      };

      const response = await JobApplicationService.createApplication(jobApplicationData);

      if (response.success) {
        console.log("Job application created:", response.data);
        onCancel(); // Close form on success
      } else {
        setSubmitError(response.error || "Failed to create job application");
      }
    } catch (error) {
      console.error("Submit error:", error);

      // More helpful error messages
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("<!doctype") || errorMessage.includes("not valid JSON")) {
        setSubmitError("⚠️ API Configuration Error: The GraphQL endpoint is not properly configured. " + "Please check your background service worker API_ENDPOINT setting.");
      } else if (errorMessage.includes("Network error") || errorMessage.includes("fetch")) {
        setSubmitError("🌐 Network Error: Cannot connect to the API server. " + "Please check your internet connection and API endpoint.");
      } else {
        setSubmitError(`❌ Error: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormContainer ref={formRef} style={style} data-interactive>
      {/* Drag Handle */}
      <DragHandle onMouseDown={onDrag}>
        <DragHandleTitle>
          Job Application
          <AuthStatusIcon isAuthenticated={isAuthenticated}>{isAuthenticated ? "🔐" : "🔓"}</AuthStatusIcon>
        </DragHandleTitle>
        <DragHandleIcon>⋯</DragHandleIcon>
      </DragHandle>

      {/* Auth Warning */}
      {!isAuthenticated && <WarningMessage>⚠️ Authentication required. Please log in to your account.</WarningMessage>}

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <div>
          <FormInput
            type="text"
            placeholder="Name"
            value={name}
            onChange={handleNameChange}
            style={{
              borderColor: nameErrors.length > 0 ? colors.ERROR : undefined
            }}
          />
          {nameErrors.length > 0 && <ValidationError>{nameErrors[0]}</ValidationError>}
        </div>
        <div>
          <FormInput
            type="text"
            placeholder="Surname"
            value={surname}
            onChange={handleSurnameChange}
            style={{
              borderColor: surnameErrors.length > 0 ? colors.ERROR : undefined
            }}
          />
          {surnameErrors.length > 0 && <ValidationError>{surnameErrors[0]}</ValidationError>}
        </div>
        <div>
          <FormInput type="text" placeholder="Position (e.g. Frontend Developer)" value={position} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPosition(e.target.value)} />
        </div>
        <div>
          <FormInput type="text" placeholder="Company" value={company} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCompany(e.target.value)} />
        </div>
        {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
        <FormButtonContainer>
          <FormButton type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </FormButton>
          <FormButton type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </FormButton>
        </FormButtonContainer>
      </form>
    </FormContainer>
  );
}
