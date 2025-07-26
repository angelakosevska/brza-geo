import { Card } from "@/components/ui/card";
import React from "react";

export default function GlassCard({ children }) {
  return (
    <Card
      className={`
        w-[90vw] h-[90vh]
        bg-[var(--background)]/20
        border border-[var(--background)]
        backdrop-blur-xs
        rounded-4xl        
        shadow-xl
        shadow-gray-500/20    
        p-4 
      `}
    >
      {children}
    </Card>
  );
}
