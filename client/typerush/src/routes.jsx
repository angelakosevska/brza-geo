import { Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./pages/WelcomePage";
import Layout from "./layout/Layout";
import Layout1 from "./layout/Layout1";
import Layout2 from "./layout/Layout2";
import MainPage from "./pages/MainPage";
import AuthPage from "./pages/AuthPage";
import RoomPage from "./pages/RoomPage";
import GamePage from "./pages/GamePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import InvitationPage from "./pages/InvitationPage";
import PrivateRoute from "./components/PrivateRoute";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/global/Loader";
import AdminReviewPanelPage from "./pages/admin/AdminReviewPanelPage";

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullscreen size={64} />;
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/"
          element={user ? <Navigate to="/main" replace /> : <Welcome />}
        />
      </Route>

      <Route element={<Layout1 />}>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/invitation" element={<InvitationPage />} />
      </Route>

      <Route element={<Layout2 />}>
        <Route
          path="/main"
          element={
            <PrivateRoute>
              <MainPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/room/:code"
          element={
            <PrivateRoute>
              <RoomPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/game/:code"
          element={
            <PrivateRoute>
              <GamePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/review-panel"
          element={
            <PrivateRoute>
              <AdminReviewPanelPage />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  );
}
