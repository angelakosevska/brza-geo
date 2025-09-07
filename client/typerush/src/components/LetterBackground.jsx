// src/components/Layout.jsx
import React from "react";

export default function LetterBackground({ children }) {
  return (
    <div className="z-0 relative bg-[var(--background)] w-full h-auto overflow-hidden text-text">
      {/* Floating letters background */}
      <div className="z-0 absolute inset-0 pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => {
          const letter = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ"[
            Math.floor(Math.random() * 26)
          ];

          const size = Math.floor(40 + Math.random() * 60);
          const top = Math.random() * 100;
          const left = Math.random() * 100;

          // Pick a random theme color
          const colors = ["var(--primary)"];
          const color = colors[Math.floor(Math.random() * colors.length)];

          const delay = Math.random() * 6;
          const duration = 4 + Math.random() * 4;
          const opacity = 0.2 + Math.random() * 0.6;

          return (
            <span
              key={i}
              className="absolute opacity-60 font-extrabold animate-float"
              style={{
                top: `${top}vh`,
                left: `${left}vw`,
                fontSize: `${size}px`,
                color: color,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                opacity: opacity,
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* Page content */}
      <div className="z-10 relative">{children}</div>
      {/* 
      <footer className="z-10 relative py-3 text-[var(--primary)]/70 text-xs sm:text-sm text-center">
        © {new Date().getFullYear()} TypeRush. All rights reserved.
      </footer> */}
    </div>
  );
}
