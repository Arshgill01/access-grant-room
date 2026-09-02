import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { prettyJson } from "@/lib/utils";
import { useRoom, useRoomState } from "@/ui/room-context";

export function MandateChangeDialog() {
  const room = useRoom();
  const state = useRoomState();
  const pending = state.pending_mandate_change;

  return (
    <Dialog open={!!pending}>
      <DialogContent
        data-testid="mandate-change-dialog"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Mandate change needs a human</DialogTitle>
          <DialogDescription>
            The agent asked to change the mandate. It cannot apply this itself.
            Confirm only if you intend to raise the ceiling.
          </DialogDescription>
        </DialogHeader>
        <pre className="max-h-48 overflow-auto rounded-md border border-line bg-canvas p-2 font-mono text-[11px]">
          {prettyJson(pending?.request ?? {})}
        </pre>
        <p className="mt-2 text-xs text-mute">
          Current cap {state.mandate.max_ttl_hours}h · roles{" "}
          {state.mandate.allowlisted_roles.join(", ")}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button
            variant="outline"
            data-testid="deny-mandate-change"
            onClick={() => room.denyMandateChange()}
          >
            Deny
          </Button>
          <Button
            variant="human"
            data-testid="confirm-mandate-change"
            onClick={() => room.confirmMandateChange()}
          >
            Confirm change
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
