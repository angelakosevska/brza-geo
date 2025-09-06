import { toast } from "sonner";

export function useError() {
  return {
    showError: (message) =>
      toast.error(message, {
        style: {
          background: "var(--accent)", // coral error
          color: "white",
        },
      }),

    showSuccess: (message) =>
      toast.success(message, {
        style: {
          background: "var(--primary)", // mint success
          color: "white",
        },
      }),

    showInfo: (message) =>
      toast(message, {
        style: {
          background: "var(--secondary)", // purple info
          color: "white",
        },
      }),
  };
}
