import { Card } from "@/components/ui/card";
import React from "react";

export default function GlassCard({ children, className = "" }) {
  return (
    <Card
      className={`
        w-full max-w-4xl
        bg-white/10 
        backdrop-blur-md 
        rounded-2xl 
        shadow-lg 
        text-center       
        flex flex-col items-center justify-center
        ${className}
      `}
    >
      {children}
    </Card>
  );
}
