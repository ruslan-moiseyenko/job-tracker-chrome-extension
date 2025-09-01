import styled from "@emotion/styled";

export const FormContainer = styled.div`
  position: fixed !important;
  background-color: ${({ theme }) => theme.colors.WHITE};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.FORM};
  padding: ${({ theme }) => theme.spacing.xl};
  min-width: ${({ theme }) => theme.sizes.form.minWidth};
  z-index: ${({ theme }) => theme.zIndex.max} !important;
  pointer-events: auto !important;
`;

export const DragHandle = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.INPUT_BORDER};
  cursor: move;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.BACKGROUND_SECONDARY};
  border-radius: ${({ theme }) => theme.borderRadius.md}
    ${({ theme }) => theme.borderRadius.md} 0 0;
  margin: -${({ theme }) => theme.spacing.xl} -${({ theme }) =>
      theme.spacing.xl}
    ${({ theme }) => theme.spacing.xl} -${({ theme }) => theme.spacing.xl};
`;

export const DragHandleTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.TEXT_PRIMARY};
`;

export const DragHandleIcon = styled.span`
  cursor: grab;
  font-size: 18px;
  color: ${({ theme }) => theme.colors.GRAY_400};
  line-height: 1;

  &:active {
    cursor: grabbing;
  }
`;

export const FormInput = styled.input`
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: 1px solid ${({ theme }) => theme.colors.INPUT_BORDER};
  outline: none;
  font-size: 14px;
  font-family: system-ui, -apple-system, sans-serif;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  background-color: ${({ theme }) => theme.colors.WHITE} !important;
  color: ${({ theme }) => theme.colors.GRAY_700} !important;
  box-sizing: border-box !important;

  &:focus {
    border-color: ${({ theme }) => theme.colors.INPUT_BORDER_FOCUS};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.INPUT_BORDER_FOCUS};
  }
`;

export const FormButtonContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  justify-content: flex-end;
  margin-top: ${({ theme }) => theme.spacing.lg};
`;

export const FormButton = styled.button<{ variant: "primary" | "secondary" }>`
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-family: system-ui, -apple-system, sans-serif;
  transition: background-color 0.2s ease;

  ${({ theme, variant }) =>
    variant === "primary"
      ? `
    background-color: ${theme.colors.BUTTON_SUBMIT_BG};
    color: ${theme.colors.BUTTON_SUBMIT_TEXT};
    
    &:hover {
      background-color: ${theme.colors.BUTTON_SUBMIT_BG_HOVER};
    }
  `
      : `
    background-color: ${theme.colors.BUTTON_CANCEL_BG};
    color: ${theme.colors.BUTTON_CANCEL_TEXT};
    
    &:hover {
      background-color: ${theme.colors.BUTTON_CANCEL_BG_HOVER};
    }
  `}
`;
