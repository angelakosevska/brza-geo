// src/routes.jsx
import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
    </Routes>
  );
}
