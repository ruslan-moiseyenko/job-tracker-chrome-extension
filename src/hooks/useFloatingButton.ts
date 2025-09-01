import { useState, useMemo, useCallback, useRef } from "react";
import type { Position } from "../utils/types";
import {
  getInitialPosition,
  calculateFormPosition
} from "../utils/positioning";
import { useWindowResize } from "./useWindowResize";
import { useDraggable } from "./useDraggable";
import { updateContrastBorder } from "../utils/contrast";
import { SHADOWS } from "../constants/colors";

interface UseFloatingButtonReturn {
  position: Position;
  formPosition: Position;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  handleDragStart: (e: React.MouseEvent) => void;
  handleButtonClick: () => void;
  isDragging: boolean;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Main hook for managing floating button state and positioning
 */
export function useFloatingButton(): UseFloatingButtonReturn {
  const [showForm, setShowForm] = useState(false);
  // Initialize with correct position immediately to avoid animation from (0,0)
  const [position, setPosition] = useState<Position>(() =>
    getInitialPosition()
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Handle window resize
  useWindowResize(setPosition);

  // Callback to update contrast border after dragging
  const handleDragEnd = useCallback(() => {
    if (buttonRef.current) {
      updateContrastBorder(buttonRef.current, SHADOWS.BUTTON);
    }
  }, []);

  // Handle dragging
  const { handleDragStart, handleClick, isDragging } = useDraggable(
    position,
    setPosition,
    () => setShowForm(true),
    handleDragEnd
  );

  // Calculate form position
  const formPosition = useMemo(() => {
    if (!showForm) return { x: 0, y: 0 };
    return calculateFormPosition(position.x, position.y);
  }, [showForm, position.x, position.y]);

  return {
    position,
    formPosition,
    showForm,
    setShowForm,
    handleDragStart,
    handleButtonClick: handleClick,
    isDragging,
    buttonRef
  };
}
