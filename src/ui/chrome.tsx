import {
  AlertTriangle,
  Fingerprint,
  Radio,
  RotateCcw,
  Shield,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deriveJudgePath } from "@/engine/judge";
import { useRoom, useRoomState } from "@/ui/room-context";

export function HeaderBar() {
  const room = useRoom();
  const state = useRoomState();
  const host =
    state.webmcp.host === "none"
      ? "no host — use Agent console"
      : `${state.webmcp.host}.modelContext`;

  return (
    <header className="flex flex-wrap items-center gap-3 border-b border-line bg-panel/90 px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border border-human/40 bg-human/10 text-human">
          <Shield className="size-4" />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <h1 className="font-display text-lg leading-none font-bold tracking-tight">
              Access Grant Room
            </h1>
            <span className="font-mono text-[10px] text-mute">AGR</span>
          </div>
          <p className="mt-0.5 text-xs text-mute">
            Agent proposes. Human issues. Authority never climbs.
          </p>
        </div>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Badge tone="line">Demo fixtures</Badge>
        <Badge tone="human">
          <Fingerprint className="mr-1 size-3" />
          Human issues
        </Badge>
        <Badge tone={state.webmcp.available ? "agent" : "mute"}>
          <Radio className="mr-1 size-3" />
          WebMCP · {host}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => room.resetDemo()}
          title="Reset seeded demo"
        >
          <RotateCcw />
          Reset
        </Button>
      </div>
    </header>
  );
}

export function JudgeStrip() {
  const state = useRoomState();
  const steps = deriveJudgePath(state);
  const done = steps.filter((s) => s.done).length;

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto border-b border-line bg-canvas px-4 py-2"
      data-testid="judge-strip"
    >
      <span className="shrink-0 font-mono text-[10px] tracking-widest text-mute uppercase">
        60s path {done}/{steps.length}
      </span>
      {steps.map((step) => (
        <span
          key={step.id}
          data-testid={`judge-step-${step.id}`}
          data-done={step.done ? "true" : "false"}
          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] ${
            step.done
              ? "border-ok/30 bg-ok/10 text-ok"
              : "border-line bg-panel text-mute"
          }`}
        >
          <span className="font-mono text-[10px]">{step.n}</span>
          {step.label}
        </span>
      ))}
    </div>
  );
}

export function RefusalBanner() {
  const room = useRoom();
  const state = useRoomState();
  const evidence = state.last_refusal;
  if (!evidence) return null;

  const missing = evidence.code === "STRUCTURALLY_MISSING_TOOL";

  return (
    <div
      data-testid="refusal-banner"
      className={`flex items-start gap-3 border-b px-4 py-2.5 ${
        missing
          ? "border-human/30 bg-human/8"
          : "border-danger/30 bg-danger/8"
      }`}
    >
      <AlertTriangle
        className={`mt-0.5 size-4 shrink-0 ${missing ? "text-human" : "text-danger"}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] tracking-wide uppercase">
            {missing ? "Tool absent" : "Refused"}
          </span>
          <Badge tone={missing ? "human" : "danger"}>{evidence.code}</Badge>
        </div>
        <p className="mt-1 text-sm text-ink/90">{evidence.message}</p>
        {evidence.notes?.length ? (
          <ul className="mt-1 list-disc pl-4 text-xs text-mute">
            {evidence.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Dismiss refusal"
        onClick={() => room.clearRefusal()}
      >
        <X />
      </Button>
    </div>
  );
}
