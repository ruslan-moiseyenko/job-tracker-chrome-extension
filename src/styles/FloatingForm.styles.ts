// prettier-ignore-file
/* eslint-disable max-len */

import styled from "@emotion/styled";
import type { Theme } from "./theme";

export const FormContainer = styled.div`
  background: ${({ theme }: { theme: Theme }) =>
    theme.colors.BACKGROUND_PRIMARY};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }: { theme: Theme }) => theme.shadows.FORM};
  min-width: ${({ theme }: { theme: Theme }) => theme.sizes.form.minWidth};
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.lg};
  position: fixed;
  z-index: ${({ theme }: { theme: Theme }) => theme.zIndex.max};
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  pointer-events: auto; /* Ensure form can receive clicks */
`;

export const DragHandle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.sm} 0;
  margin-bottom: ${({ theme }: { theme: Theme }) => theme.spacing.md};
  border-bottom: 1px solid
    ${({ theme }: { theme: Theme }) => theme.colors.GRAY_200};

  &:active {
    cursor: grabbing;
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
  }
`;

export const DragHandleTitle = styled.span`
  font-weight: 600;
  color: ${({ theme }: { theme: Theme }) => theme.colors.TEXT_PRIMARY};
  font-size: 14px;
  display: flex;
  align-items: center;
`;

export const AuthStatusIcon = styled.span<{ isAuthenticated: boolean }>`
  margin-left: ${({ theme }: { theme: Theme }) => theme.spacing.sm};
  font-size: 12px;
  opacity: 0.7;
  color: ${({
    theme,
    isAuthenticated
  }: {
    theme: Theme;
    isAuthenticated: boolean;
  }) => (isAuthenticated ? theme.colors.SUCCESS : theme.colors.ERROR)};
`;

export const DragHandleIcon = styled.span`
  color: ${({ theme }: { theme: Theme }) => theme.colors.TEXT_SECONDARY};
  font-size: 18px;
  line-height: 1;
`;

export const WarningMessage = styled.div`
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.sm}
    ${({ theme }: { theme: Theme }) => theme.spacing.md};
  background-color: ${({ theme }: { theme: Theme }) => theme.colors.WARNING_BG};
  border: 1px solid
    ${({ theme }: { theme: Theme }) => theme.colors.WARNING_BORDER};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }: { theme: Theme }) => theme.spacing.md};
  font-size: 12px;
  color: ${({ theme }: { theme: Theme }) => theme.colors.WARNING_TEXT};
`;

export const ErrorMessage = styled.div`
  color: ${({ theme }: { theme: Theme }) => theme.colors.ERROR_TEXT};
  margin-top: ${({ theme }: { theme: Theme }) => theme.spacing.sm};
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.sm};
  background-color: ${({ theme }: { theme: Theme }) => theme.colors.ERROR_BG};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.sm};
`;

export const ValidationError = styled.div`
  color: ${({ theme }: { theme: Theme }) => theme.colors.ERROR};
  font-size: 12px;
  margin-top: ${({ theme }: { theme: Theme }) => theme.spacing.xs};
`;

export const FormInput = styled.input`
  width: 100%;
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.sm}
    ${({ theme }: { theme: Theme }) => theme.spacing.md};
  border: 1px solid
    ${({ theme }: { theme: Theme }) => theme.colors.INPUT_BORDER};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.sm};
  background-color: ${({ theme }: { theme: Theme }) =>
    theme.colors.BACKGROUND_PRIMARY};
  color: ${({ theme }: { theme: Theme }) => theme.colors.TEXT_PRIMARY};
  font-size: 14px;
  margin-bottom: ${({ theme }: { theme: Theme }) => theme.spacing.sm};
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }: { theme: Theme }) =>
      theme.colors.INPUT_BORDER_FOCUS};
    background-color: ${({ theme }: { theme: Theme }) =>
      theme.colors.BACKGROUND_PRIMARY};
  }

  &::placeholder {
    color: ${({ theme }: { theme: Theme }) => theme.colors.TEXT_SECONDARY};
  }
`;

export const FormButtonContainer = styled.div`
  display: flex;
  gap: ${({ theme }: { theme: Theme }) => theme.spacing.sm};
  justify-content: space-between;
  align-items: center;
  background-color: ${({ theme }: { theme: Theme }) =>
    theme.colors.BACKGROUND_SECONDARY};
  border-radius: 0 0 ${({ theme }: { theme: Theme }) => theme.borderRadius.md}
    ${({ theme }: { theme: Theme }) => theme.borderRadius.md};
  margin: -${({ theme }: { theme: Theme }) => theme.spacing.lg} -${({
      theme
    }: {
      theme: Theme;
    }) => theme.spacing.lg} -${({ theme }: { theme: Theme }) =>
      theme.spacing.lg} -${({ theme }: { theme: Theme }) => theme.spacing.lg};
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.md}
    ${({ theme }: { theme: Theme }) => theme.spacing.lg};
`;

export const FormButton = styled.button<{ variant: "primary" | "secondary" }>`
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.sm}
    ${({ theme }: { theme: Theme }) => theme.spacing.lg};
  border: none;
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.sm};
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  flex: 1;

  ${({ theme, variant }: { theme: Theme; variant: "primary" | "secondary" }) =>
    variant === "primary"
      ? `
          background-color: ${theme.colors.BUTTON_SUBMIT_BG};
          color: ${theme.colors.BUTTON_SUBMIT_TEXT};

          &:hover:not(:disabled) {
            background-color: ${theme.colors.BUTTON_SUBMIT_BG_HOVER};
          }
        `
      : `
          background-color: ${theme.colors.BUTTON_CANCEL_BG};
          color: ${theme.colors.BUTTON_CANCEL_TEXT};

          &:hover:not(:disabled) {
            background-color: ${theme.colors.BUTTON_CANCEL_BG_HOVER};
          }
        `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
