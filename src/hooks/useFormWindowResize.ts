import { useEffect, useCallback } from "react";
import type { EnhancedPosition } from "../utils/types";
import {
  constrainFormPosition,
  calculateFormHeight
} from "../utils/positioning";
import { UI_CONSTANTS } from "../constants/ui";

/**
 * Custom hook to handle window resize events for form positioning
 */
export function useFormWindowResize(
  setPosition: (
    updater: (currentPos: EnhancedPosition) => EnhancedPosition
  ) => void,
  inputCount?: number
) {
  const handleResize = useCallback(() => {
    setPosition((currentPos: EnhancedPosition) => {
      const constrained = constrainFormPosition(
        currentPos.x,
        currentPos.y,
        undefined,
        inputCount
      );

      // If using right/bottom positioning, recalculate those values for new viewport size
      if (currentPos.useRightBottom) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const formHeight = calculateFormHeight(inputCount);

        return {
          x: constrained.x,
          y: constrained.y,
          useRightBottom: true,
          right: viewportWidth - constrained.x - UI_CONSTANTS.FORM_WIDTH,
          bottom: viewportHeight - constrained.y - formHeight
        };
      }

      return {
        ...currentPos,
        x: constrained.x,
        y: constrained.y
      };
    });
  }, [setPosition, inputCount]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);
}
