import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { createSeededRoom } from "./engine/room";
import "./index.css";

const room = createSeededRoom();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App store={room} />
  </StrictMode>,
);
