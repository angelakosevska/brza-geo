import * as React from "react";
import { cn } from "@/lib/utils";

const inputBase =
  "w-full min-w-0 border  px-4 py-2 text-[var(--text)]/70 shadow-xs outline-none transition-all " +
  "rounded-full border-2 border-[var(--primary)] " +
  "placeholder: selection:bg-[var(--primary)] selection:text-[var(--background)]/70 " +
  "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

const inputFocus =
  "focus-visible:ring-[2px] focus-visible:ring-[var(--primary)]/20 focus-visible:border-[var(--primary)]/50";

const inputInvalid =
  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive";

function Input({ className, type, status, ...props }, ref) {
  const borderColors = {
    exact: "border-green-500 focus-visible:ring-green-200",
    typo: "border-yellow-500 focus-visible:ring-yellow-200",
    "no-words": "border-orange-500 focus-visible:ring-orange-200",
    "wrong-letter": "border-red-500 focus-visible:ring-red-200",
    "not-in-dictionary": "border-red-500 focus-visible:ring-red-200",
    "not-cyrillic": "border-red-500 focus-visible:ring-red-200",
    empty: "border-gray-300",
  };

  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        inputBase,
        inputFocus,
        inputInvalid,
        borderColors[status] || "",
        className
      )}
      {...props}
    />
  );
}

export { Input };
