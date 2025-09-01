import React from "react";
import {
  FormContainer,
  FormInput,
  FormButtonContainer,
  FormButton,
  DragHandle,
  DragHandleTitle,
  DragHandleIcon
} from "./styles/FloatingForm.styles";

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
    <FormContainer ref={formRef} style={style}>
      {/* Drag Handle */}
      <DragHandle onMouseDown={onDrag}>
        <DragHandleTitle>Job Application</DragHandleTitle>
        <DragHandleIcon>⋯</DragHandleIcon>
      </DragHandle>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        <FormInput
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <FormInput
          type="text"
          placeholder="Surname"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />
        <FormButtonContainer>
          <FormButton type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </FormButton>
          <FormButton type="submit" variant="primary">
            Submit
          </FormButton>
        </FormButtonContainer>
      </form>
    </FormContainer>
  );
}
