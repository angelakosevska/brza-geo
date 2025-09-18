import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Loader from "@/components/global/Loader";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loader fullscreen size={64} />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
