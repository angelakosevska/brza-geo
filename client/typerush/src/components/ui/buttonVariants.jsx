import { cva } from "class-variance-authority";
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-[3px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] transition active:translate-y-[2px] active:shadow-inner active:scale-95 hover:translate-y-[1px]",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--primary)] text-[var(--background)] hover:bg-[var(--primary)]/70 rounded-full",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-400/50",
        outline:
          "border-t-1 border-r-3 border-b-3 border-l-1 border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)]/70 hover:text-[var(--background)]",
        secondary:
          "bg-[var(--secondary)] text-[var(--background)] hover:bg-[var(--secondary)]/80",
        ghost: "hover:bg-[var(--accent)]/10 text-[var(--text)]",
        link: "text-[var(--primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 rounded-full py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-full gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-full px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
