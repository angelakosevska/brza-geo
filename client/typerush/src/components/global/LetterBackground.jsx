import React from "react";

export default function LetterBackground({ children }) {
  return (
    <div className="z-0 relative bg-[var(--background)] w-full min-h-screen text-text">
      {/* Floating letters background */}
      <div className="z-0 fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 80 }).map((_, i) => {
          const alphabet = "АБВГДЃЕЖЗЅИЈКЛЉМНЊОПРСТЌУФХЦЧЏШ";
          const letter = alphabet[Math.floor(Math.random() * alphabet.length)];

          const size = Math.floor(40 + Math.random() * 60);
          const top = Math.random() * 100;
          const left = Math.random() * 100;

          const color = "var(--primary)";
          const delay = Math.random() * 6;
          const duration = 4 + Math.random() * 4;
          const opacity = 0.2 + Math.random() * 0.6;

          return (
            <span
              key={i}
              className="absolute font-extrabold animate-float"
              style={{
                top: `${top}vh`,
                left: `${left}vw`,
                fontSize: `${size}px`,
                color,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                opacity,
              }}
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* Page content */}
      <div className="z-10 relative">{children}</div>

      {/* Fixed footer (always at bottom, not pushed by children) */}
      <footer className="bottom-0 left-0 z-10 fixed py-3 w-full text-[var(--primary)]/70 text-xs sm:text-sm text-center">
        © {new Date().getFullYear()} TypeRush. All rights reserved.
      </footer>
    </div>
  );
}
