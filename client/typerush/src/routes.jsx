import { Routes, Route } from "react-router-dom";
import Welcome from "./pages/WelcomePage";
import Layout from "./Layout";
import Layout1 from "./Layout1";
import Layout2 from "./Layout2";
import MainPage from "./pages/MainPage";
import AuthPage from "./pages/AuthPage";
import RoomPage from "./pages/RoomPage";
import GamePage from "./pages/GamePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import InvitationPage from "./pages/InvitationPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        //one glass card main
        <Route path="/" element={<Welcome />} />
      </Route>
      <Route element={<Layout1 />}>
        //just letter background
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invitation" element={<InvitationPage />} />
      </Route>
      // letters with header
      <Route element={<Layout2 />}>
        <Route path="/main" element={<MainPage />} />
        <Route path="/room/:code" element={<RoomPage />} />
        <Route path="/game/:code" element={<GamePage />} />
      </Route>
    </Routes>
  );
}
