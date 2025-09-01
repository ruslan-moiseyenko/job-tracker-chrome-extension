import React from "react";
import { createRoot } from "react-dom/client";
import ContentApp from "./ContentApp";

const rootId = "job-tracker-shadow-host";

// Function to create Shadow DOM
function createShadowRoot() {
  let shadowHost = document.getElementById(rootId);

  if (!shadowHost) {
    // Create shadow host element
    shadowHost = document.createElement("div");
    shadowHost.id = rootId;

    // Minimal host styling - the shadow DOM will handle the rest
    Object.assign(shadowHost.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      pointerEvents: "none",
      zIndex: "2147483647"
    });

    document.body.appendChild(shadowHost);
  }

  // Create shadow root (closed mode for better encapsulation)
  const shadowRoot = shadowHost.attachShadow({ mode: "closed" });

  // Create container for React app (Emotion will handle CSS injection)
  const reactContainer = document.createElement("div");
  Object.assign(reactContainer.style, {
    width: "100%",
    height: "100%",
    pointerEvents: "none"
  });
  shadowRoot.appendChild(reactContainer);

  return { reactContainer, shadowRoot };
}

// Create shadow DOM and render React app
const { reactContainer, shadowRoot } = createShadowRoot();
const root = createRoot(reactContainer);

root.render(
  <React.StrictMode>
    <ContentApp shadowRoot={shadowRoot} />
  </React.StrictMode>
);
