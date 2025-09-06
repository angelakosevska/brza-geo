import { Toaster } from "sonner";
import "./App.css";

import AppRoutes from "./routes";

function App() {
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
