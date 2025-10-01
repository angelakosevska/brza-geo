import { Card } from "@/components/ui/card";

export default function GlassCard({
  children,
  className = "",

  ...props
}) {
  return (
    <Card
      className={`
        w-full
        max-w-[90vw]
        h-auto
        bg-[var(--background)]/20
        border border-[var(--background)]
        backdrop-blur-sm
        rounded-3xl md:rounded-4xl        
        shadow-xl
        shadow-gray-500/20    
        p-4
        flex flex-col
        ${className}
      `}
      {...props}
    >
      {children}
    </Card>
  );
}
