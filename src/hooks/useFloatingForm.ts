import { useState, useEffect, useCallback, useRef } from "react";
import type { Position } from "../utils/types";
import { calculateFormPosition } from "../utils/positioning";
import { useWindowResize } from "./useWindowResize";
import { useDraggable } from "./useDraggable";

interface UseFloatingFormReturn {
  formPosition: Position;
  isDragging: boolean;
  handleFormDragStart: (e: React.MouseEvent) => void;
  formRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Hook for managing draggable floating form state and positioning
 */
export function useFloatingForm(
  buttonPosition: Position,
  isVisible: boolean
): UseFloatingFormReturn {
  const [formPosition, setFormPosition] = useState<Position>({ x: 0, y: 0 });
  const formRef = useRef<HTMLDivElement>(null);

  // Calculate initial form position when it becomes visible
  useEffect(() => {
    if (isVisible && buttonPosition.x !== 0 && buttonPosition.y !== 0) {
      const initialFormPosition = calculateFormPosition(
        buttonPosition.x,
        buttonPosition.y
      );
      setFormPosition(initialFormPosition);
    }
  }, [isVisible, buttonPosition.x, buttonPosition.y]);

  // Handle window resize for form
  useWindowResize(setFormPosition);

  // Callback to update contrast border after dragging (if needed in future)
  const handleFormDragEnd = useCallback(() => {
    // Currently no special styling for form contrast
    // But could be added later similar to button
  }, []);

  // Handle form dragging
  const { handleDragStart, isDragging } = useDraggable(
    formPosition,
    setFormPosition,
    () => {}, // No click action for form
    handleFormDragEnd
  );

  return {
    formPosition,
    isDragging,
    handleFormDragStart: handleDragStart,
    formRef
  };
}
