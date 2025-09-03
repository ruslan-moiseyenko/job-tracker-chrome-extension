import styled from "@emotion/styled";

export const FloatingButtonContainer = styled.button`
  position: fixed !important;
  width: ${({ theme }) => theme.sizes.button.width};
  height: ${({ theme }) => theme.sizes.button.height};
  background-color: ${({ theme }) => theme.colors.PRIMARY};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  box-shadow: ${({ theme }) => theme.shadows.BUTTON};
  cursor: pointer;
  transition: box-shadow 0.2s ease-in-out;
  pointer-events: auto;
  z-index: ${({ theme }) => theme.zIndex.max};
  display: flex;
  align-items: center;
  justify-content: center;
  outline: none;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;

  &:hover {
    box-shadow: ${({ theme }) => theme.shadows.BUTTON_HOVER};
  }

  &:focus {
    outline: none;
  }

  &:active {
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -ms-user-select: none !important;
  }
`;

export const ButtonIcon = styled.div`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.ICON_WHITE};
`;
