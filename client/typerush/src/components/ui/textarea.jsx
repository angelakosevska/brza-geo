import * as React from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full min-w-0 border px-4 py-2 text-[var(--text)]/70 shadow-xs outline-none transition-all " +
  "rounded-full border-2 border-[var(--primary)] " +
  "placeholder: selection:bg-[var(--primary)] selection:text-[var(--background)]/70 " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const inputFocus =
  "focus-visible:ring-[2px] focus-visible:ring-[var(--primary)]/20 focus-visible:border-[var(--primary)]/50";

const inputInvalid =
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      className={cn(
        inputBase,
        inputFocus,
        inputInvalid,
        "rounded-2xl resize-y", 
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
