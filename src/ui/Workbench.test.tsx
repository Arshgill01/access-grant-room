import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "@/App";
import { createRoom } from "@/engine/room";
import { PLANTED_INJECTION, UNTRUSTED_OPEN } from "@/engine/untrusted";

function testRoom() {
  let n = 0;
  return createRoom({
    now: () => new Date("2026-09-02T10:00:00.000Z"),
    id: (prefix) => `${prefix}_${++n}`,
  });
}

describe("Access Grant Room workbench", () => {
  it("shows the seeded demo, untrusted ticket, and missing issue tools", () => {
    render(<App store={testRoom()} />);
    expect(screen.getByText("Access Grant Room")).toBeInTheDocument();
    expect(screen.getByTestId("untrusted-ticket").textContent).toContain(
      UNTRUSTED_OPEN,
    );
    expect(screen.getByTestId("untrusted-ticket").textContent).toContain(
      PLANTED_INJECTION,
    );
    expect(screen.getByTestId("tools-panel").textContent).toContain("propose_grant");
    expect(screen.getByTestId("tools-panel").textContent).toContain(
      "missing: issue_grant",
    );
    expect(screen.getByTestId("issue-grant-button")).toBeDisabled();
    expect(screen.getByTestId("judge-step-seed")).toHaveAttribute(
      "data-done",
      "true",
    );
    expect(screen.getByTestId("judge-step-untrusted_visible")).toHaveAttribute(
      "data-done",
      "true",
    );
  });

  it("lets the console propose read, refuses write and issue_grant, then human Issue works", async () => {
    const user = userEvent.setup();
    const room = testRoom();
    render(<App store={room} />);

    await user.click(screen.getByTestId("quick-propose-read"));
    await waitFor(() => {
      expect(screen.getByTestId("proposal-list").textContent).toMatch(/Alice Chen/);
      expect(screen.getByTestId("proposal-list").textContent).toMatch(/read · 4h/);
    });
    expect(screen.getByTestId("issue-grant-button")).not.toBeDisabled();

    await user.click(screen.getByTestId("quick-propose-write"));
    await waitFor(() => {
      expect(room.getSnapshot().last_refusal?.code).toBe(
        "ROLE_DENIED_BY_RESOURCE_POLICY",
      );
    });
    expect(screen.getByTestId("refusal-banner").textContent).toMatch(
      /ROLE_DENIED_BY_RESOURCE_POLICY/,
    );
    expect(room.getSnapshot().issued_grants).toHaveLength(0);

    await user.click(screen.getByTestId("quick-issue-grant"));
    await waitFor(() => {
      expect(room.getSnapshot().last_refusal?.code).toBe(
        "STRUCTURALLY_MISSING_TOOL",
      );
    });
    expect(screen.getByTestId("refusal-banner").textContent).toMatch(
      /issue_grant/,
    );

    await user.click(screen.getByTestId("issue-grant-button"));
    expect(await screen.findByTestId("grant-receipt")).toBeInTheDocument();
    expect(room.getSnapshot().issued_grants).toHaveLength(1);
    expect(room.getSnapshot().issued_grants[0]?.issuer).toBe("human");
    expect(screen.getByTestId("activity-log").textContent).toContain(
      "issue_grant_button",
    );
    expect(screen.getByTestId("judge-step-human_issue")).toHaveAttribute(
      "data-done",
      "true",
    );
  });

  it("revokes a draft from the human Revoke control", async () => {
    const user = userEvent.setup();
    const room = testRoom();
    render(<App store={room} />);
    await user.click(screen.getByTestId("quick-propose-read"));
    await waitFor(() => expect(room.getSnapshot().proposals).toHaveLength(1));
    await user.click(screen.getByTestId("revoke-draft-button"));
    await waitFor(() => {
      expect(room.getSnapshot().proposals[0]?.status).toBe("cancelled");
    });
    expect(screen.getByTestId("issue-grant-button")).toBeDisabled();
    expect(room.getSnapshot().issued_grants).toHaveLength(0);
  });
});
