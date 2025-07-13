// src/components/Layout.jsx
import React from "react";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-isabelline text-eerie dark:bg-eerie dark:text-isabelline relative overflow-hidden">
      {/* Floating letters background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {Array.from({ length: 30 }).map((_, i) => {
          const letter = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[
            Math.floor(Math.random() * 26)
          ];
          const size = Math.floor(40 + Math.random() * 60);
          const top = Math.random() * 100;
          const left = Math.random() * 100;
          const r = Math.floor(255 + (78 - 255) * Math.random());
          const g = Math.floor(71 + (154 - 71) * Math.random());
          const b = Math.floor(71 + (208 - 71) * Math.random());
          const delay = Math.random() * 6;
          const duration = 4 + Math.random() * 4;

          return (
            <span
              key={i}
              className="absolute font-bold opacity-40 animate-float"
              style={{
                top: `${top}vh`,
                left: `${left}vw`,
                fontSize: `${size}px`,
                color: `rgba(${r}, ${g}, ${b}, 0.7)`,
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
