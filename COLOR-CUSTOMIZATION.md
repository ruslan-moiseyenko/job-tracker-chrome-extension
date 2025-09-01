# Color Customization Guide

This guide explains how to customize the colors of the Chrome extension components.

## 🎨 Color System

All colors are centrally managed in `src/constants/colors.ts`. This makes it easy to customize the entire theme by changing values in one place.

## 📋 Available Color Variables

### Primary Colors
```typescript
PRIMARY: "#2563eb"           // Main blue color for buttons and accents
PRIMARY_HOVER: "#1d4ed8"     // Darker blue for hover states
```

### Neutral Colors
```typescript
WHITE: "#ffffff"
GRAY_100: "#f3f4f6"         // Lightest gray
GRAY_200: "#e5e7eb"         // Light gray for borders
GRAY_300: "#d1d5db"         // Medium-light gray
GRAY_400: "#9ca3af"         // Medium gray
GRAY_500: "#6b7280"         // Medium-dark gray
GRAY_600: "#4b5563"
GRAY_700: "#374151"         // Dark gray for text
GRAY_800: "#1f2937"
GRAY_900: "#111827"         // Darkest gray
```

### Component-Specific Colors
```typescript
// Backgrounds
BACKGROUND_PRIMARY: "#ffffff"    // Form background
BACKGROUND_SECONDARY: "#f9fafb"  // Alternative background

// Text
TEXT_PRIMARY: "#111827"          // Main text color
TEXT_SECONDARY: "#6b7280"        // Secondary text color
TEXT_WHITE: "#ffffff"            // White text

// Buttons
BUTTON_CANCEL_BG: "#e5e7eb"      // Cancel button background
BUTTON_CANCEL_BG_HOVER: "#d1d5db" // Cancel button hover
BUTTON_CANCEL_TEXT: "#374151"    // Cancel button text

BUTTON_SUBMIT_BG: "#2563eb"      // Submit button background
BUTTON_SUBMIT_BG_HOVER: "#1d4ed8" // Submit button hover
BUTTON_SUBMIT_TEXT: "#ffffff"    // Submit button text

// Inputs
INPUT_BORDER: "#d1d5db"          // Input border color
INPUT_BORDER_FOCUS: "#2563eb"    // Input border when focused
```

## 🎯 Common Customization Examples

### Dark Theme
To create a dark theme, modify these colors:
```typescript
BACKGROUND_PRIMARY: "#1f2937"    // Dark background
TEXT_PRIMARY: "#f9fafb"          // Light text
INPUT_BORDER: "#4b5563"          // Darker borders
```

### Custom Brand Colors
To use your brand colors:
```typescript
PRIMARY: "#your-brand-color"
PRIMARY_HOVER: "#your-brand-color-darker"
BUTTON_SUBMIT_BG: "#your-brand-color"
BUTTON_SUBMIT_BG_HOVER: "#your-brand-color-darker"
```

### High Contrast
For better accessibility:
```typescript
INPUT_BORDER: "#000000"          // Black borders
TEXT_PRIMARY: "#000000"          // Pure black text
BACKGROUND_PRIMARY: "#ffffff"    // Pure white background
```

## 🛠️ How to Customize

1. Open `src/constants/colors.ts`
2. Modify the color values you want to change
3. Save the file
4. Rebuild the extension: `npm run build`
5. Reload the extension in Chrome

## 🎨 Shadow System

Shadows are also centralized for consistency:
```typescript
SHADOWS.BUTTON         // Standard button shadow
SHADOWS.BUTTON_HOVER   // Button hover shadow (more elevated)
SHADOWS.FORM          // Form shadow (most elevated)
```

## 📱 Responsive Considerations

The positioning system automatically adapts to different screen sizes and ensures:
- Forms never overlap viewport edges
- Buttons stay within visible bounds
- Proper spacing is maintained on all devices

## 🔧 Advanced Customization

For more advanced theming, you can:
1. Add new color variables to the `COLORS` object
2. Create theme variants (light/dark)
3. Use CSS custom properties for runtime theme switching
4. Add color validation functions

This centralized approach makes it easy to maintain consistent styling across all components while allowing for easy customization.
