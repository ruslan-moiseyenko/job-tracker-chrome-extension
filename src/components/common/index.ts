// prettier-ignore-file
/* eslint-disable max-len */

import styled from "@emotion/styled";
import type { Theme } from "../../styles/theme";

// Reusable Alert component
export const Alert = styled.div<{
  variant: "success" | "warning" | "error" | "info";
}>`
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.sm} ${({ theme }: { theme: Theme }) => theme.spacing.md};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.sm};
  margin-bottom: ${({ theme }: { theme: Theme }) => theme.spacing.md};
  font-size: 12px;
  display: flex;
  align-items: center;

  ${({ theme, variant }: { theme: Theme; variant: "success" | "warning" | "error" | "info" }) => {
    switch (variant) {
      case "success":
        return `
          background-color: ${theme.colors.SUCCESS_BG};
          border: 1px solid ${theme.colors.SUCCESS};
          color: ${theme.colors.SUCCESS_TEXT};
        `;
      case "warning":
        return `
          background-color: ${theme.colors.WARNING_BG};
          border: 1px solid ${theme.colors.WARNING_BORDER};
          color: ${theme.colors.WARNING_TEXT};
        `;
      case "error":
        return `
          background-color: ${theme.colors.ERROR_BG};
          border: 1px solid ${theme.colors.ERROR};
          color: ${theme.colors.ERROR_TEXT};
        `;
      case "info":
        return `
          background-color: ${theme.colors.INFO_BG};
          border: 1px solid ${theme.colors.INFO};
          color: ${theme.colors.INFO_TEXT};
        `;
      default:
        return `
          background-color: ${theme.colors.BACKGROUND_SECONDARY};
          border: 1px solid ${theme.colors.GRAY_300};
          color: ${theme.colors.TEXT_PRIMARY};
        `;
    }
  }}
`;

// Reusable Status Badge
export const StatusBadge = styled.span<{
  status: "online" | "offline" | "pending";
}>`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }: { theme: Theme }) => theme.spacing.xs} ${({ theme }: { theme: Theme }) => theme.spacing.sm};
  border-radius: ${({ theme }: { theme: Theme }) => theme.borderRadius.full};
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;

  ${({ theme, status }: { theme: Theme; status: "online" | "offline" | "pending" }) => {
    switch (status) {
      case "online":
        return `
          background-color: ${theme.colors.SUCCESS_BG};
          color: ${theme.colors.SUCCESS};
        `;
      case "offline":
        return `
          background-color: ${theme.colors.ERROR_BG};
          color: ${theme.colors.ERROR};
        `;
      case "pending":
        return `
          background-color: ${theme.colors.WARNING_BG};
          color: ${theme.colors.WARNING_TEXT};
        `;
      default:
        return `
          background-color: ${theme.colors.BACKGROUND_SECONDARY};
          color: ${theme.colors.TEXT_SECONDARY};
        `;
    }
  }}
`;
