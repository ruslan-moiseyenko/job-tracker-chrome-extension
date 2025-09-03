// Input validation utilities
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Sanitize input to remove potentially dangerous characters
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove angle brackets
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .substring(0, 255); // Limit length
};

// Validate name fields
export const validateName = (name: string): ValidationResult => {
  const errors: string[] = [];
  const sanitized = sanitizeInput(name);

  if (!sanitized) {
    errors.push("Name is required");
  }

  if (sanitized.length < 2) {
    errors.push("Name must be at least 2 characters");
  }

  if (sanitized.length > 50) {
    errors.push("Name must be less than 50 characters");
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  if (!/^[a-zA-Z\s\-']+$/.test(sanitized)) {
    errors.push("Name contains invalid characters");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate email
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  const sanitized = sanitizeInput(email);

  if (!sanitized) {
    errors.push("Email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (sanitized && !emailRegex.test(sanitized)) {
    errors.push("Invalid email format");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// General text field validation
export const validateTextField = (
  value: string,
  fieldName: string,
  maxLength: number = 255
): ValidationResult => {
  const errors: string[] = [];
  const sanitized = sanitizeInput(value);

  if (sanitized.length > maxLength) {
    errors.push(`${fieldName} must be less than ${maxLength} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
