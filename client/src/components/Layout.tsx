import type { ConfigurationDTO, QueueEntry, WinnerHistoryEntry, SpinResultEvent, BurnStatsDTO, SpinHistoryEntry } from "@shared/types";
import Header from "./Header";
import SlotMachine from "./SlotMachine";
import SlotDisplay from "./SlotDisplay";
import RewardDisplay from "./RewardDisplay";
import WinChanceDisplay from "./WinChanceDisplay";
import QueueDisplay from "./QueueDisplay";
import WinnerHistory from "./WinnerHistory";
import SpinHistory from "./SpinHistory";
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
  spinHistory: SpinHistoryEntry[];
}

export default function Layout({ config, activeSpin, waiting, winners, rewardBalance, spinResult, onSpinResultDone, burnUpdate, spinHistory }: LayoutProps) {
  const isSpinning = activeSpin !== null;

  return (
    <div
      className="h-screen flex flex-col overflow-hidden noise-overlay casino-bg"
      style={{ background: "#080000" }}
    >
      {/* Static background layers (no animations) */}
      <div className="casino-bg-image" />
      <div className="casino-bg-darken" />

      <Header tokenCA={config.tokenCA} expiresAt={config.timerExpiresAt} burnUpdate={burnUpdate} />

      <main className="flex-1 grid grid-cols-[310px_1fr_310px] gap-4 p-4 max-w-[1920px] mx-auto w-full relative z-[1] min-h-0">
        {/* Left column: Rules + Queue */}
        <div className="flex flex-col gap-3 justify-start pt-4 min-h-0">
          <Rules
            requiredHoldings={config.requiredHoldings}
            minSolTransfer={config.minSolTransfer}
            verificationWalletAddress={config.verificationWalletAddress}
          />
          <QueueDisplay waiting={waiting} />
        </div>

        {/* Center column: Info cards → Slot Machine → Active Spin */}
        <div className="flex flex-col items-center gap-2 min-h-0 justify-center relative">
          {/* Radial glow behind slot machine */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: "600px",
              height: "500px",
              background: "radial-gradient(ellipse at center, rgba(218,165,32,0.1) 0%, rgba(139,0,0,0.05) 40%, transparent 70%)",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -55%)",
            }}
          />

          {/* Spin-relevant info cards — above slot */}
          <div className="grid grid-cols-2 gap-2 w-full max-w-[420px]">
            <WinChanceDisplay
              winChance={config.winChance}
            />
            <RewardDisplay
              rewardPercent={config.rewardPercent}
              balanceSol={rewardBalance}
            />
          </div>

          <SlotMachine
            isSpinning={isSpinning}
            paused={config.paused}
            minSolTransfer={config.minSolTransfer}
            spinResult={spinResult}
            onResultDone={onSpinResultDone}
          />

          <SlotDisplay activeSpin={activeSpin} />
        </div>

        {/* Right column: Winner History + Spin History */}
        <div className="flex flex-col gap-3 min-h-0 justify-start pt-4">
          <WinnerHistory winners={winners} />
          <SpinHistory spins={spinHistory} />
        </div>
      </main>
    </div>
  );
}
