// src/components/Layout.jsx
import React from "react";

export default function LetterBackground({ children }) {
  return (
    <div className="w-full h-screen z-0 bg-[var(--background)] text-text relative overflow-hidden">
      {/* Floating letters background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => {
          const letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[
            Math.floor(Math.random() * 26)
          ];

          const size = Math.floor(40 + Math.random() * 60);
          const top = Math.random() * 100;
          const left = Math.random() * 100;

          // Pick a random theme color
          const colors = [
            "var(--primary)",
            "var(--secondary)",
            "var(--accent)",
          ];
          const color = colors[Math.floor(Math.random() * colors.length)];

          const delay = Math.random() * 6;
          const duration = 4 + Math.random() * 4;

          return (
            <span
              key={i}
              className="absolute font-bold opacity-70 animate-float"
              style={{
                top: `${top}vh`,
                left: `${left}vw`,
                fontSize: `${size}px`,
                color: color,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* Page content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
