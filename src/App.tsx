import { useEffect } from "react";
import { RoomProvider, useRoom } from "@/ui/room-context";
import { Workbench } from "@/ui/Workbench";
import { registerWebMcp } from "@/webmcp/register";
import type { RoomStore } from "@/engine/room";

function WebMcpBinder() {
  const room = useRoom();
  useEffect(() => {
    const ac = new AbortController();
    void registerWebMcp(room, ac.signal);
    return () => ac.abort();
  }, [room]);
  return null;
}

export default function App({ store }: { store?: RoomStore }) {
  return (
    <RoomProvider store={store}>
      <WebMcpBinder />
      <Workbench />
    </RoomProvider>
  );
}
