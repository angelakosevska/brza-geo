import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/WelcomePage";
import Layout from "./Layout";
import Layout1 from "./Layout1";
import MainPage from "./pages/MainPage";
import TestPage from "./pages/TestPage";
import AuthPage from "./pages/AuthPage";
import RoomPage from "./pages/RoomPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {" "}
        //one glass card main
        <Route path="/" element={<Welcome />} />
      </Route>
      <Route element={<Layout1 />}>
        //just letter background
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/main" element={<MainPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />{" "}
        <Route path="/room/:code" element={<RoomPage />} />
        <Route path="/test" element={<TestPage />} />
      </Route>
    </Routes>
  );
}
