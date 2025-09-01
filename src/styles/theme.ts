import { COLORS, SHADOWS } from "../constants/colors";
import { UI_CONSTANTS } from "../constants/ui";

export const theme = {
  colors: COLORS,
  shadows: SHADOWS,
  ui: UI_CONSTANTS,
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "24px"
  },
  borderRadius: {
    sm: "4px",
    md: "8px",
    full: "9999px"
  },
  sizes: {
    button: {
      width: "56px",
      height: "56px"
    },
    form: {
      minWidth: "300px"
    }
  },
  zIndex: {
    max: UI_CONSTANTS.Z_INDEX
  }
};

export type Theme = typeof theme;
