import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/Welcome";
import AuthPanel from "./pages/Login";
import Layout from "./Layout";
import Layout1 from "./Layout1";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Welcome />} />
      </Route>
      <Route element={<Layout1 />}>
        <Route path="/auth" element={<AuthPanel />} />
      </Route>
    </Routes>
  );
}
