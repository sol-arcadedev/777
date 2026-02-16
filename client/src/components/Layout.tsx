import type { ConfigurationDTO, QueueEntry, WinnerHistoryEntry, SpinResultEvent, BurnStatsDTO, DynamicValues } from "@shared/types";
import Header from "./Header";
import SlotMachine from "./SlotMachine";
import SlotDisplay from "./SlotDisplay";
import RewardDisplay from "./RewardDisplay";
import WinChanceDisplay from "./WinChanceDisplay";
import CountdownTimer from "./CountdownTimer";
import BurnDisplay from "./BurnDisplay";
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
  burnUpdate: BurnStatsDTO | null;
  dynamicValues: DynamicValues | null;
}

export default function Layout({ config, activeSpin, waiting, winners, rewardBalance, spinResult, onSpinResultDone, burnUpdate, dynamicValues }: LayoutProps) {
  const isSpinning = activeSpin !== null;
  const winChance = dynamicValues?.winChance ?? config.winChanceStart;
  const rewardPercent = dynamicValues?.rewardPercent ?? config.rewardPercentStart;
  const cycleProgress = dynamicValues?.cycleProgress ?? 0;
  const cycleSecondsLeft = dynamicValues?.cycleSecondsLeft ?? config.escalationDurationMin * 60;

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
          <div className="grid grid-cols-4 gap-2 w-full max-w-lg">
            <WinChanceDisplay
              winChance={winChance}
              cycleSecondsLeft={cycleSecondsLeft}
            />
            <RewardDisplay
              rewardPercent={rewardPercent}
              balanceSol={rewardBalance}
              cycleProgress={cycleProgress}
            />
            <CountdownTimer expiresAt={config.timerExpiresAt} />
            <BurnDisplay burnUpdate={burnUpdate} />
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
