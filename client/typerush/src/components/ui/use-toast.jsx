"use client";

import * as React from "react";
import { toast as sonner } from "sonner";

export function useToast() {
  const toast = React.useCallback((options) => {
    sonner(options.title ?? "", {
      description: options.description,
      className:
        options.variant === "destructive"
          ? "bg-red-500 text-[var(--text)]"
          : "bg-green-500 text-[var(--text)]",
    });
  }, []);

  return { toast };
}
