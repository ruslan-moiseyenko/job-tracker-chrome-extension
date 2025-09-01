import React from "react";
import { createRoot } from "react-dom/client";
import ContentApp from "./ContentApp";

const rootId = "job-tracker-content-root";
let rootDiv = document.getElementById(rootId);
if (!rootDiv) {
  rootDiv = document.createElement("div");
  rootDiv.id = rootId;
  rootDiv.style.position = "fixed";
  rootDiv.style.zIndex = "2147483647";
  rootDiv.style.top = "0";
  rootDiv.style.left = "0";
  rootDiv.style.width = "100vw";
  rootDiv.style.height = "100vh";
  rootDiv.style.pointerEvents = "none";
  document.body.appendChild(rootDiv);
}

const root = createRoot(rootDiv);
root.render(
  <React.StrictMode>
    <ContentApp />
  </React.StrictMode>
);
