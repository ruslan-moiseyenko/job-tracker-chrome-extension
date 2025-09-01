import React from "react";
import { UI_CONSTANTS } from "./constants/ui";
import { COLORS, SHADOWS } from "./constants/colors";

interface FloatingButtonProps {
  onClick: React.MouseEventHandler<HTMLDivElement>;
  onDrag: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
  buttonRef?: React.RefObject<HTMLDivElement | null>;
  isDragging?: boolean; // Add isDragging prop to control transitions
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  onClick,
  onDrag,
  style,
  buttonRef: externalButtonRef,
  isDragging = false
}) => {
  const internalButtonRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = externalButtonRef || internalButtonRef;
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      ref={buttonRef}
      className={`job-tracker-button fixed flex items-center justify-center rounded-full pointer-events-auto cursor-pointer ${
        isDragging ? "" : "transition-shadow duration-200"
      }`}
      style={{
        // Core positioning and layout
        position: "fixed",
        zIndex: UI_CONSTANTS.Z_INDEX,
        pointerEvents: "auto",
        bottom: "20px",
        right: "20px",
        width: `${UI_CONSTANTS.BUTTON_SIZE}px`,
        height: `${UI_CONSTANTS.BUTTON_SIZE}px`,

        // Appearance - clean styling without protection hacks
        backgroundColor: COLORS.PRIMARY,
        borderRadius: "50%",
        boxShadow: isHovered ? SHADOWS.BUTTON_HOVER : SHADOWS.BUTTON,
        cursor: "pointer",

        // Layout
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        // Interaction - only transition box-shadow, not position
        transition: isDragging ? "none" : "box-shadow 0.2s ease-in-out",
        border: "none",
        outline: "none",

        ...style
      }}
      onClick={onClick}
      onMouseDown={onDrag}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Open form"
    >
      <svg
        viewBox="0 0 24 24"
        style={{
          width: "28px",
          height: "28px",
          fill: COLORS.ICON_WHITE,
          display: "block",
          flexShrink: 0,
          pointerEvents: "none"
        }}
      >
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
    </div>
  );
};

export default FloatingButton;
