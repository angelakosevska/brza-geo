import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import clsx from "clsx"; // Optional, for className merging
import LetterBackground from "@/components/LetterBackground";
import GlassCard from "@/components/GlassCard";

export default function AuthPanel() {
  const [panel, setPanel] = useState("login");

  return (
    <>
      <div className="z-10 relative w-[350px] h-[420px] flex align-middle justify-center overflow-hidden rounded-2xl shadow-xl bg-[var(--backrground)] text-[var(--tecxt)]">
        {/* Login Form */}
        <div
          className={clsx(
            "absolute top-0 left-0 w-full h-full transition-all duration-500",
            panel === "login"
              ? "opacity-100 translate-x-0 z-10"
              : "opacity-0 -translate-x-10 pointer-events-none z-0"
          )}
        >
          <div className="flex flex-col gap-4 p-8">
            <h2 className="text-2xl font-bold mb-2">Login</h2>
            <Input type="email" placeholder="Email" />
            <Input type="password" placeholder="Password" />
            <Button className="mt-2 w-full">Log In</Button>
            <Button
              variant="link"
              className="text-sm mt-4"
              onClick={() => setPanel("register")}
            >
              No account? Register
            </Button>
          </div>
        </div>

        {/* Register Form */}
        <div
          className={clsx(
            "absolute top-0 left-0 w-full h-full transition-all duration-500",
            panel === "register"
              ? "opacity-100 translate-x-0 z-10"
              : "opacity-0 translate-x-10 pointer-events-none z-0"
          )}
        >
          <div className="flex flex-col gap-4 p-8">
            <h2 className="text-2xl font-bold mb-2">Register</h2>
            <Input type="email" placeholder="Email" />
            <Input type="password" placeholder="Password" />
            <Input type="password" placeholder="Repeat Password" />
            <Button className="mt-2 w-full">Register</Button>
            <Button
              variant="link"
              className="text-sm mt-4"
              onClick={() => setPanel("login")}
            >
              Have an account? Login
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
