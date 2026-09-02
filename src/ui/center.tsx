import { Check, KeyRound, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { IssuedGrant, Proposal, RoomSnapshot } from "@/engine/types";
import { formatTime } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useRoom, useRoomState } from "@/ui/room-context";
import { Panel } from "@/ui/panel";

function personName(state: RoomSnapshot, id: string): string {
  return state.catalog.people.find((p) => p.id === id)?.display_name ?? id;
}

export function CenterStage() {
  const room = useRoom();
  const state = useRoomState();
  const selected =
    state.proposals.find((p) => p.id === state.selected_proposal_id) ??
    state.proposals.find((p) => p.status === "draft") ??
    state.proposals[0];
  const grant =
    selected?.issued_grant_id
      ? state.issued_grants.find((g) => g.id === selected.issued_grant_id)
      : state.issued_grants.at(-1);
  const canIssue = selected?.status === "draft";
  const canRevoke = selected?.status === "draft";

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <Panel
        kicker="Proposals"
        title={
          state.proposals.length
            ? `${state.proposals.length} on the table`
            : "No draft yet"
        }
        testId="proposal-list"
      >
        {state.proposals.length === 0 ? (
          <div
            className="rounded-md border border-dashed border-line px-3 py-8 text-center text-sm text-mute"
            data-testid="proposals-empty"
          >
            Use the Agent console to call{" "}
            <span className="font-mono text-agent">propose_grant</span> for
            Alice · prod-db · read · 4h. The draft will land here.
          </div>
        ) : (
          <ul className="space-y-2">
            {state.proposals
              .slice()
              .reverse()
              .map((p) => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  selected={selected?.id === p.id}
                  name={personName(state, p.principal_id)}
                  onSelect={() => room.selectProposal(p.id)}
                />
              ))}
          </ul>
        )}
      </Panel>

      <Panel kicker="Entitlement preview" title="What Issue would write">
        {selected ? (
          <Preview proposal={selected} name={personName(state, selected.principal_id)} />
        ) : (
          <p className="text-sm text-mute">
            Nothing to preview until a draft exists. Agent tools cannot skip
            this step.
          </p>
        )}
      </Panel>

      <div
        className="rounded-lg border border-human/35 bg-human/8 p-3"
        data-testid="human-controls"
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[10px] tracking-[0.18em] text-human uppercase">
            Human controls — not registered as tools
          </p>
          <Badge tone="human">DOM click only</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="human"
            size="lg"
            data-testid="issue-grant-button"
            data-human-only="true"
            disabled={!canIssue}
            onClick={() => {
              if (selected) room.issueGrantHuman(selected.id);
            }}
          >
            <KeyRound />
            Issue Grant
          </Button>
          <Button
            variant="danger"
            size="lg"
            data-testid="revoke-draft-button"
            disabled={!canRevoke}
            onClick={() => {
              if (selected) room.revokeDraftHuman(selected.id);
            }}
          >
            <Trash2 />
            Revoke draft
          </Button>
        </div>
        <p className="mt-2 text-xs text-mute">
          {canIssue
            ? `Issues ${personName(state, selected.principal_id)} ${selected.role} on ${selected.resource_id} for ${selected.ttl_hours}h. Idempotent if you click again.`
            : "Select a draft proposal. The agent has no issue_grant / approve_grant / execute_grant tool."}
        </p>
      </div>

      <Panel
        kicker="Sandbox receipt"
        title={grant ? grant.receipt_code : "Not issued"}
        testId="receipt-card"
        extra={
          grant ? (
            <Badge tone="ok">
              <Check className="mr-1 size-3" />
              Issued
            </Badge>
          ) : null
        }
      >
        {grant ? <Receipt grant={grant} /> : (
          <p className="text-sm text-mute">
            Receipt appears only after a human clicks Issue. Replaying the
            button returns the same grant.
          </p>
        )}
      </Panel>
    </div>
  );
}

function ProposalCard({
  proposal,
  selected,
  name,
  onSelect,
}: {
  proposal: Proposal;
  selected: boolean;
  name: string;
  onSelect: () => void;
}) {
  const tone =
    proposal.status === "issued"
      ? "ok"
      : proposal.status === "cancelled"
        ? "mute"
        : "agent";
  return (
    <li>
      <button
        type="button"
        data-testid={`proposal-card-${proposal.id}`}
        onClick={onSelect}
        className={cn(
          "w-full rounded-md border bg-canvas px-3 py-2 text-left transition-colors",
          selected
            ? "border-human/50 ring-1 ring-human/30"
            : "border-line hover:border-ink/20",
          proposal.status === "cancelled" && "opacity-60",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-medium">
            {name}{" "}
            <span className="text-mute">→</span> {proposal.resource_id}
          </span>
          <Badge tone={tone}>{proposal.status}</Badge>
        </div>
        <p className="mt-1 font-mono text-xs text-mute">
          {proposal.role} · {proposal.ttl_hours}h · {proposal.id}
        </p>
        {proposal.rationale ? (
          <p className="mt-1 line-clamp-2 text-xs text-mute">
            {proposal.rationale}
          </p>
        ) : null}
      </button>
    </li>
  );
}

function Preview({ proposal, name }: { proposal: Proposal; name: string }) {
  return (
    <dl className="grid grid-cols-2 gap-2 text-sm">
      <Row k="Principal" v={name} />
      <Row k="Resource" v={proposal.resource_id} />
      <Row k="Role" v={proposal.role} />
      <Row k="TTL" v={`${proposal.ttl_hours}h`} />
      <Row k="Status" v={proposal.status} />
      <Row k="Issued?" v={proposal.status === "issued" ? "yes" : "no"} />
    </dl>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-md border border-line bg-canvas px-2 py-1.5">
      <dt className="text-[10px] tracking-wider text-mute uppercase">{k}</dt>
      <dd className="font-mono text-xs">{v}</dd>
    </div>
  );
}

function Receipt({ grant }: { grant: IssuedGrant }) {
  return (
    <div data-testid="grant-receipt" className="space-y-2">
      {grant.idempotent_replay ? (
        <Badge tone="ok">Idempotent replay</Badge>
      ) : null}
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <Row k="Grant" v={grant.id} />
        <Row k="Issuer" v="human" />
        <Row k="Principal" v={grant.principal_id} />
        <Row k="Resource" v={grant.resource_id} />
        <Row k="Role" v={grant.role} />
        <Row k="TTL" v={`${grant.ttl_hours}h`} />
        <Row k="Issued" v={formatTime(grant.issued_at)} />
        <Row k="Expires" v={formatTime(grant.expires_at)} />
      </dl>
      <p className="text-xs text-ok">
        Sandbox entitlement only. No production directory was changed.
      </p>
    </div>
  );
}
