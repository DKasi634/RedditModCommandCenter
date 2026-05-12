import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CommandCenterScreen } from "./screens/command-center-screen";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CommandCenterScreen />
  </StrictMode>
);
