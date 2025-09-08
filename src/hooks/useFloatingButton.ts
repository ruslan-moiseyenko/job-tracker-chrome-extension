import { useState, useMemo, useCallback, useRef, useEffect } from "react";
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
  showButton: boolean | null;
  setShowButton: (show: boolean) => void;
  handleDragStart: (e: React.MouseEvent) => void;
  handleButtonClick: () => void;
  restoreButton: () => void;
  isDragging: boolean;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Main hook for managing floating button state and positioning
 */
export function useFloatingButton(): UseFloatingButtonReturn {
  const [showForm, setShowForm] = useState(false);
  // Initialize as null to prevent flash - we'll determine the actual state after loading
  const [showButton, setShowButton] = useState<boolean | null>(null);
  // Initialize with correct position immediately to avoid animation from (0,0)
  const [position, setPosition] = useState<Position>(() =>
    getInitialPosition()
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Load button visibility state from per-tab storage on mount
  useEffect(() => {
    const loadButtonState = async () => {
      try {
        // Get current tab ID for per-tab storage
        const tabs = await chrome.tabs.query({
          active: true,
          currentWindow: true
        });
        const currentTabId = tabs[0]?.id?.toString() || "unknown";
        const storageKey = `showFloatingButton_${currentTabId}`;

        // Try per-tab storage first, then fall back to session storage, then default to true
        const result = await chrome.storage.local.get([storageKey]);
        if (result[storageKey] !== undefined) {
          setShowButton(result[storageKey]);
        } else {
          // Check if there's a session-based preference
          const sessionKey = `showFloatingButton_session_${currentTabId}`;
          const sessionResult = sessionStorage.getItem(sessionKey);
          setShowButton(sessionResult ? JSON.parse(sessionResult) : true);
        }
      } catch {
        // Fallback for content script context - use sessionStorage only
        const sessionKey = "showFloatingButton_session";
        const sessionResult = sessionStorage.getItem(sessionKey);
        setShowButton(sessionResult ? JSON.parse(sessionResult) : true);
      }
    };

    loadButtonState();
  }, []);

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

  // Handle restore button functionality
  const restoreButton = useCallback(async () => {
    setShowButton(true);
    // Persist the state to per-tab storage
    try {
      const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
      });
      const currentTabId = tabs[0]?.id?.toString() || "unknown";
      const storageKey = `showFloatingButton_${currentTabId}`;
      await chrome.storage.local.set({ [storageKey]: true });
    } catch {
      // Fallback to sessionStorage
      sessionStorage.setItem("showFloatingButton_session", "true");
    }
  }, []);

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
    showButton,
    setShowButton,
    handleDragStart,
    handleButtonClick: handleClick,
    restoreButton,
    isDragging,
    buttonRef
  };
}
