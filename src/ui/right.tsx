import { useMemo, useState } from "react";
import { Play, Terminal, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  JUDGE_PROPOSE_READ,
  JUDGE_PROPOSE_WRITE,
  runJudgeToolScript,
} from "@/engine/judge";
import { TOOL_CATALOG } from "@/engine/tools";
import { formatTime, prettyJson } from "@/lib/utils";
import { useRoom, useRoomState } from "@/ui/room-context";
import { Panel } from "@/ui/panel";

const EXAMPLES: Record<string, unknown> = {
  get_room: {},
  list_catalog: {},
  propose_grant: JUDGE_PROPOSE_READ,
  tighten_proposal: { proposal_id: "", ttl_hours: 2 },
  cancel_proposal: { proposal_id: "" },
  get_activity: {},
  request_mandate_change: {
    max_ttl_hours: 12,
    note: "Need a longer window; human must confirm.",
  },
};

export function RightRail() {
  return (
    <div className="flex min-h-0 flex-col gap-3">
      <ToolsPanel />
      <AgentConsole />
      <ActivityLog />
    </div>
  );
}

function ToolsPanel() {
  const state = useRoomState();
  return (
    <Panel
      kicker="Live tools"
      title={`${TOOL_CATALOG.length} registered`}
      testId="tools-panel"
      extra={
        <Badge tone={state.webmcp.available ? "agent" : "mute"}>
          {state.webmcp.available ? "WebMCP host" : "in-page only"}
        </Badge>
      }
    >
      <ul className="space-y-1.5">
        {TOOL_CATALOG.map((t) => (
          <li
            key={t.name}
            className="rounded-md border border-line bg-canvas px-2 py-1.5"
          >
            <div className="flex items-center gap-2">
              <Wrench className="size-3 text-agent" />
              <span className="font-mono text-xs">{t.name}</span>
              {t.annotations.readOnlyHint ? (
                <Badge tone="mute">read</Badge>
              ) : (
                <Badge tone="agent">write</Badge>
              )}
            </div>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-mute">
              {t.description}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-2 font-mono text-[11px] text-danger">
        missing: issue_grant, approve_grant, execute_grant
      </p>
    </Panel>
  );
}

function AgentConsole() {
  const room = useRoom();
  const state = useRoomState();
  const [tool, setTool] = useState("propose_grant");
  const [argsText, setArgsText] = useState(
    () => prettyJson(EXAMPLES.propose_grant),
  );
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState<string>("");

  const selectedId = state.selected_proposal_id;

  const filledArgs = useMemo(() => argsText, [argsText]);

  async function run(name: string, raw: string) {
    setBusy(true);
    try {
      let args: unknown = {};
      const trimmed = raw.trim();
      if (trimmed) args = JSON.parse(trimmed) as unknown;
      const result = await room.dispatch(name, args, "agent");
      setLast(prettyJson(result));
    } catch (err) {
      setLast(
        prettyJson({
          ok: false,
          refused: true,
          evidence: {
            code: "INVALID_ARGS",
            message: err instanceof Error ? err.message : "Bad JSON",
          },
        }),
      );
    } finally {
      setBusy(false);
    }
  }

  function loadExample(name: string) {
    setTool(name);
    const example = { ...(EXAMPLES[name] as Record<string, unknown> | undefined) };
    if (example && "proposal_id" in example && selectedId) {
      example.proposal_id = selectedId;
    }
    setArgsText(prettyJson(example ?? {}));
  }

  return (
    <Panel
      kicker="Agent console"
      title="Invoke tools by hand"
      testId="agent-console"
      extra={<Terminal className="size-3.5 text-agent" />}
    >
      <p className="mb-2 text-xs text-mute">
        Same dispatcher a WebMCP host uses. No login. Stops before Issue.
      </p>
      <div className="mb-2 flex flex-wrap gap-1">
        <Button
          variant="agent"
          size="sm"
          data-testid="run-judge-script"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await runJudgeToolScript((name, args) =>
                room.dispatch(name, args, "agent"),
              );
              setLast("Judge script finished. Click Issue Grant on the draft.");
            } finally {
              setBusy(false);
            }
          }}
        >
          Run 60s tool script
        </Button>
        <Button
          variant="outline"
          size="sm"
          data-testid="quick-propose-read"
          disabled={busy}
          onClick={() => run("propose_grant", prettyJson(JUDGE_PROPOSE_READ))}
        >
          Propose read 4h
        </Button>
        <Button
          variant="outline"
          size="sm"
          data-testid="quick-propose-write"
          disabled={busy}
          onClick={() => run("propose_grant", prettyJson(JUDGE_PROPOSE_WRITE))}
        >
          Attempt write
        </Button>
        <Button
          variant="danger"
          size="sm"
          data-testid="quick-issue-grant"
          disabled={busy}
          onClick={() =>
            run(
              "issue_grant",
              prettyJson({
                principal_id: "alice",
                resource_id: "prod-db",
                role: "write",
              }),
            )
          }
        >
          Call issue_grant
        </Button>
      </div>
      <label className="mb-1 block text-[10px] tracking-wider text-mute uppercase">
        Tool
      </label>
      <select
        className="mb-2 h-9 w-full rounded-md border border-line bg-canvas px-2 font-mono text-xs"
        value={tool}
        onChange={(e) => loadExample(e.target.value)}
        data-testid="console-tool-select"
      >
        {TOOL_CATALOG.map((t) => (
          <option key={t.name} value={t.name}>
            {t.name}
          </option>
        ))}
        <option value="issue_grant">issue_grant (forbidden)</option>
      </select>
      <Textarea
        data-testid="console-args"
        value={filledArgs}
        onChange={(e) => setArgsText(e.target.value)}
        spellCheck={false}
        rows={7}
      />
      <Button
        className="mt-2 w-full"
        variant="agent"
        disabled={busy}
        data-testid="console-run"
        onClick={() => run(tool, argsText)}
      >
        <Play />
        {busy ? "Running…" : "Run tool"}
      </Button>
      {last ? (
        <pre
          data-testid="console-result"
          className="mt-2 max-h-48 overflow-auto rounded-md border border-line bg-canvas p-2 font-mono text-[11px] leading-relaxed whitespace-pre-wrap"
        >
          {last}
        </pre>
      ) : null}
    </Panel>
  );
}

function ActivityLog() {
  const state = useRoomState();
  const entries = [...state.activity].reverse();
  return (
    <Panel
      kicker="Activity"
      title={`${state.activity.length} calls`}
      testId="activity-log"
    >
      {entries.length === 0 ? (
        <p className="text-sm text-mute">
          Agent calls and human Issue/Revoke appear here, on the same live
          room.
        </p>
      ) : (
        <ol className="max-h-72 space-y-1.5 overflow-auto">
          {entries.map((e) => (
            <li
              key={e.id}
              className="rounded-md border border-line bg-canvas px-2 py-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px]">{e.tool}</span>
                <span className="flex items-center gap-1">
                  <Badge tone={e.actor === "human" ? "human" : e.actor === "agent" ? "agent" : "mute"}>
                    {e.actor}
                  </Badge>
                  <Badge tone={e.result.ok ? "ok" : "danger"}>
                    {e.result.ok ? "ok" : e.result.evidence.code}
                  </Badge>
                </span>
              </div>
              <p className="text-[10px] text-mute">{formatTime(e.at)}</p>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
