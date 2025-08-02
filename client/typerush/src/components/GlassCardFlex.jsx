import { Card } from "@/components/ui/card";
import React from "react";

/*
bg-[var(--background)]/30
          backdrop-blur-sm
          border border-[var(--background)] 
          rounded-3xl
          shadow-xl shadow-gray-500/20
*/

export default function GlassCardFlex({ children, className = "", ...props }) {
  return (
    <Card
      className={`
         
        h-auto
        bg-[var(--background)]/20
        border border-[var(--background)]
        backdrop-blur-sm
        rounded-3xl md:rounded-4xl        
        shadow-xl
        shadow-gray-500/20    
        sm:p-6 md:p-8  
        flex flex-col
        ${className}
      `}
      {...props}
    >
      {children}
    </Card>
  );
}
