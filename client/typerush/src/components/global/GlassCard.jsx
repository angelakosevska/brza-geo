import { Card } from "@/components/ui/card";

export default function GlassCard({
  children,
  className = "",
  width = "max-w-[90vw]",
  ...props
}) {
  return (
    <Card
      className={`
        w-full
        ${width}
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
