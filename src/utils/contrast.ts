import { COLORS } from "../constants/colors";

/**
 * Detects if the background behind an element is light or dark
 * and returns the appropriate contrast border color
 */
export const getContrastBorder = (element: HTMLElement): string => {
  try {
    // Get the computed background color of the element behind
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Temporarily hide our element to sample the background
    const originalDisplay = element.style.display;
    element.style.display = "none";

    // Get the element at that point
    const elementBelow = document.elementFromPoint(x, y);

    // Restore our element
    element.style.display = originalDisplay;

    if (elementBelow) {
      const computedStyle = window.getComputedStyle(elementBelow);
      const backgroundColor = computedStyle.backgroundColor;

      // Parse the background color and determine if it's light or dark
      const isLightBackground = isLightColor(backgroundColor);

      return isLightBackground
        ? COLORS.BORDER_CONTRAST_DARK
        : COLORS.BORDER_CONTRAST_LIGHT;
    }
  } catch (error) {
    // Fallback to light border if detection fails
    console.warn("Failed to detect background color:", error);
  }

  // Default to light border (works well on most backgrounds)
  return COLORS.BORDER_CONTRAST_LIGHT;
};

/**
 * Determines if a color is light or dark
 */
const isLightColor = (color: string): boolean => {
  // Handle different color formats
  if (color === "transparent" || color === "rgba(0, 0, 0, 0)") {
    // Assume light background for transparent
    return true;
  }

  // Parse RGB values
  const rgb = color.match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    const r = parseInt(rgb[0]);
    const g = parseInt(rgb[1]);
    const b = parseInt(rgb[2]);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return true if light (luminance > 0.5)
    return luminance > 0.5;
  }

  // Default to light if we can't parse
  return true;
};

/**
 * Updates an element's border based on the background contrast
 */
export const updateContrastBorder = (
  element: HTMLElement,
  baseShadow: string
): void => {
  const contrastBorder = getContrastBorder(element);
  element.style.boxShadow = `0 0 0 1px ${contrastBorder}, ${baseShadow}`;
};
