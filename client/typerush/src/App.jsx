import { Toaster } from "sonner";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import AppRoutes from "./routes";
import { useError } from "./hooks/useError";
import { setAxiosUtils } from "./lib/axios";

function App() {
  const navigate = useNavigate();
  const { showError } = useError();

  useEffect(() => {
    setAxiosUtils({ navigate, showError });
  }, [navigate, showError]);
  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-right"
        closeButton
        toastOptions={{
          style: {
            borderRadius: "12px",
            border: "var(--background)",
            padding: "12px 16px",
            fontFamily: "var(--font-rubik)",
            fontSize: "14px",
          },
        }}
      />
    </>
  );
}

export default App;
