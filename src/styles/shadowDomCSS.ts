import { COLORS, SHADOWS } from "../constants/colors";
import { UI_CONSTANTS } from "../constants/ui";

// Function to generate Shadow DOM CSS with color constants
export function generateShadowDomCSS() {
  return `
/* Tailwind CSS base styles for Shadow DOM */
*, ::before, ::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
  border-color: ${COLORS.GRAY_200};
}

::before, ::after {
  --tw-content: '';
}

/* Host styling */
:host {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  pointer-events: none !important;
  z-index: 2147483647 !important;
}

/* Base reset */
html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  -moz-tab-size: 4;
  tab-size: 4;
  font-family: system-ui, -apple-system, sans-serif;
}

body {
  margin: 0;
  line-height: inherit;
}

/* Button reset */
button {
  font-family: inherit;
  font-size: 100%;
  font-weight: inherit;
  line-height: inherit;
  color: inherit;
  margin: 0;
  padding: 0;
}

button, [role="button"] {
  cursor: pointer;
}

/* Form elements reset */
input {
  font-family: inherit;
  font-size: 100%;
  font-weight: inherit;
  line-height: inherit;
  color: ${COLORS.GRAY_700}; /* Explicit color instead of inherit */
  background-color: ${COLORS.WHITE}; /* Explicit background */
  margin: 0;
  padding: 0;
  border: none;
  box-sizing: border-box;
}

/* Tailwind utility classes */
.fixed { position: fixed !important; }
.flex { display: flex !important; }
.items-center { align-items: center !important; }
.justify-center { justify-content: center !important; }
.rounded-full { border-radius: 9999px !important; }
.shadow-lg { box-shadow: ${SHADOWS.BUTTON} !important; }
.cursor-pointer { cursor: pointer !important; }
.transition-all { transition-property: all !important; }
.duration-200 { transition-duration: 200ms !important; }
.pointer-events-auto { pointer-events: auto !important; }
.pointer-events-none { pointer-events: none !important; }

/* Custom component styles */
.job-tracker-button {
  width: 56px;
  height: 56px;
  background-color: ${COLORS.PRIMARY};
  border: none;
  outline: none;
  transition: box-shadow 0.2s ease-in-out;
}

.job-tracker-button:hover {
  box-shadow: ${SHADOWS.BUTTON_HOVER};
}

.job-tracker-form {
  position: fixed !important;
  background-color: ${COLORS.WHITE};
  border-radius: 8px;
  box-shadow: ${SHADOWS.FORM};
  padding: 20px;
  min-width: 300px;
  z-index: ${UI_CONSTANTS.Z_INDEX} !important;
  pointer-events: auto !important;
}

.job-tracker-input {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid ${COLORS.INPUT_BORDER};
  outline: none;
  font-size: 14px;
  font-family: system-ui, -apple-system, sans-serif;
  width: 100%;
  margin-bottom: 12px;
  /* Explicit styling to prevent host site interference */
  background-color: ${COLORS.WHITE} !important;
  color: ${COLORS.GRAY_700} !important;
  box-sizing: border-box !important;
}

.job-tracker-input:focus {
  border-color: ${COLORS.INPUT_BORDER_FOCUS};
  box-shadow: 0 0 0 1px ${COLORS.INPUT_BORDER_FOCUS};
}

.job-tracker-form-buttons {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
}

.job-tracker-form-button {
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-family: system-ui, -apple-system, sans-serif;
  transition: background-color 0.2s ease;
}

.job-tracker-form-button--primary {
  background-color: ${COLORS.BUTTON_SUBMIT_BG};
  color: ${COLORS.BUTTON_SUBMIT_TEXT};
}

.job-tracker-form-button--primary:hover {
  background-color: ${COLORS.BUTTON_SUBMIT_BG_HOVER};
}

.job-tracker-form-button--secondary {
  background-color: ${COLORS.BUTTON_CANCEL_BG};
  color: ${COLORS.BUTTON_CANCEL_TEXT};
}

.job-tracker-form-button--secondary:hover {
  background-color: ${COLORS.BUTTON_CANCEL_BG_HOVER};
}
`;
}

// Export the generated CSS
export const shadowDomCSS = generateShadowDomCSS();
