import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  kicker,
  title,
  extra,
  children,
  testId,
  className,
}: {
  kicker: string;
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <section
      data-testid={testId}
      className={cn(
        "rounded-lg border border-line bg-panel/85 shadow-[0_1px_0_rgb(255_255_255_/_0.03)]",
        className,
      )}
    >
      <header className="flex items-start justify-between gap-2 border-b border-line px-3 py-2">
        <div>
          <div className="text-[10px] tracking-[0.18em] text-mute uppercase">
            {kicker}
          </div>
          <h2 className="text-sm font-medium text-ink">{title}</h2>
        </div>
        {extra}
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}
