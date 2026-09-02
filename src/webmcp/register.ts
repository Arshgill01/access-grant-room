import type { RoomStore } from "@/engine/room";
import { TOOL_CATALOG } from "@/engine/tools";

export type ModelContextLike = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations?: object;
      execute: (args: Record<string, unknown>) => unknown | Promise<unknown>;
    },
    options?: { signal?: AbortSignal },
  ) => unknown | Promise<unknown>;
};

export function getModelContext(): {
  ctx: ModelContextLike;
  host: "document" | "navigator";
} | null {
  if (typeof document !== "undefined") {
    const d = document as Document & { modelContext?: ModelContextLike };
    if (d.modelContext && typeof d.modelContext.registerTool === "function") {
      return { ctx: d.modelContext, host: "document" };
    }
  }
  if (typeof navigator !== "undefined") {
    const n = navigator as Navigator & { modelContext?: ModelContextLike };
    if (n.modelContext && typeof n.modelContext.registerTool === "function") {
      return { ctx: n.modelContext, host: "navigator" };
    }
  }
  return null;
}

export async function registerWebMcp(
  room: RoomStore,
  signal?: AbortSignal,
): Promise<void> {
  const found = getModelContext();
  if (!found) {
    room.setWebMcpStatus({
      available: false,
      host: "none",
      registered: TOOL_CATALOG.map((t) => t.name),
    });
    return;
  }

  const registered: string[] = [];
  for (const meta of TOOL_CATALOG) {
    const tool = {
      name: meta.name,
      description: meta.description,
      inputSchema: meta.inputSchema,
      annotations: meta.annotations,
      execute: async (args: Record<string, unknown> = {}) => {
        const result = await room.dispatch(meta.name, args, "agent");
        return JSON.stringify(result, null, 2);
      },
    };
    try {
      await found.ctx.registerTool(tool, signal ? { signal } : undefined);
      registered.push(meta.name);
    } catch {
      try {
        await found.ctx.registerTool(tool);
        registered.push(meta.name);
      } catch {
        // Host rejected registration; console still works.
      }
    }
  }

  room.setWebMcpStatus({
    available: true,
    host: found.host,
    registered,
  });
}
