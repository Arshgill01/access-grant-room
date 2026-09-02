import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "flex min-h-[88px] w-full rounded-md border border-line bg-canvas px-3 py-2 font-mono text-xs text-ink placeholder:text-mute/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-agent/40",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
