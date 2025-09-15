import { createContext, useContext, useState } from "react";
import Loader from "@/components/global/Loader";

const LoadingContext = createContext();

export function LoadingProvider({ children }) {
  const [loading, setLoading] = useState(false);
  return (
    <LoadingContext.Provider value={{ setLoading }}>
      {loading && <Loader fullscreen />}
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}
