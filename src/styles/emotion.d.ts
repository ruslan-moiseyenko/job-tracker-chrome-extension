import "@emotion/react";
import type { Theme as CustomTheme } from "./theme";

declare module "@emotion/react" {
  // This interface extension is required for Emotion theme typing
  // It merges our custom theme with Emotion's Theme interface
  interface Theme extends CustomTheme {
    // Explicitly define that this interface extends CustomTheme
    // This satisfies TypeScript's requirement for non-empty interfaces
    readonly __themeType?: "job-tracker-theme";
  }
}
