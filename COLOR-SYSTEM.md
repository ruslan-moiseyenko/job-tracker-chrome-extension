# 🎨 Color System & Theme Management

## 📁 **File Structure**

```
src/constants/
├── colors.ts          # Main color constants
├── theme-variants.ts  # Example theme variants
src/styles/
├── shadowDomCSS.ts    # CSS generation using color constants
```

## 🔧 **How It Works**

## 🔄 **How to Change Colors**

### **1. Modify Individual Colors**
Edit `src/constants/colors.ts`:
```typescript
export const COLORS = {
  PRIMARY: "#059669",        // Change from blue to green
  PRIMARY_HOVER: "#047857",  // Darker green on hover
  // ... other colors
}
```

### **2. Create Theme Variants**
```typescript
// src/constants/theme-variants.ts
export const DARK_THEME = {
  ...LIGHT_COLORS,
  BACKGROUND_PRIMARY: "#1f2937",
  TEXT_PRIMARY: "#f9fafb",
  WHITE: "#374151", // Dark form background
}
```

### **3. Switch Themes**
In `shadowDomCSS.ts`:
```typescript
// Light theme (default)
import { COLORS, SHADOWS } from '../constants/colors';

// Dark theme
import { DARK_COLORS as COLORS, SHADOWS } from '../constants/theme-variants';
```

## 🎨 **Available Color Categories**

- **Primary Colors**: `PRIMARY`, `PRIMARY_HOVER`
- **Neutral Colors**: `GRAY_100` through `GRAY_900`, `WHITE`
- **Background Colors**: `BACKGROUND_PRIMARY`, `BACKGROUND_SECONDARY`
- **Text Colors**: `TEXT_PRIMARY`, `TEXT_SECONDARY`, `TEXT_WHITE`
- **Button Colors**: `BUTTON_SUBMIT_*`, `BUTTON_CANCEL_*`
- **Input Colors**: `INPUT_BORDER`, `INPUT_BORDER_FOCUS`
- **Shadow Colors**: `SHADOW_LIGHT`, `SHADOW_MEDIUM`, `SHADOW_DARK`

## 🚀 **Quick Theme Changes**

Want to switch from blue to green? Just change these:
```typescript
PRIMARY: "#059669",           // Green-600
PRIMARY_HOVER: "#047857",     // Green-700
INPUT_BORDER_FOCUS: "#059669",
BUTTON_SUBMIT_BG: "#059669",
BUTTON_SUBMIT_BG_HOVER: "#047857",
```
