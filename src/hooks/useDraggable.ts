import { useState, useRef, useEffect, useCallback } from "react";
import type { Position } from "../utils/types";
import { constrainPosition, hasMovedFarEnough } from "../utils/positioning";

interface UseDraggableReturn {
  isDragging: boolean;
  handleDragStart: (e: React.MouseEvent) => void;
  handleClick: () => void;
  hasMoved: () => boolean;
}

/**
 * Custom hook to handle dragging functionality with click distinction
 */
export function useDraggable(position: Position, setPosition: (updater: (currentPos: Position) => Position) => void, onValidClick: () => void, onDragEnd?: () => void): UseDraggableReturn {
  const [isDragging, setIsDragging] = useState(false);
  const offset = useRef<Position>({ x: 0, y: 0 });
  const dragStartPos = useRef<Position>({ x: 0, y: 0 });
  const movedFar = useRef(false);

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      movedFar.current = false;
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      offset.current = {
        x: e.clientX - position.x,
        y: e.clientY - position.y
      };
      // Prevent text selection on the main document using various prefixes
      document.body.style.setProperty("user-select", "none");
      document.body.style.setProperty("-webkit-user-select", "none");
      document.body.style.setProperty("-moz-user-select", "none");
      document.body.style.setProperty("-ms-user-select", "none");
    },
    [position.x, position.y]
  );

  const handleClick = useCallback(() => {
    if (movedFar.current) {
      movedFar.current = false;
      return;
    }
    onValidClick();
  }, [onValidClick]);

  const hasMoved = useCallback(() => movedFar.current, []);

  // Handle mouse movement and release
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!isDragging) return;

      // Check if moved far enough to be considered a drag
      if (!movedFar.current) {
        const currentPos = { x: e.clientX, y: e.clientY };
        movedFar.current = hasMovedFarEnough(dragStartPos.current, currentPos);
      }

      // Update position with constraints
      const newPos = constrainPosition(e.clientX - offset.current.x, e.clientY - offset.current.y);
      setPosition(() => newPos);
    }

    function onMouseUp() {
      setIsDragging(false);
      // Restore text selection on the main document
      document.body.style.removeProperty("user-select");
      document.body.style.removeProperty("-webkit-user-select");
      document.body.style.removeProperty("-moz-user-select");
      document.body.style.removeProperty("-ms-user-select");

      // Trigger contrast border update if callback provided
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
    handleDragStart,
    handleClick,
    hasMoved
  };
}
