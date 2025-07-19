import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

export default function AuthPanel() {
  const [panel, setPanel] = useState("login");

  return (
    <div className="relative w-[50vw] min-w-[50vw] max-w-[60vw] h-[80vh] min-h-[400px] max-h-[700px] flex gap-4 rounded-4xl overflow-hidden p-4">
      {/* Login Form */}
      <div
        className={clsx(
          "relative flex-1 flex flex-col justify-center items-center m-2 rounded-4xl shadow-xl transition-all duration-500",
          "bg-[var(--background)]/60 backdrop-blur-xl border border-[var(--background)]/30",
          panel === "login"
            ? "ring-4 ring-[var(--accent)]/60 scale-105 animate-glow"
            : "ring-0 scale-100"
        )}
        style={{
          transition: "all 0.35s cubic-bezier(.65,-0.15,.35,1.15)",
        }}
      >
        <div className="flex flex-col gap-4 p-8 w-full max-w-xs">
          <h2 className="text-3xl font-extrabold mb-2 text-[var(--primary)] text-center">
            Login 🚀
          </h2>
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
          <Button
            className="mt-2 w-full"
            style={{ background: "var(--primary)", color: "var(--background)" }}
          >
            Log In
          </Button>
          <Button
            variant="link"
            className="text-sm mt-4"
            onClick={() => setPanel("register")}
            style={{ color: "var(--primary)" }}
          >
            👉 No account? <span className="font-semibold">Register</span>
          </Button>
        </div>
        {/* Overlay when inactive */}
        {panel !== "login" && (
          <div className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-xl border border-[var(--background)]/30 z-20  rounded-4xl transition-all duration-300" />
        )}
      </div>

      {/* Register Form */}
      <div
        className={clsx(
          "relative flex-1 flex flex-col justify-center items-center m-2 rounded-4xl shadow-xl transition-all duration-500",
          "bg-[var(--background)]/60 backdrop-blur-xl border border-[var(--background)]/30",
          panel === "register"
            ? "ring-4 ring-[var(--accent)]/60 scale-105 animate-glow"
            : "ring-0 scale-100"
        )}
        style={{
          transition: "all 0.35s cubic-bezier(.65,-0.15,.35,1.15)",
        }}
      >
        <div className="flex flex-col gap-4 p-8 w-full max-w-xs">
          <h2 className="text-3xl font-extrabold mb-2 text-[var(--primary)] text-center">
            Register 🎉
          </h2>
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Password" />
          <Input type="password" placeholder="Repeat Password" />
          <Button
            className="mt-2 w-full"
            style={{
              background: "var(--primary)",
              color: "var(--background)",
            }}
          >
            Register
          </Button>
          <Button
            variant="link"
            className="text-sm mt-4"
            onClick={() => setPanel("login")}
            style={{ color: "var(--primary)" }}
          >
            👈 Have an account? <span className="font-semibold">Login</span>
          </Button>
        </div>
        {/* Overlay when inactive */}
        {panel !== "register" && (
          <div className="absolute inset-0 bg-[var(--background)]/80 backdrop-blur-xl border border-[var(--background)]/30 z-20 rounded-4xl transition-all duration-300" />
        )}
      </div>

      {/* Custom Glow Animation */}
      <style>{`
        @keyframes glow {
          0% { box-shadow: 0 0 0px 0 var(--accent); }
          70% { box-shadow: 0 0 12px 0 var(--accent); }
          100% { box-shadow: 0 0 0px 0 var(--accent); }
        }
        .animate-glow {
          animation: glow 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
