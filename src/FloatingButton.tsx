import React from "react";
import { FloatingButtonContainer, ButtonIcon } from "./styles/FloatingButton.styles";

interface FloatingButtonProps {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  onDrag: React.MouseEventHandler<HTMLButtonElement>;
  style?: React.CSSProperties;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
  isDragging?: boolean;
}

const FloatingButton: React.FC<FloatingButtonProps> = ({ onClick, onDrag, style, buttonRef: externalButtonRef, isDragging = false }) => {
  const internalButtonRef = React.useRef<HTMLButtonElement>(null);
  const buttonRef = externalButtonRef || internalButtonRef;

  return (
    <FloatingButtonContainer
      ref={buttonRef}
      onClick={onClick}
      onMouseDown={onDrag}
      title="Add position to Job Tracker"
      data-interactive
      style={{
        bottom: "20px",
        right: "20px",
        transition: isDragging ? "none" : "box-shadow 0.2s ease-in-out",
        ...style
      }}
    >
      <ButtonIcon>
        <svg
          viewBox="0 0 24 24"
          style={{
            width: "28px",
            height: "28px",
            fill: "currentColor",
            display: "block",
            flexShrink: 0,
            pointerEvents: "none"
          }}
        >
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
      </ButtonIcon>
    </FloatingButtonContainer>
  );
};

export default FloatingButton;
