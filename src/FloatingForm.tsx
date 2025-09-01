import React from "react";
import { UI_CONSTANTS } from "./constants/ui";
import { COLORS, SHADOWS } from "./constants/colors";

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
  const [name, setName] = React.useState("");
  const [surname, setSurname] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", { name, surname });
    onCancel(); // Close form for now
  };

  return (
    <div
      ref={formRef}
      className="job-tracker-form fixed pointer-events-auto"
      style={{
        position: "fixed",
        zIndex: UI_CONSTANTS.Z_INDEX,
        pointerEvents: "auto",
        backgroundColor: "white",
        borderRadius: "8px",
        boxShadow: SHADOWS.FORM,
        minWidth: "300px",
        ...style
      }}
    >
      {/* Drag Handle */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: `1px solid ${COLORS.INPUT_BORDER}`,
          cursor: "move",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#f8fafc"
        }}
        onMouseDown={onDrag}
      >
        <h3
          style={{
            margin: "0",
            fontSize: "16px",
            fontWeight: "600",
            color: "#1f2937"
          }}
        >
          Job Application
        </h3>
        <span
          style={{
            cursor: "grab",
            fontSize: "18px",
            color: "#9ca3af",
            lineHeight: "1"
          }}
        >
          ⋯
        </span>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}
        >
          <input
            className="job-tracker-input"
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="job-tracker-input"
            type="text"
            placeholder="Surname"
            value={surname}
            onChange={(e) => setSurname(e.target.value)}
          />
          <div className="job-tracker-form-buttons">
            <button
              type="button"
              className="job-tracker-form-button job-tracker-form-button--secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="job-tracker-form-button job-tracker-form-button--primary"
            >
              Submit
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
