import type { ConfigurationDTO, QueueEntry, WinnerHistoryEntry, SpinResultEvent } from "@shared/types";
import Header from "./Header";
import SlotMachine from "./SlotMachine";
import SlotDisplay from "./SlotDisplay";
import RewardDisplay from "./RewardDisplay";
import CountdownTimer from "./CountdownTimer";
import QueueDisplay from "./QueueDisplay";
import WinnerHistory from "./WinnerHistory";
import Rules from "./Rules";

interface LayoutProps {
  config: ConfigurationDTO;
  activeSpin: QueueEntry | null;
  waiting: QueueEntry[];
  winners: WinnerHistoryEntry[];
  rewardBalance: number | null;
  spinResult: SpinResultEvent | null;
  onSpinResultDone: () => void;
}

export default function Layout({ config, activeSpin, waiting, winners, rewardBalance, spinResult, onSpinResultDone }: LayoutProps) {
  const isSpinning = activeSpin !== null;

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(180deg, #1a0f00 0%, #0f0800 100%)" }}>
      <Header tokenCA={config.tokenCA} />

      <main className="flex-1 grid grid-cols-[260px_1fr_280px] gap-3 p-3 max-w-[1920px] mx-auto w-full">
        {/* Left column: Queue + Rules */}
        <div className="flex flex-col gap-3">
          <QueueDisplay waiting={waiting} />
          <Rules
            requiredHoldings={config.requiredHoldings}
            minSolTransfer={config.minSolTransfer}
          />
        </div>

        {/* Center column: Slot Machine */}
        <div className="flex flex-col items-center justify-center gap-3">
          <SlotMachine
            isSpinning={isSpinning}
            paused={config.paused}
            minSolTransfer={config.minSolTransfer}
            spinResult={spinResult}
            onResultDone={onSpinResultDone}
          />
          <SlotDisplay activeSpin={activeSpin} />
          <div className="flex gap-3 w-full max-w-md">
            <div className="flex-1">
              <RewardDisplay
                rewardPercent={config.rewardPercent}
                balanceSol={rewardBalance}
              />
            </div>
            <div className="flex-1">
              <CountdownTimer expiresAt={config.timerExpiresAt} />
            </div>
          </div>
        </div>

        {/* Right column: Winner History */}
        <div>
          <WinnerHistory winners={winners} />
        </div>
      </main>
    </div>
  );
}
