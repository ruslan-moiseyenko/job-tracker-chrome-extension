// UI-related constants
export const UI_CONSTANTS = {
  BUTTON_SIZE: 56,
  MARGIN: 20,
  FORM_WIDTH: 260,
  FORM_HEIGHT: 220, // Updated to more accurate height including padding and inputs
  FORM_MIN_HEIGHT: 180, // Minimum form height for positioning calculations
  Z_INDEX: 2147483647,
  DRAG_THRESHOLD: 4,
  FORM_OFFSET: 10
} as const;

// Position-related constants
export const POSITION_CONSTANTS = {
  INITIAL_OFFSET: 106 // BUTTON_SIZE (56) + MARGIN (50) = 106
} as const;
