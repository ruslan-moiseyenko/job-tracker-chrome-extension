// Example: Dark theme variant
import { COLORS as LIGHT_COLORS } from "./colors";

// Dark theme color overrides
export const DARK_COLORS = {
  ...LIGHT_COLORS,

  // Override specific colors for dark theme
  BACKGROUND_PRIMARY: "#1f2937", // Dark background
  TEXT_PRIMARY: "#f9fafb", // Light text

  // Form styling for dark theme
  WHITE: "#374151", // Form background (dark gray)
  INPUT_BORDER: "#4b5563", // Darker borders
  INPUT_BORDER_FOCUS: "#60a5fa", // Lighter blue focus

  // Button colors for dark theme
  BUTTON_CANCEL_BG: "#4b5563",
  BUTTON_CANCEL_BG_HOVER: "#374151",
  BUTTON_CANCEL_TEXT: "#f9fafb"
} as const;

// Green theme variant
export const GREEN_COLORS = {
  ...LIGHT_COLORS,

  // Green primary colors
  PRIMARY: "#059669", // Green-600
  PRIMARY_HOVER: "#047857", // Green-700

  BUTTON_SUBMIT_BG: "#059669",
  BUTTON_SUBMIT_BG_HOVER: "#047857",
  INPUT_BORDER_FOCUS: "#059669"
} as const;

// Usage example:
// To switch themes, just import different colors in shadowDomCSS.ts:
// import { DARK_COLORS as COLORS } from '../constants/theme-variants';
