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
          background-color: ${theme.colors.WHITE};
          margin: 0;
          padding: 0;
          border: none;
          box-sizing: border-box;
        }
      `}
    />
  );
};
