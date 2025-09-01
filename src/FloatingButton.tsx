import React from "react";
import { UI_CONSTANTS } from "./constants/ui";
import { COLORS, SHADOWS } from "./constants/colors";
import {
  applyButtonProtectiveStyles,
  applySVGProtectiveStyles
} from "./utils/cssProtection";
import { updateContrastBorder } from "./utils/contrast";

interface FloatingButtonProps {
  onClick: React.MouseEventHandler<HTMLDivElement>;
  onDrag: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
  buttonRef?: React.RefObject<HTMLDivElement | null>;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({
  onClick,
  onDrag,
  style,
  buttonRef: externalButtonRef
}) => {
  const internalButtonRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = externalButtonRef || internalButtonRef;
  const svgRef = React.useRef<SVGSVGElement>(null);

  // Apply protective CSS after component mounts
  React.useEffect(() => {
    const buttonElement = buttonRef.current;
    const svgElement = svgRef.current;

    if (buttonElement) {
      applyButtonProtectiveStyles(buttonElement, UI_CONSTANTS.BUTTON_SIZE);

      // Apply dynamic contrast border
      updateContrastBorder(buttonElement, SHADOWS.BUTTON);
    }

    if (svgElement) {
      applySVGProtectiveStyles(svgElement, 28, 28);
    }
  }, [buttonRef]);

  return (
    <div
      ref={buttonRef}
      style={{
        // Core positioning and layout
        position: "fixed",
        zIndex: UI_CONSTANTS.Z_INDEX,
        pointerEvents: "auto",
        bottom: "20px",
        right: "20px",
        width: `${UI_CONSTANTS.BUTTON_SIZE}px`,
        height: `${UI_CONSTANTS.BUTTON_SIZE}px`,

        // Appearance
        backgroundColor: COLORS.PRIMARY,
        borderRadius: "50%",
        boxShadow: SHADOWS.BUTTON, // Dynamic contrast border will be applied in useEffect
        cursor: "pointer",

        // Layout
        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        // Interaction
        transition: "box-shadow 0.2s ease-in-out",
        border: "none",
        outline: "none",

        ...style
      }}
      onClick={onClick}
      onMouseDown={onDrag}
      onMouseOver={() => {
        if (buttonRef.current) {
          updateContrastBorder(buttonRef.current, SHADOWS.BUTTON_HOVER);
        }
      }}
      onMouseOut={() => {
        if (buttonRef.current) {
          updateContrastBorder(buttonRef.current, SHADOWS.BUTTON);
        }
      }}
      title="Open form"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 24 24"
        style={{
          fill: COLORS.ICON_WHITE,
          display: "block",
          flexShrink: 0,
          pointerEvents: "none"
        }}
      >
        <path
          d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
          style={{
            fill: "inherit"
          }}
        />
      </svg>
    </div>
  );
};

export default FloatingButton;
