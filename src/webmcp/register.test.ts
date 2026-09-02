import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoom } from "@/engine/room";
import { REGISTERED_TOOL_NAMES } from "@/engine/types";
import { registerWebMcp } from "@/webmcp/register";

describe("WebMCP registration", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    Reflect.deleteProperty(document, "modelContext");
  });

  it("registers document.modelContext tools and never registers issue_grant", async () => {
    const names: string[] = [];
    const registerTool = vi.fn(async (tool: { name: string }) => {
      names.push(tool.name);
    });
    Object.defineProperty(document, "modelContext", {
      value: { registerTool },
      configurable: true,
    });

    let n = 0;
    const room = createRoom({
      now: () => new Date("2026-09-02T10:00:00.000Z"),
      id: (prefix) => `${prefix}_${++n}`,
    });
    await registerWebMcp(room);

    expect(names).toEqual([...REGISTERED_TOOL_NAMES]);
    expect(names).not.toContain("issue_grant");
    expect(names).not.toContain("approve_grant");
    expect(names).not.toContain("execute_grant");
    expect(room.getSnapshot().webmcp.host).toBe("document");
    expect(room.getSnapshot().webmcp.available).toBe(true);
  });
});
