import { Card } from "@/components/ui/card";
import React from "react";

export default function GlassCard({ children, className = "" }) {
  return (
    <Card
      className={`
        w-full max-w-[90vh]
        bg-[var(--background)]/20
        border border-[var(--background)]/30
        backdrop-blur-md
        rounded-2xl
        p-4
        shadow-lg
        text-center
        ${className}
      `}
    >
      {children}
    </Card>
  );
}
