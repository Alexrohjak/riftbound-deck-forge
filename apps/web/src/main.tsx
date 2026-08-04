import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";
import { watchForFailures } from "./diagnostics.js";
import "./styles.css";

// Before the app mounts: a crash during the first render is the one most worth catching.
watchForFailures();

const root = document.getElementById("root");
if (!root) throw new Error("#root is missing from index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
