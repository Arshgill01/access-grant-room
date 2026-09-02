import { createContext, useContext, useState, useSyncExternalStore, type ReactNode } from "react";
import { createSeededRoom, type RoomStore } from "@/engine/room";
import type { RoomSnapshot } from "@/engine/types";

const RoomContext = createContext<RoomStore | null>(null);

export function RoomProvider({
  store,
  children,
}: {
  store?: RoomStore;
  children: ReactNode;
}) {
  const [room] = useState(() => store ?? createSeededRoom());
  return <RoomContext.Provider value={room}>{children}</RoomContext.Provider>;
}

export function useRoom(): RoomStore {
  const room = useContext(RoomContext);
  if (!room) throw new Error("useRoom must be used inside RoomProvider");
  return room;
}

export function useRoomState(): RoomSnapshot {
  const room = useRoom();
  return useSyncExternalStore(room.subscribe, room.getSnapshot, room.getSnapshot);
}
