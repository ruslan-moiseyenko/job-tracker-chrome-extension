import { useState, useEffect, useCallback, useRef } from "react";
import type { Position, EnhancedPosition } from "../utils/types";
import { calculateFormPosition } from "../utils/positioning";
import { useFormWindowResize } from "./useFormWindowResize";
import { useFormDraggable } from "./useFormDraggable";

interface UseFloatingFormReturn {
  formPosition: EnhancedPosition;
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
  const [formPosition, setFormPosition] = useState<EnhancedPosition>({
    x: 0,
    y: 0
  });
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
  useFormWindowResize(setFormPosition);

  // Callback to update contrast border after dragging (if needed in future)
  const handleFormDragEnd = useCallback(() => {
    // Currently no special styling for form contrast
    // But could be added later similar to button
  }, []);

  // Handle form dragging
  const { handleDragStart, isDragging } = useFormDraggable(
    formPosition,
    setFormPosition,
    handleFormDragEnd
  );

  return {
    formPosition,
    isDragging,
    handleFormDragStart: handleDragStart,
    formRef
  };
}
