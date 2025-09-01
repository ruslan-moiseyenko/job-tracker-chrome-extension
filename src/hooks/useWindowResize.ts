import { useEffect, useCallback } from "react";
import type { Position } from "../utils/types";
import { constrainPosition } from "../utils/positioning";

/**
 * Custom hook to handle window resize events and keep position within bounds
 */
export function useWindowResize(
  setPosition: (updater: (currentPos: Position) => Position) => void
) {
  const handleResize = useCallback(() => {
    setPosition((currentPos: Position) =>
      constrainPosition(currentPos.x, currentPos.y)
    );
  }, [setPosition]);

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);
}
