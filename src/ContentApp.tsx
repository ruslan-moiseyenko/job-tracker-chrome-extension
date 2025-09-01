import FloatingButton from "./FloatingButton";
import FloatingForm from "./FloatingForm";
import { useFloatingButton } from "./hooks/useFloatingButton";
import { useFloatingForm } from "./hooks/useFloatingForm";

export default function ContentApp() {
  const {
    position,
    showForm,
    setShowForm,
    handleDragStart,
    handleButtonClick,
    buttonRef,
    isDragging
  } = useFloatingButton();

  const { formPosition, handleFormDragStart } = useFloatingForm(
    position,
    showForm
  );

  return (
    <>
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
    </>
  );
}
