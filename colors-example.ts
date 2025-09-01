// Example: How to customize colors for your brand
// Copy this into src/constants/colors.ts and modify the values

export const COLORS = {
  // 🎨 CHANGE THESE FOR YOUR BRAND
  PRIMARY: "#7c3aed", // Purple brand color (was #2563eb)
  PRIMARY_HOVER: "#6d28d9", // Darker purple for hover (was #1d4ed8)

  // 🎨 KEEP THESE OR CUSTOMIZE AS NEEDED
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

  // 🎨 THESE WILL AUTO-UPDATE TO MATCH YOUR BRAND
  BUTTON_CANCEL_BG: "#e5e7eb",
  BUTTON_CANCEL_BG_HOVER: "#d1d5db",
  BUTTON_CANCEL_TEXT: "#374151",

  BUTTON_SUBMIT_BG: "#7c3aed", // Uses your brand color
  BUTTON_SUBMIT_BG_HOVER: "#6d28d9", // Uses your brand hover color
  BUTTON_SUBMIT_TEXT: "#ffffff",

  // Input colors
  INPUT_BORDER: "#d1d5db",
  INPUT_BORDER_FOCUS: "#7c3aed", // Uses your brand color

  // Icon colors
  ICON_WHITE: "#ffffff"
} as const;

// Shadow presets (no changes needed unless you want different shadows)
export const SHADOWS = {
  BUTTON:
    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  BUTTON_HOVER:
    "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  FORM: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
} as const;
