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
    buttonRef
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
          style={{
            left: formPosition.x,
            top: formPosition.y,
            right: "unset",
            bottom: "unset",
            position: "fixed"
          }}
        />
      )}
    </>
  );
}
