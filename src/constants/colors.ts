// Color theme variables for easy customization
export const COLORS = {
  // Primary colors
  PRIMARY: "#2563eb",
  PRIMARY_HOVER: "#1d4ed8",

  // Neutral colors
  WHITE: "#ffffff",
  GRAY_100: "#f3f4f6",
  GRAY_200: "#e5e7eb",
  GRAY_300: "#d1d5db",
  GRAY_400: "#9ca3af",
  GRAY_500: "#6b7280",
  GRAY_600: "#4b5563",
  GRAY_700: "#374151",
  GRAY_800: "#1f2937",
  GRAY_900: "#111827",

  // Shadow colors
  SHADOW_LIGHT: "rgba(0, 0, 0, 0.05)",
  SHADOW_MEDIUM: "rgba(0, 0, 0, 0.1)",
  SHADOW_DARK: "rgba(0, 0, 0, 0.25)",

  // Background colors
  BACKGROUND_PRIMARY: "#ffffff",
  BACKGROUND_SECONDARY: "#f9fafb",

  // Text colors (referencing base colors where appropriate)
  TEXT_PRIMARY: "#111827",
  TEXT_SECONDARY: "#6b7280", // Same as GRAY_500
  TEXT_WHITE: "#ffffff",

  // Button colors (referencing base colors for consistency)
  BUTTON_CANCEL_BG: "#e5e7eb", // Same as GRAY_200
  BUTTON_CANCEL_BG_HOVER: "#d1d5db", // Same as GRAY_300
  BUTTON_CANCEL_TEXT: "#374151", // Same as GRAY_700

  BUTTON_SUBMIT_BG: "#2563eb", // Same as PRIMARY
  BUTTON_SUBMIT_BG_HOVER: "#1d4ed8", // Same as PRIMARY_HOVER
  BUTTON_SUBMIT_TEXT: "#ffffff",

  // Input colors (referencing base colors for consistency)
  INPUT_BORDER: "#d1d5db", // Same as GRAY_300
  INPUT_BORDER_FOCUS: "#2563eb", // Same as PRIMARY

  // Icon colors
  ICON_WHITE: "#ffffff",

  // Authentication status colors
  SUCCESS: "#10b981", // Green for authenticated
  SUCCESS_BG: "#dcfce7", // Light green background
  SUCCESS_TEXT: "#15803d", // Dark green text
  ERROR: "#ef4444", // Red for unauthenticated

  // Info colors
  INFO: "#3b82f6", // Blue for info
  INFO_BG: "#dbeafe", // Light blue background
  INFO_TEXT: "#1e40af", // Dark blue text

  // Warning colors
  WARNING_BG: "#fef3cd", // Light yellow background
  WARNING_BORDER: "#fbbf24", // Yellow border
  WARNING_TEXT: "#92400e", // Dark yellow text

  // Error colors
  ERROR_BG: "#fef2f2", // Light red background
  ERROR_TEXT: "#dc2626", // Red text

  // Border colors for contrast
  BORDER_LIGHT: "#ffffff",
  BORDER_DARK: "#000000",
  BORDER_CONTRAST_LIGHT: "rgba(255, 255, 255, 0.8)",
  BORDER_CONTRAST_DARK: "rgba(0, 0, 0, 0.3)",

  // Additional component-specific colors
  FORM_BORDER: "#e1e5e9",
  FORM_SEPARATOR: "#f0f0f0",
  FORM_DISABLED_BG: "#f8f9fa",
  FORM_FOCUS_BLUE: "#007bff",
  TEXT_MUTED: "#666",
  TEXT_DARK: "#333"
} as const;

// Shadow presets
export const SHADOWS = {
  BUTTON: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  BUTTON_HOVER: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  FORM: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",

  // Focus shadows for inputs (derived from PRIMARY and FORM_FOCUS_BLUE with 0.1 alpha)
  INPUT_FOCUS_PRIMARY: "0 0 0 3px rgba(37, 99, 235, 0.1)", // PRIMARY with alpha
  INPUT_FOCUS_BLUE: "0 0 0 3px rgba(0, 123, 255, 0.1)", // FORM_FOCUS_BLUE with alpha

  // Component shadows
  DROPDOWN: "0 4px 12px rgba(0, 0, 0, 0.1)"
} as const;
