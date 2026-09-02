import { Database, Lock, ScrollText, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UNTRUSTED_CLOSE, UNTRUSTED_OPEN } from "@/engine/untrusted";
import { useRoomState } from "@/ui/room-context";
import { Panel } from "@/ui/panel";

export function LeftRail() {
  const state = useRoomState();
  const prod = state.catalog.resources.find((r) => r.id === "prod-db");

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <Panel
        kicker="Active mandate"
        title={`TTL ≤ ${state.mandate.max_ttl_hours}h · v${state.mandate.version}`}
        testId="mandate-panel"
      >
        <p className="text-xs text-mute">
          Ceiling the agent cannot raise. Write is allowlisted here, then denied
          on prod-db by resource policy.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md border border-line bg-canvas px-2 py-1.5">
            <dt className="text-[10px] tracking-wider text-mute uppercase">
              Max TTL
            </dt>
            <dd className="font-mono text-human">{state.mandate.max_ttl_hours}h</dd>
          </div>
          <div className="rounded-md border border-line bg-canvas px-2 py-1.5">
            <dt className="text-[10px] tracking-wider text-mute uppercase">
              Allowlisted roles
            </dt>
            <dd className="flex gap-1">
              {state.mandate.allowlisted_roles.map((r) => (
                <Badge key={r} tone={r === "write" ? "human" : "ok"}>
                  {r}
                </Badge>
              ))}
            </dd>
          </div>
        </dl>
        <div className="mt-3 flex items-start gap-2 rounded-md border border-line bg-canvas p-2 text-xs text-mute">
          <Lock className="mt-0.5 size-3.5 shrink-0 text-human" />
          Agent may tighten or cancel a draft. Only a human click can Issue.
        </div>
      </Panel>

      <Panel
        kicker="Untrusted ticket"
        title={state.ticket.title}
        testId="ticket-panel"
        extra={<Badge tone="danger">Untrusted</Badge>}
      >
        <p className="mb-2 text-[11px] text-mute">
          Tool results wrap this body in{" "}
          <span className="font-mono text-danger">{UNTRUSTED_OPEN}</span> …{" "}
          <span className="font-mono text-danger">{UNTRUSTED_CLOSE}</span>. The
          planted line is not an approval.
        </p>
        <pre
          data-testid="untrusted-ticket"
          className="max-h-56 overflow-auto rounded-md border border-danger/25 bg-canvas p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-ink/90"
        >
          {state.ticket.body_untrusted}
        </pre>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-mute">
          <ScrollText className="size-3" />
          {state.ticket.id} · synthetic incident
        </p>
      </Panel>

      <Panel kicker="Resource policy" title="prod-db vs staging-db">
        <ul className="space-y-2 text-xs">
          {state.catalog.resources.map((r) => (
            <li
              key={r.id}
              className="rounded-md border border-line bg-canvas p-2"
            >
              <div className="flex items-center gap-2">
                <Database className="size-3.5 text-agent" />
                <span className="font-mono">{r.id}</span>
                <Badge tone={r.environment === "production" ? "human" : "mute"}>
                  {r.environment}
                </Badge>
              </div>
              <p className="mt-1 text-mute">{r.notes}</p>
              <p className="mt-1">
                allow {r.allowed_roles.join(", ") || "—"}
                {r.denied_roles.length
                  ? ` · deny ${r.denied_roles.join(", ")}`
                  : ""}
              </p>
            </li>
          ))}
        </ul>
        {prod ? (
          <p className="mt-2 text-[11px] text-danger">
            Write on {prod.id} is a guaranteed refusal — even if the ticket
            claims it was already approved.
          </p>
        ) : null}
        <div className="mt-3 border-t border-line pt-2">
          <p className="mb-1 text-[10px] tracking-wider text-mute uppercase">
            People
          </p>
          <ul className="space-y-1 text-xs">
            {state.catalog.people.map((p) => (
              <li key={p.id} className="flex items-center gap-2">
                <User className="size-3 text-mute" />
                <span className="font-mono">{p.id}</span>
                <span className="text-mute">
                  {p.display_name} · {p.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Panel>
    </div>
  );
}
