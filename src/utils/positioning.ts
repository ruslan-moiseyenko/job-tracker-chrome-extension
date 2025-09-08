import type { Position, ViewportDimensions, EnhancedPosition } from "./types";
import { UI_CONSTANTS, FLOATING_BUTTON_POSITION } from "../constants/ui";

/**
 * Calculate dynamic form height based on content
 * This can be extended later for different form configurations
 */
export function calculateFormHeight(inputCount: number = 2): number {
  const PADDING = 48; // 24px top + 24px bottom
  const INPUT_HEIGHT = 32; // 8px padding top + 8px padding bottom + text height
  const GAP = 12; // gap between inputs
  const BUTTON_ROW_HEIGHT = 32; // button height
  const BUTTON_GAP = 12; // gap before buttons

  return (
    PADDING +
    inputCount * INPUT_HEIGHT +
    (inputCount - 1) * GAP +
    BUTTON_GAP +
    BUTTON_ROW_HEIGHT
  );
}

/**
 * Constrains a position within viewport boundaries
 */
export function constrainPosition(
  x: number,
  y: number,
  viewport?: ViewportDimensions
): Position {
  const viewportWidth = viewport?.width ?? window.innerWidth;
  const viewportHeight = viewport?.height ?? window.innerHeight;

  const maxX = viewportWidth - UI_CONSTANTS.BUTTON_SIZE - UI_CONSTANTS.MARGIN;
  const maxY = viewportHeight - UI_CONSTANTS.BUTTON_SIZE - UI_CONSTANTS.MARGIN;

  return {
    x: Math.max(UI_CONSTANTS.MARGIN, Math.min(x, maxX)),
    y: Math.max(UI_CONSTANTS.MARGIN, Math.min(y, maxY))
  };
}

/**
 * Constrains form position within viewport boundaries
 */
export function constrainFormPosition(
  x: number,
  y: number,
  viewport?: ViewportDimensions,
  inputCount?: number
): Position {
  const viewportWidth = viewport?.width ?? window.innerWidth;
  const viewportHeight = viewport?.height ?? window.innerHeight;
  const formHeight = calculateFormHeight(inputCount);

  const maxX = viewportWidth - UI_CONSTANTS.FORM_WIDTH - UI_CONSTANTS.MARGIN;
  const maxY = viewportHeight - formHeight - UI_CONSTANTS.MARGIN;

  return {
    x: Math.max(UI_CONSTANTS.MARGIN, Math.min(x, maxX)),
    y: Math.max(UI_CONSTANTS.MARGIN, Math.min(y, maxY))
  };
}

/**
 * Calculate optimal form position based on button position and available space
 * Returns position with right/bottom coordinates for better fixed positioning
 */
export function calculateFormPosition(
  buttonX: number,
  buttonY: number,
  viewport?: ViewportDimensions,
  inputCount?: number
): EnhancedPosition {
  const viewportWidth = viewport?.width ?? window.innerWidth;
  const viewportHeight = viewport?.height ?? window.innerHeight;

  // Use dynamic height calculation
  const formHeight = calculateFormHeight(inputCount);

  // Available space calculations
  const spaceAbove = buttonY - UI_CONSTANTS.MARGIN;
  const spaceBelow =
    viewportHeight - (buttonY + UI_CONSTANTS.BUTTON_SIZE) - UI_CONSTANTS.MARGIN;
  const spaceLeft = buttonX - UI_CONSTANTS.MARGIN;
  const spaceRight =
    viewportWidth - (buttonX + UI_CONSTANTS.BUTTON_SIZE) - UI_CONSTANTS.MARGIN;

  let formX = buttonX;
  let formY = buttonY;

  // Determine optimal vertical position
  if (spaceAbove >= formHeight + UI_CONSTANTS.FORM_OFFSET) {
    // Place above button
    formY = buttonY - formHeight - UI_CONSTANTS.FORM_OFFSET;
  } else if (spaceBelow >= formHeight + UI_CONSTANTS.FORM_OFFSET) {
    // Place below button
    formY = buttonY + UI_CONSTANTS.BUTTON_SIZE + UI_CONSTANTS.FORM_OFFSET;
  } else {
    // Not enough space above or below, find the best fit
    if (spaceAbove > spaceBelow) {
      // Place at top of viewport with margin
      formY = UI_CONSTANTS.MARGIN;
    } else {
      // Place at bottom of viewport with margin
      formY = viewportHeight - formHeight - UI_CONSTANTS.MARGIN;
    }
  }

  // Determine optimal horizontal position
  if (spaceRight >= UI_CONSTANTS.FORM_WIDTH) {
    // Align with button (default)
    formX = buttonX;
  } else if (spaceLeft >= UI_CONSTANTS.FORM_WIDTH) {
    // Align to the right edge of button
    formX = buttonX + UI_CONSTANTS.BUTTON_SIZE - UI_CONSTANTS.FORM_WIDTH;
  } else {
    // Center the form as much as possible
    const availableWidth = viewportWidth - 2 * UI_CONSTANTS.MARGIN;
    if (UI_CONSTANTS.FORM_WIDTH <= availableWidth) {
      formX = (viewportWidth - UI_CONSTANTS.FORM_WIDTH) / 2;
    } else {
      // Form is wider than available space, stick to left edge
      formX = UI_CONSTANTS.MARGIN;
    }
  }

  // Final boundary checks
  formX = Math.max(
    UI_CONSTANTS.MARGIN,
    Math.min(
      formX,
      viewportWidth - UI_CONSTANTS.FORM_WIDTH - UI_CONSTANTS.MARGIN
    )
  );

  formY = Math.max(
    UI_CONSTANTS.MARGIN,
    Math.min(formY, viewportHeight - formHeight - UI_CONSTANTS.MARGIN)
  );

  // Determine if we should use right/bottom positioning for better stability
  // Use right/bottom when form is in the bottom-right quadrant
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  const useRightBottom = formX > centerX && formY > centerY;

  if (useRightBottom) {
    return {
      x: formX,
      y: formY,
      useRightBottom: true,
      right: viewportWidth - formX - UI_CONSTANTS.FORM_WIDTH,
      bottom: viewportHeight - formY - formHeight
    };
  }

  return { x: formX, y: formY };
}

/**
 * Calculate initial button position (bottom-right corner with pixel-based positioning)
 */
export function getInitialPosition(viewport?: ViewportDimensions): Position {
  const viewportWidth = viewport?.width ?? window.innerWidth;
  const viewportHeight = viewport?.height ?? window.innerHeight;

  // Calculate position from bottom-right corner using pixel values
  const x = viewportWidth - FLOATING_BUTTON_POSITION.RIGHT;
  const y = viewportHeight - FLOATING_BUTTON_POSITION.BOTTOM;

  return constrainPosition(x, y, viewport);
}

/**
 * Check if the user has moved the cursor far enough to be considered a drag
 */
export function hasMovedFarEnough(
  startPos: Position,
  currentPos: Position,
  threshold: number = UI_CONSTANTS.DRAG_THRESHOLD
): boolean {
  const dx = Math.abs(currentPos.x - startPos.x);
  const dy = Math.abs(currentPos.y - startPos.y);
  return dx > threshold || dy > threshold;
}
