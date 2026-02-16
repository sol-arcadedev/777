import type { ConfigurationDTO, QueueEntry, WinnerHistoryEntry, SpinResultEvent, BurnStatsDTO, SpinHistoryEntry } from "@shared/types";
import Header from "./Header";
import SlotMachine from "./SlotMachine";
import SlotDisplay from "./SlotDisplay";
import RewardDisplay from "./RewardDisplay";
import WinChanceDisplay from "./WinChanceDisplay";
import CountdownTimer from "./CountdownTimer";
import BurnDisplay from "./BurnDisplay";
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
      {/* Background layers */}
      <div className="casino-bg-image" />
      <div className="casino-bg-darken" />
      <div className="casino-bg-neons">
        <div className="casino-neon-teal-1" />
        <div className="casino-neon-teal-2" />
        <div className="casino-neon-orange-1" />
        <div className="casino-neon-red" />
        <div className="casino-neon-gold" />
      </div>
      <div className="casino-bg-sweeps" />
      <div className="casino-bg-floor-glow" />
      <div className="casino-bg-screens">
        <div className="casino-screen-glow" style={{ top: "25%", left: "8%", width: "60px", height: "40px", background: "rgba(0,200,200,0.15)", animationDelay: "0s" }} />
        <div className="casino-screen-glow" style={{ top: "35%", right: "10%", width: "50px", height: "35px", background: "rgba(255,180,0,0.12)", animationDelay: "1s" }} />
        <div className="casino-screen-glow" style={{ top: "55%", left: "5%", width: "55px", height: "38px", background: "rgba(0,220,180,0.1)", animationDelay: "2s" }} />
        <div className="casino-screen-glow" style={{ top: "45%", right: "6%", width: "45px", height: "30px", background: "rgba(255,100,100,0.1)", animationDelay: "0.5s" }} />
        <div className="casino-screen-glow" style={{ top: "65%", left: "12%", width: "50px", height: "35px", background: "rgba(255,200,50,0.08)", animationDelay: "1.5s" }} />
        <div className="casino-screen-glow" style={{ top: "60%", right: "15%", width: "55px", height: "40px", background: "rgba(0,180,220,0.1)", animationDelay: "2.5s" }} />
      </div>

      <Header tokenCA={config.tokenCA} />

      <main className="flex-1 grid grid-cols-[280px_1fr_300px] gap-4 p-4 max-w-[1920px] mx-auto w-full relative z-[1] min-h-0">
        {/* Left column: Rules — vertically centered */}
        <div className="flex flex-col justify-center min-h-0">
          <Rules
            requiredHoldings={config.requiredHoldings}
            minSolTransfer={config.minSolTransfer}
            winChance={config.winChance}
            rewardPercent={config.rewardPercent}
          />
        </div>

        {/* Center column: Info cards → Slot Machine → Active Spin → Queue */}
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

          <QueueDisplay waiting={waiting} />

          <SpinHistory spins={spinHistory} />
        </div>

        {/* Right column: Winner History + Operational Info — centered */}
        <div className="flex flex-col gap-3 min-h-0 justify-center">
          <WinnerHistory winners={winners} />
          {/* Operational info cards at bottom */}
          <div className="grid grid-cols-2 gap-2">
            <CountdownTimer expiresAt={config.timerExpiresAt} />
            <BurnDisplay burnUpdate={burnUpdate} />
          </div>
        </div>
      </main>
    </div>
  );
}
