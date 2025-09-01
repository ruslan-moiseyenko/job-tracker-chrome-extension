import React from "react";
import { UI_CONSTANTS } from "./constants/ui";
import { COLORS, SHADOWS } from "./constants/colors";
import {
  applyFormMinimalProtection,
  applyInputMinimalProtection
} from "./utils/cssProtection";

interface FloatingFormProps {
  onCancel: () => void;
  onDrag?: React.MouseEventHandler<HTMLDivElement>;
  style?: React.CSSProperties;
}

export default function FloatingForm({
  onCancel,
  onDrag,
  style
}: FloatingFormProps) {
  const formRef = React.useRef<HTMLDivElement>(null);
  const nameInputRef = React.useRef<HTMLInputElement>(null);
  const surnameInputRef = React.useRef<HTMLInputElement>(null);

  // Apply protective CSS after component mounts
  React.useEffect(() => {
    if (formRef.current) {
      const formElement = formRef.current;
      applyFormMinimalProtection(formElement);
      const nameInput = formElement.querySelector(
        "input[placeholder='Name']"
      ) as HTMLInputElement;
      if (nameInput) {
        applyInputMinimalProtection(nameInput);
      }
      const surnameInput = formElement.querySelector(
        "input[placeholder='Surname']"
      ) as HTMLInputElement;
      if (surnameInput) {
        applyInputMinimalProtection(surnameInput);
      }
    }
  }, []);

  const inputStyle: React.CSSProperties = {
    padding: "8px",
    borderRadius: "4px",
    border: `1px solid ${COLORS.INPUT_BORDER}`,
    outline: "none",
    fontSize: "14px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    color: COLORS.TEXT_PRIMARY,
    backgroundColor: COLORS.WHITE,
    transition: "border-color 0.2s ease-in-out",
    width: "100%",
    boxSizing: "border-box"
  };

  const buttonBaseStyle: React.CSSProperties = {
    padding: "4px 16px",
    borderRadius: "4px",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "system-ui, -apple-system, sans-serif",
    transition: "background-color 0.2s ease-in-out",
    boxSizing: "border-box"
  };

  return (
    <div
      ref={formRef}
      style={{
        position: "fixed",
        zIndex: UI_CONSTANTS.Z_INDEX,
        pointerEvents: "auto",
        bottom: "80px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        backgroundColor: COLORS.BACKGROUND_PRIMARY,
        boxShadow: SHADOWS.FORM,
        borderRadius: "12px",
        padding: "0",
        minWidth: `${UI_CONSTANTS.FORM_WIDTH}px`,
        maxWidth: "300px",
        width: "fit-content",
        fontFamily: "system-ui, -apple-system, sans-serif",
        border: `1px solid ${COLORS.GRAY_200}`,
        ...style
      }}
    >
      {/* Drag Handle Header */}
      <div
        style={{
          padding: "12px 20px",
          backgroundColor: COLORS.GRAY_100,
          borderTopLeftRadius: "12px",
          borderTopRightRadius: "12px",
          cursor: "move",
          userSelect: "none",
          fontSize: "14px",
          fontWeight: "500",
          color: COLORS.TEXT_SECONDARY,
          borderBottom: `1px solid ${COLORS.GRAY_200}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}
        onMouseDown={onDrag}
      >
        <span>Add Contact</span>
        <span
          style={{
            fontSize: "18px",
            color: COLORS.GRAY_400,
            lineHeight: "1"
          }}
        >
          ⋯
        </span>
      </div>

      {/* Form Content */}
      <div
        style={{
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}
      >
        <input
          ref={nameInputRef}
          style={inputStyle}
          type="text"
          placeholder="Name"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.INPUT_BORDER_FOCUS;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.INPUT_BORDER;
          }}
        />
        <input
          ref={surnameInputRef}
          style={inputStyle}
          type="text"
          placeholder="Surname"
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.INPUT_BORDER_FOCUS;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.INPUT_BORDER;
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "8px",
            justifyContent: "flex-end"
          }}
        >
          <button
            style={{
              ...buttonBaseStyle,
              backgroundColor: COLORS.BUTTON_CANCEL_BG,
              color: COLORS.BUTTON_CANCEL_TEXT
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor =
                COLORS.BUTTON_CANCEL_BG_HOVER;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BUTTON_CANCEL_BG;
            }}
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            style={{
              ...buttonBaseStyle,
              backgroundColor: COLORS.BUTTON_SUBMIT_BG,
              color: COLORS.BUTTON_SUBMIT_TEXT
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor =
                COLORS.BUTTON_SUBMIT_BG_HOVER;
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.BUTTON_SUBMIT_BG;
            }}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
