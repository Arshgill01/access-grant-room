import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  tone = "mute",
  ...props
}: HTMLAttributes<HTMLSpanElement> & {
  tone?: "mute" | "human" | "agent" | "danger" | "ok" | "line";
}) {
  const tones: Record<string, string> = {
    mute: "border-line text-mute bg-panel-2",
    human: "border-human/30 text-human bg-human/10",
    agent: "border-agent/30 text-agent bg-agent/10",
    danger: "border-danger/30 text-danger bg-danger/10",
    ok: "border-ok/30 text-ok bg-ok/10",
    line: "border-line text-ink bg-transparent",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
