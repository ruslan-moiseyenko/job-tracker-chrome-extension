import FloatingButton from "./FloatingButton";
import EnhancedFloatingForm from "./components/EnhancedFloatingForm";
import { useFloatingButton } from "./hooks/useFloatingButton";
import { useFloatingForm } from "./hooks/useFloatingForm";
import { ThemeProvider } from "./styles/ThemeProvider";
import { GlobalStyles } from "./styles/GlobalStyles";
import { ShadowRootCacheProvider } from "./styles/ShadowRootCacheProvider";

interface ContentAppProps {
  shadowRoot?: ShadowRoot;
}

export default function ContentApp({ shadowRoot }: ContentAppProps) {
  const { position, showForm, setShowForm, handleDragStart, handleButtonClick, buttonRef, isDragging } = useFloatingButton();

  const { formPosition, handleFormDragStart } = useFloatingForm(position, showForm);

  const AppContent = (
    <ThemeProvider>
      <GlobalStyles />
      {!showForm && (
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
        <EnhancedFloatingForm
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
    return <ShadowRootCacheProvider shadowRoot={shadowRoot}>{AppContent}</ShadowRootCacheProvider>;
  }

  return AppContent;
}
