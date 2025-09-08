import { FloatingButton } from "./components/FloatingButton";
import FloatingForm from "./components/FloatingForm";
import { useFloatingButton } from "./hooks/useFloatingButton";
import { useFloatingForm } from "./hooks/useFloatingForm";
import { ThemeProvider } from "./styles/ThemeProvider";
import { GlobalStyles } from "./styles/GlobalStyles";
import { ShadowRootCacheProvider } from "./styles/ShadowRootCacheProvider";
import { useEffect } from "react";

interface ContentAppProps {
  shadowRoot?: ShadowRoot;
}

// Global window interface extension
declare global {
  interface Window {
    jobTrackerExtension?: {
      restoreButton: () => void;
      showButton: () => boolean | null;
      hideButton: () => void;
    };
  }
}

export default function ContentApp({ shadowRoot }: ContentAppProps) {
  const {
    position,
    showForm,
    setShowForm,
    showButton,
    setShowButton,
    handleDragStart,
    handleButtonClick,
    restoreButton,
    buttonRef,
    isDragging
  } = useFloatingButton();

  const { formPosition, handleFormDragStart } = useFloatingForm(
    position,
    showForm
  );

  // Expose restoreButton function globally for console access
  useEffect(() => {
    // Create a function to hide button by using the extension icon
    const hideButton = () => {
      // Since we removed the close button, we'll just inform user to use extension icon
      console.info(
        "Use the extension icon in the browser toolbar to toggle button visibility"
      );
    };

    window.jobTrackerExtension = {
      restoreButton,
      showButton: () => showButton,
      hideButton
    };

    // Listen for messages from the service worker (extension icon toggle)
    const handleMessage = (message: { type: string; showButton?: boolean }) => {
      if (
        message.type === "TOGGLE_FLOATING_BUTTON" &&
        message.showButton !== undefined
      ) {
        setShowButton(message.showButton);
        if (message.showButton) {
          restoreButton();
        }
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      delete window.jobTrackerExtension;
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [restoreButton, showButton, setShowButton]);

  const AppContent = (
    <ThemeProvider>
      <GlobalStyles />
      {!showForm && showButton === true && (
        <FloatingButton
          onClick={handleButtonClick}
          onDrag={handleDragStart}
          buttonRef={buttonRef}
          isDragging={isDragging}
          style={{
            left: position.x,
            top: position.y,
            right: "unset",
            bottom: "unset"
          }}
        />
      )}
      {showForm && (
        <FloatingForm
          onCancel={() => setShowForm(false)}
          onDrag={handleFormDragStart}
          style={
            formPosition.useRightBottom
              ? {
                  right: formPosition.right,
                  bottom: formPosition.bottom,
                  left: "unset",
                  top: "unset",
                  position: "fixed"
                }
              : {
                  left: formPosition.x,
                  top: formPosition.y,
                  right: "unset",
                  bottom: "unset",
                  position: "fixed"
                }
          }
        />
      )}
    </ThemeProvider>
  );

  // If we have a shadow root, we need to use the cache provider
  if (shadowRoot) {
    return (
      <ShadowRootCacheProvider shadowRoot={shadowRoot}>
        {AppContent}
      </ShadowRootCacheProvider>
    );
  }

  return AppContent;
}
