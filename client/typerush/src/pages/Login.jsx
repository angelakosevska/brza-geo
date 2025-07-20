import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import clsx from "clsx";
import GlassCard from "@/components/GlassCard";

export default function AuthPanel() {
  const [flipped, setFlipped] = useState(false);

  return (
    <>
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md h-[400px] sm:h-[440px] md:h-[480px] flex items-center justify-center">
        <div
          className={clsx(
            "relative w-full h-full rounded-4xl transition-transform duration-800  shadow-xl border border-[var(--background)] bg-[var(--background)]/20"
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front Side: Login */}
          <div
            className={clsx(
              "absolute inset-0 flex flex-col justify-center items-center rounded-3xl sm:rounded-4xl",
              "backdrop-blur-xs border border-[var(--background)]/30 transition-all duration-500 backface-hidden"
            )}
            style={{ backfaceVisibility: "hidden" }}
          >
            <form className="flex flex-col gap-4 p-5 sm:p-8 w-full max-w-xs mx-auto">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 text-[var(--primary)] text-center">
                Login 🚀
              </h2>
              <Input type="email" placeholder="Email" autoComplete="username" />
              <Input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
              />
              <Button
                className="mt-2 w-full"
                style={{
                  background: "var(--primary)",
                  color: "var(--background)",
                }}
                type="submit"
              >
                Log In
              </Button>
              <Button
                variant="link"
                className="text-xs sm:text-sm mt-4"
                onClick={(e) => {
                  e.preventDefault();
                  setFlipped(true);
                }}
                style={{ color: "var(--primary)" }}
                type="button"
              >
                👉 No account? <span className="font-semibold">Register</span>
              </Button>
            </form>
          </div>

          {/* Back Side: Register */}
          <div
            className={clsx(
              "absolute inset-0 flex flex-col justify-center items-center rounded-3xl sm:rounded-4xl",
              "bg-[var(--background)]/20 backdrop-blur-xs border border-[var(--background)]/30 transition-all duration-500 backface-hidden"
            )}
            style={{
              transform: "rotateY(180deg)",
              backfaceVisibility: "hidden",
            }}
          >
            <form className="flex flex-col gap-4 p-5 sm:p-8 w-full max-w-xs mx-auto">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold mb-2 text-[var(--primary)] text-center">
                Register 🎉
              </h2>
              <Input type="email" placeholder="Email" autoComplete="username" />
              <Input
                type="password"
                placeholder="Password"
                autoComplete="new-password"
              />
              <Input
                type="password"
                placeholder="Repeat Password"
                autoComplete="new-password"
              />
              <Button
                className="mt-2 w-full"
                style={{
                  background: "var(--primary)",
                  color: "var(--background)",
                }}
                type="submit"
              >
                Register
              </Button>
              <Button
                variant="link"
                className="text-xs sm:text-sm mt-4"
                onClick={(e) => {
                  e.preventDefault();
                  setFlipped(false);
                }}
                style={{ color: "var(--primary)" }}
                type="button"
              >
                👈 Have an account? <span className="font-semibold">Login</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
      {/* Only utility for hiding backface */}
      <style>{`
        .backface-hidden { backface-visibility: hidden; }
      `}</style>
    </>
  );
}
