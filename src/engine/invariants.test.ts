import { describe, expect, it } from "vitest";
import { createDemoCatalog, createSeedMandate } from "./catalog";
import { evaluatePropose } from "./policy";
import { createRoom } from "./room";
import { FORBIDDEN_TOOL_NAMES, REGISTERED_TOOL_NAMES } from "./types";
import { TOOL_CATALOG, isForbiddenToolName, registeredToolNames } from "./tools";
import { PLANTED_INJECTION, wrapUntrusted } from "./untrusted";
import { JUDGE_PROPOSE_READ, JUDGE_PROPOSE_WRITE } from "./judge";

function sequentialRoom() {
  let n = 0;
  return createRoom({
    now: () => new Date("2026-09-02T10:00:00.000Z"),
    id: (prefix) => `${prefix}_${++n}`,
  });
}

describe("allowlist enforcement", () => {
  const catalog = createDemoCatalog();
  const mandate = createSeedMandate();

  it("accepts Alice + prod-db + read inside the catalog", () => {
    const result = evaluatePropose(
      { ...JUDGE_PROPOSE_READ },
      mandate,
      catalog,
    );
    expect(result.ok).toBe(true);
  });

  it("rejects write on prod-db even though write is mandate-allowlisted", () => {
    const result = evaluatePropose(
      { ...JUDGE_PROPOSE_WRITE },
      mandate,
      catalog,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected refuse");
    expect(result.evidence.code).toBe("ROLE_DENIED_BY_RESOURCE_POLICY");
    expect(result.evidence.resource_policy?.id).toBe("prod-db");
    expect(result.evidence.resource_policy?.denied_roles).toContain("write");
  });

  it("rejects a role stripped from the mandate allowlist", () => {
    const result = evaluatePropose(
      {
        principal_id: "alice",
        resource_id: "staging-db",
        role: "write",
        ttl_hours: 1,
      },
      { ...mandate, allowlisted_roles: ["read"] },
      catalog,
    );
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected refuse");
    expect(result.evidence.code).toBe("ROLE_NOT_ALLOWLISTED");
  });

  it("rejects unknown people and resources", () => {
    const unknownPerson = evaluatePropose(
      {
        principal_id: "mallory",
        resource_id: "prod-db",
        role: "read",
        ttl_hours: 1,
      },
      mandate,
      catalog,
    );
    const unknownRes = evaluatePropose(
      {
        principal_id: "alice",
        resource_id: "secret-db",
        role: "read",
        ttl_hours: 1,
      },
      mandate,
      catalog,
    );
    expect(unknownPerson.ok).toBe(false);
    expect(unknownRes.ok).toBe(false);
    if (!unknownPerson.ok) expect(unknownPerson.evidence.code).toBe("UNKNOWN_PRINCIPAL");
    if (!unknownRes.ok) expect(unknownRes.evidence.code).toBe("UNKNOWN_RESOURCE");
  });

  it("allows write on staging-db within the catalog", async () => {
    const room = sequentialRoom();
    const result = await room.dispatch("propose_grant", {
      principal_id: "alice",
      resource_id: "staging-db",
      role: "write",
      ttl_hours: 2,
    });
    expect(result.ok).toBe(true);
  });
});

describe("TTL cap", () => {
  it("refuses ttl above the mandate cap with evidence", async () => {
    const room = sequentialRoom();
    const result = await room.dispatch("propose_grant", {
      principal_id: "alice",
      resource_id: "prod-db",
      role: "read",
      ttl_hours: 24,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected refuse");
    expect(result.evidence.code).toBe("TTL_EXCEEDS_MANDATE");
    expect(result.evidence.mandate?.max_ttl_hours).toBe(8);
    expect(room.getSnapshot().proposals).toHaveLength(0);
  });

  it("refuses non-positive ttl", async () => {
    const room = sequentialRoom();
    const result = await room.dispatch("propose_grant", {
      principal_id: "alice",
      resource_id: "prod-db",
      role: "read",
      ttl_hours: 0,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected refuse");
    expect(result.evidence.code).toBe("TTL_INVALID");
  });
});

describe("missing issue tool", () => {
  it("does not register issue/approve/execute grant tools", () => {
    const names = registeredToolNames();
    expect(names).toEqual([...REGISTERED_TOOL_NAMES]);
    for (const forbidden of FORBIDDEN_TOOL_NAMES) {
      expect(names).not.toContain(forbidden);
      expect(isForbiddenToolName(forbidden)).toBe(true);
    }
    expect(TOOL_CATALOG.some((t) => t.name.includes("issue"))).toBe(false);
  });

  it("refuses issue_grant, approve_grant, and execute_grant with STRUCTURALLY_MISSING_TOOL", async () => {
    const room = sequentialRoom();
    await room.dispatch("propose_grant", { ...JUDGE_PROPOSE_READ });
    for (const verb of ["issue_grant", "approve_grant", "execute_grant"] as const) {
      const result = await room.dispatch(verb, { proposal_id: "prp_1" });
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("expected refuse");
      expect(result.evidence.code).toBe("STRUCTURALLY_MISSING_TOOL");
    }
    expect(room.getSnapshot().issued_grants).toHaveLength(0);
    expect(room.getSnapshot().last_refusal?.code).toBe("STRUCTURALLY_MISSING_TOOL");
  });
});

describe("tighten-only monotonic authority", () => {
  it("shortens TTL and downgrades role, but never raises them", async () => {
    const room = sequentialRoom();
    const proposed = await room.dispatch("propose_grant", {
      principal_id: "alice",
      resource_id: "staging-db",
      role: "write",
      ttl_hours: 4,
      rationale: "staging write for a migration dry-run",
    });
    expect(proposed.ok).toBe(true);
    const proposalId = room.getSnapshot().proposals[0]?.id;
    expect(proposalId).toBeTruthy();

    const shorter = await room.dispatch("tighten_proposal", {
      proposal_id: proposalId,
      ttl_hours: 2,
    });
    expect(shorter.ok).toBe(true);
    expect(room.getSnapshot().proposals[0]?.ttl_hours).toBe(2);

    const raiseTtl = await room.dispatch("tighten_proposal", {
      proposal_id: proposalId,
      ttl_hours: 6,
    });
    expect(raiseTtl.ok).toBe(false);
    if (raiseTtl.ok) throw new Error("expected refuse");
    expect(raiseTtl.evidence.code).toBe("MONOTONIC_TTL_INCREASE");

    const down = await room.dispatch("tighten_proposal", {
      proposal_id: proposalId,
      role: "read",
    });
    expect(down.ok).toBe(true);
    expect(room.getSnapshot().proposals[0]?.role).toBe("read");

    const escalate = await room.dispatch("tighten_proposal", {
      proposal_id: proposalId,
      role: "write",
    });
    expect(escalate.ok).toBe(false);
    if (escalate.ok) throw new Error("expected refuse");
    expect(escalate.evidence.code).toBe("MONOTONIC_ROLE_ESCALATION");
    expect(room.getSnapshot().proposals[0]?.role).toBe("read");
    expect(room.getSnapshot().proposals[0]?.ttl_hours).toBe(2);
  });
});

describe("injection cannot force issue", () => {
  it("wraps ticket text in untrusted delimiters", async () => {
    const room = sequentialRoom();
    const result = await room.dispatch("get_room", {});
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    const data = result.data as {
      ticket: { body_untrusted: string };
      authority: { issue_tool: null };
    };
    expect(data.ticket.body_untrusted).toBe(wrapUntrusted(room.getSnapshot().ticket.raw_body));
    expect(data.ticket.body_untrusted).toContain(PLANTED_INJECTION);
    expect(data.ticket.body_untrusted.startsWith("<<<UNTRUSTED CONTENT>>>")).toBe(true);
    expect(data.authority.issue_tool).toBeNull();
  });

  it("does not issue when the ticket / rationale demands write now", async () => {
    const room = sequentialRoom();
    const write = await room.dispatch("propose_grant", { ...JUDGE_PROPOSE_WRITE });
    expect(write.ok).toBe(false);
    const issue = await room.dispatch("issue_grant", {
      rationale: PLANTED_INJECTION,
    });
    expect(issue.ok).toBe(false);
    if (issue.ok) throw new Error("expected refuse");
    expect(issue.evidence.code).toBe("STRUCTURALLY_MISSING_TOOL");
    expect(room.getSnapshot().issued_grants).toHaveLength(0);
  });
});

describe("human Issue button path (engine)", () => {
  it("creates a sandbox grant and is idempotent on replay", async () => {
    const room = sequentialRoom();
    await room.dispatch("propose_grant", { ...JUDGE_PROPOSE_READ });
    const id = room.getSnapshot().proposals[0]?.id ?? "";
    const first = room.issueGrantHuman(id);
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error("expected issue");
    expect(first.data.issuer).toBe("human");
    expect(first.data.role).toBe("read");
    expect(first.data.resource_id).toBe("prod-db");
    const second = room.issueGrantHuman(id);
    expect(second.ok).toBe(true);
    if (!second.ok) throw new Error("expected replay");
    expect(second.data.idempotent_replay).toBe(true);
    expect(second.data.id).toBe(first.data.id);
    expect(room.getSnapshot().issued_grants).toHaveLength(1);
    expect(room.getSnapshot().activity.some((e) => e.tool === "issue_grant_button")).toBe(true);
  });
});

describe("revoke draft", () => {
  it("cancels a draft so it cannot be issued", async () => {
    const room = sequentialRoom();
    await room.dispatch("propose_grant", { ...JUDGE_PROPOSE_READ });
    const id = room.getSnapshot().proposals[0]?.id ?? "";
    const cancelled = await room.dispatch("cancel_proposal", { proposal_id: id });
    expect(cancelled.ok).toBe(true);
    expect(room.getSnapshot().proposals[0]?.status).toBe("cancelled");
    const issued = room.issueGrantHuman(id);
    expect(issued.ok).toBe(false);
    if (issued.ok) throw new Error("expected refuse");
    expect(issued.evidence.code).toBe("PROPOSAL_NOT_DRAFT");
    expect(room.getSnapshot().issued_grants).toHaveLength(0);
  });

  it("human revoke draft button uses the same cancel path", async () => {
    const room = sequentialRoom();
    await room.dispatch("propose_grant", { ...JUDGE_PROPOSE_READ });
    const id = room.getSnapshot().proposals[0]?.id ?? "";
    const revoked = room.revokeDraftHuman(id);
    expect(revoked.ok).toBe(true);
    expect(room.getSnapshot().proposals[0]?.status).toBe("cancelled");
  });
});

describe("mandate change is human-gated", () => {
  it("does not raise the cap until a human confirms", async () => {
    const room = sequentialRoom();
    const pending = room.dispatch("request_mandate_change", {
      max_ttl_hours: 24,
    });
    expect(room.getSnapshot().mandate.max_ttl_hours).toBe(8);
    expect(room.getSnapshot().pending_mandate_change).not.toBeNull();
    const confirmed = room.confirmMandateChange();
    expect(confirmed.ok).toBe(true);
    const agentResult = await pending;
    expect(agentResult.ok).toBe(true);
    expect(room.getSnapshot().mandate.max_ttl_hours).toBe(24);
  });
});
