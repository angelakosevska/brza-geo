import { Card } from "@/components/ui/card";
import React from "react";

export default function GlassCard({ children }) {
  return (
    <Card
      className={`
        w-full max-w-[90vw] h-auto md:h-[90vh]
        bg-[var(--background)]/20
        border border-[var(--background)]
        backdrop-blur-sm
        rounded-3xl md:rounded-4xl        
        shadow-xl
        shadow-gray-500/20    
        sm:p-6 md:p-8  
        flex flex-col
      `}
    >
      {children}
    </Card>
  );
}
