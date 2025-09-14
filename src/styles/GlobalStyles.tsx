import { css, Global, useTheme } from "@emotion/react";

export const GlobalStyles = () => {
  const theme = useTheme();

  return (
    <Global
      styles={css`
        *,
        ::before,
        ::after {
          box-sizing: border-box;
          border-width: 0;
          border-style: solid;
          border-color: ${theme.colors.GRAY_200};
        }

        ::before,
        ::after {
          content: "";
        }

        /* Host styling */
        :host {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          pointer-events: none !important;
          z-index: ${theme.zIndex.max} !important;
        }

        /* Ensure our interactive elements can receive pointer events */
        :host button,
        :host form,
        :host input,
        :host [data-interactive] {
          pointer-events: auto !important;
        }

        /* Prevent text selection during drag operations */
        :host [data-interactive]:active,
        :host [data-interactive] *:active {
          user-select: none !important;
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
        }

        /* Base reset */
        html {
          line-height: 1.5;
          -webkit-text-size-adjust: 100%;
          -moz-tab-size: 4;
          tab-size: 4;
          font-family: system-ui, -apple-system, sans-serif;
        }

        body {
          margin: 0;
          line-height: inherit;
        }

        /* Button reset */
        button {
          font-family: inherit;
          font-size: 100%;
          font-weight: inherit;
          line-height: inherit;
          color: inherit;
          margin: 0;
          padding: 0;
        }

        button,
        [role="button"] {
          cursor: pointer;
        }

        /* Form elements reset */
        input {
          font-family: inherit;
          font-size: 100%;
          font-weight: inherit;
          line-height: inherit;
          color: ${theme.colors.GRAY_700};
          background-color: ${theme.colors.BACKGROUND_PRIMARY};
          margin: 0;
          padding: 0;
          border: none;
          box-sizing: border-box;
        }

        /* Animations */
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}
    />
  );
};
