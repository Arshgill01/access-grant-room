import { CenterStage } from "@/ui/center";
import { HeaderBar, JudgeStrip, RefusalBanner } from "@/ui/chrome";
import { LeftRail } from "@/ui/left";
import { MandateChangeDialog } from "@/ui/MandateChangeDialog";
import { RightRail } from "@/ui/right";

export function Workbench() {
  return (
    <div className="bg-workbench flex h-dvh min-h-0 flex-col text-ink">
      <HeaderBar />
      <JudgeStrip />
      <RefusalBanner />
      <main className="min-h-0 flex-1 overflow-auto">
        <div className="mx-auto grid max-w-[1600px] gap-3 p-3 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(300px,380px)]">
          <LeftRail />
          <CenterStage />
          <RightRail />
        </div>
      </main>
      <MandateChangeDialog />
    </div>
  );
}
