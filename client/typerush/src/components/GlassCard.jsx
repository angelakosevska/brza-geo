import { Card } from "@/components/ui/card";
import React from "react";

export default function GlassCard({ children }) {
  return (
    <Card
      className={`
        w-[90vw] h-[90vh]
        bg-[var(--background)]/20
        border border-[var(--background)]
        backdrop-blur-sm
        rounded-4xl        
        shadow-2xs        
      `}
    >
      {children}
    </Card>
  );
}
