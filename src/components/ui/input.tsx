import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-md border border-line bg-canvas px-3 text-sm text-ink shadow-none placeholder:text-mute/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agent/40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
