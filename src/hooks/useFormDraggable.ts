import { useState, useRef, useEffect, useCallback } from "react";
import type { Position, EnhancedPosition } from "../utils/types";
import {
  constrainFormPosition,
  hasMovedFarEnough,
  calculateFormHeight
} from "../utils/positioning";
import { UI_CONSTANTS } from "../constants/ui";

interface UseFormDraggableReturn {
  isDragging: boolean;
  handleDragStart: (e: React.MouseEvent) => void;
}

/**
 * Custom hook to handle dragging functionality specifically for forms
 */
export function useFormDraggable(
  position: EnhancedPosition,
  setPosition: (
    updater: (currentPos: EnhancedPosition) => EnhancedPosition
  ) => void,
  onDragEnd?: () => void
): UseFormDraggableReturn {
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef<Position>({ x: 0, y: 0 });
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const movedFar = useRef(false);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      movedFar.current = false;
      dragStartPos.current = { x: e.clientX, y: e.clientY };

      // Calculate offset from mouse to form's top-left corner
      // Always use x,y coordinates regardless of positioning method
      offset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };

      document.body.style.userSelect = "none";
    },
    [position.x, position.y]
  );

  // Handle mouse movement and release
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging) return;

      // Check if moved far enough to be considered a drag
      if (!movedFar.current) {
        const currentPos = { x: e.clientX, y: e.clientY };
        movedFar.current = hasMovedFarEnough(dragStartPos.current, currentPos);
      }

      // Calculate new position
      const newX = e.clientX - offset.current.x;
      const newY = e.clientY - offset.current.y;

      // Constrain to viewport with form-specific constraints
      const constrainedPos = constrainFormPosition(newX, newY);

      // Update position with smart positioning method
      setPosition((currentPos) => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const formHeight = calculateFormHeight();

        // During drag, preserve the current positioning method to avoid jumps
        // Only recalculate right/bottom values if we're already using that method
        if (currentPos.useRightBottom) {
          return {
            x: constrainedPos.x,
            y: constrainedPos.y,
            useRightBottom: true,
            right: viewportWidth - constrainedPos.x - UI_CONSTANTS.FORM_WIDTH,
            bottom: viewportHeight - constrainedPos.y - formHeight
          };
        }

        // If using left/top positioning, keep using it during drag
        return {
          x: constrainedPos.x,
          y: constrainedPos.y,
          useRightBottom: false
        };
      });
    }

    function onMouseUp() {
      setIsDragging(false);
      document.body.style.userSelect = "";

      // After drag ends, recalculate optimal positioning method
      setPosition((currentPos) => {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const formHeight = calculateFormHeight();

        // Determine optimal positioning method based on final position
        const centerX = viewportWidth / 2;
        const centerY = viewportHeight / 2;
        const shouldUseRightBottom =
          currentPos.x > centerX && currentPos.y > centerY;

        if (shouldUseRightBottom) {
          return {
            x: currentPos.x,
            y: currentPos.y,
            useRightBottom: true,
            right: viewportWidth - currentPos.x - UI_CONSTANTS.FORM_WIDTH,
            bottom: viewportHeight - currentPos.y - formHeight
          };
        }

        return {
          x: currentPos.x,
          y: currentPos.y,
          useRightBottom: false
        };
      });

      if (onDragEnd) {
        onDragEnd();
      }
    }

    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, setPosition, onDragEnd]);

  return {
    isDragging,
    handleDragStart
  };
}
