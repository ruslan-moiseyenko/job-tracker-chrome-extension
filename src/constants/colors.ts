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

  // Text colors
  TEXT_PRIMARY: "#111827",
  TEXT_SECONDARY: "#6b7280",
  TEXT_WHITE: "#ffffff",

  // Button colors
  BUTTON_CANCEL_BG: "#e5e7eb",
  BUTTON_CANCEL_BG_HOVER: "#d1d5db",
  BUTTON_CANCEL_TEXT: "#374151",

  BUTTON_SUBMIT_BG: "#2563eb",
  BUTTON_SUBMIT_BG_HOVER: "#1d4ed8",
  BUTTON_SUBMIT_TEXT: "#ffffff",

  // Input colors
  INPUT_BORDER: "#d1d5db",
  INPUT_BORDER_FOCUS: "#2563eb",

  // Icon colors
  ICON_WHITE: "#ffffff",

  // Border colors for contrast
  BORDER_LIGHT: "#ffffff",
  BORDER_DARK: "#000000",
  BORDER_CONTRAST_LIGHT: "rgba(255, 255, 255, 0.8)",
  BORDER_CONTRAST_DARK: "rgba(0, 0, 0, 0.3)"
} as const;

// Shadow presets
export const SHADOWS = {
  BUTTON:
    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  BUTTON_HOVER:
    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  FORM: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
} as const;
