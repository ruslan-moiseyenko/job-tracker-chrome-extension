/**
 * CSS Protection utilities to prevent external stylesheets from interfering
 * with Chrome extension components
 */

/**
 * Apply base protective CSS properties to prevent external interference
 * This version preserves intended component styling while blocking external interference
 */
export function applyProtectiveStyles(
  element: HTMLElement,
  preserveSpacing: boolean = false
): void {
  if (!element) return;

  // Core layout protection
  element.style.setProperty("box-sizing", "border-box", "important");

  // Only reset margin/padding if we're not preserving spacing
  if (!preserveSpacing) {
    element.style.setProperty("margin", "0", "important");
    element.style.setProperty("padding", "0", "important");
  }

  // Typography reset (but preserve font-family for form elements)
  element.style.setProperty("line-height", "normal", "important");
  element.style.setProperty("text-decoration", "none", "important");
  element.style.setProperty("text-transform", "none", "important");
  element.style.setProperty("letter-spacing", "normal", "important");
  element.style.setProperty("word-spacing", "normal", "important");
  element.style.setProperty("white-space", "normal", "important");
  element.style.setProperty("direction", "ltr", "important");

  // Visual reset
  element.style.setProperty("background-image", "none", "important");
  element.style.setProperty("background-repeat", "no-repeat", "important");
  element.style.setProperty("text-shadow", "none", "important");
}

/**
 * Apply protective styles specifically for button elements
 */
export function applyButtonProtectiveStyles(
  element: HTMLElement,
  size: number
): void {
  // Apply base protections without preserving spacing (buttons need precise control)
  applyProtectiveStyles(element, false);

  // Button-specific protections
  element.style.setProperty("min-width", `${size}px`, "important");
  element.style.setProperty("min-height", `${size}px`, "important");
  element.style.setProperty("max-width", `${size}px`, "important");
  element.style.setProperty("max-height", `${size}px`, "important");
  element.style.setProperty("width", `${size}px`, "important");
  element.style.setProperty("height", `${size}px`, "important");
  element.style.setProperty(
    "font-family",
    "system-ui, -apple-system, sans-serif",
    "important"
  );
}

/**
 * Apply protective styles for SVG elements to prevent CSS conflicts
 */
export function applySVGProtectiveStyles(
  element: SVGElement,
  width: number,
  height: number
): void {
  if (!element) return;

  element.style.setProperty("width", `${width}px`, "important");
  element.style.setProperty("height", `${height}px`, "important");
  element.style.setProperty("display", "block", "important");
  element.style.setProperty("flex-shrink", "0", "important");
  element.style.setProperty("pointer-events", "none", "important");
  element.style.setProperty("margin", "0", "important");
  element.style.setProperty("padding", "0", "important");
  element.style.setProperty("border", "none", "important");
  element.style.setProperty("background", "none", "important");
  element.style.setProperty("max-width", "none", "important");
  element.style.setProperty("max-height", "none", "important");
  element.style.setProperty("min-width", `${width}px`, "important");
  element.style.setProperty("min-height", `${height}px`, "important");
}

/**
 * Apply protective styles for form elements
 */
export function applyFormProtectiveStyles(element: HTMLElement): void {
  // Use protective styles but preserve spacing for form layouts
  applyProtectiveStyles(element, true);

  // Form-specific protections that don't interfere with our styling
  element.style.setProperty("text-align", "left", "important");
  element.style.setProperty("overflow", "visible", "important");
  element.style.setProperty(
    "font-family",
    "system-ui, -apple-system, sans-serif",
    "important"
  );
}

/**
 * Apply minimal protective styles that only block external interference
 * without overriding our intended component styling
 */
export function applyMinimalProtection(element: HTMLElement): void {
  if (!element) return;

  // Only protect against the most common external interferences
  element.style.setProperty("box-sizing", "border-box", "important");
  element.style.setProperty("direction", "ltr", "important");

  // Protect against extreme typography resets
  element.style.setProperty("text-decoration", "none", "important");
  element.style.setProperty("text-transform", "none", "important");
  element.style.setProperty("letter-spacing", "normal", "important");
  element.style.setProperty("word-spacing", "normal", "important");

  // Protect against background image interference
  element.style.setProperty("background-image", "none", "important");
  element.style.setProperty("text-shadow", "none", "important");
}

/**
 * Apply form-specific protections that preserve our styling
 */
export function applyFormMinimalProtection(element: HTMLElement): void {
  applyMinimalProtection(element);

  // Only add form-specific protections that don't interfere with our design
  element.style.setProperty("text-align", "left", "important");
  element.style.setProperty("overflow", "visible", "important");
}

/**
 * Apply input-specific protections that preserve our styling
 */
export function applyInputMinimalProtection(element: HTMLInputElement): void {
  if (!element) return;

  applyMinimalProtection(element);

  // Only protect against extreme appearance overrides
  element.style.setProperty("appearance", "none", "important");
  element.style.setProperty("-webkit-appearance", "none", "important");
  element.style.setProperty("-moz-appearance", "textfield", "important");
}
