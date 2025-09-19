import { LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function Loader({ fullscreen = false, size = 48 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // trigger fade in after mount
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex items-center justify-center transition-opacity duration-300 ${
        fullscreen ? "fixed inset-0 bg-[var(--background)]/60 backdrop-blur-lg z-50" : ""
      } ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .spin {
            animation: spin 1s linear infinite;
          }
        `}
      </style>

      {/* Centered column: logo on top, spinner below */}
      <div className="flex flex-col items-center gap-4">
        <img
          src="/tr2.svg"
          alt="Type Rush Logo"
          className="w-24 h-24 blink-cursor"
        />
        <LoaderCircle
          className="text-[var(--primary)] spin"
          size={size}
        />
      </div>
    </div>
  );
}
