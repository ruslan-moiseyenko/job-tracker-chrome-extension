import { useTheme } from "@emotion/react";
import type { Theme } from "../styles/theme";

export const useThemeColors = () => {
  const theme = useTheme() as Theme;
  return theme.colors;
};
