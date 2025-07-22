import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "D:/Diplomska/BrzaGeo/client/typerush/src/assets/fonts/fonts.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
