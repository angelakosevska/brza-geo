import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/WelcomePage";
import Layout from "./Layout";
import Layout1 from "./Layout1";
import MainPage from "./pages/MainPage";
import AuthPage from "./pages/AuthPage";
import RoomPage from "./pages/RoomPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Welcome />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
      </Route>
      <Route element={<Layout1 />}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>
    </Routes>
  );
}
