import { useEffect, useRef, useState } from "react";
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
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio("/sfx/Background_Music.mp3");
    audio.loop = true;
    audio.volume = 0.02;
    bgMusicRef.current = audio;

    const startMusic = () => {
      audio.play().catch(() => {});
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };

    document.addEventListener("click", startMusic);
    document.addEventListener("keydown", startMusic);

    return () => {
      audio.pause();
      document.removeEventListener("click", startMusic);
      document.removeEventListener("keydown", startMusic);
    };
  }, []);

  const toggleMute = () => {
    if (bgMusicRef.current) {
      bgMusicRef.current.muted = !bgMusicRef.current.muted;
      setMuted(bgMusicRef.current.muted);
    }
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden noise-overlay casino-bg"
      style={{ background: "#080000" }}
    >
      {/* Static background layers (no animations) */}
      <div className="casino-bg-image" />
      <div className="casino-bg-darken" />

      <Header tokenCA={config.tokenCA} expiresAt={config.timerExpiresAt} burnUpdate={burnUpdate} />

      <div className="flex justify-center relative z-[1] -mb-2">
        <img
          src="/777_TokenImage.png"
          alt="777 Token"
          className="h-12 w-12 object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      </div>

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

      <div className="text-center py-1 relative z-[1]">
        <span className="text-[7px] text-gold-dim/30 tracking-wider uppercase">
          Not financial advice. Play responsibly. You may lose your SOL.
        </span>
      </div>

      <button
        onClick={toggleMute}
        className="fixed bottom-4 right-4 z-50 p-2 border-2 border-gold-dim hover:border-gold transition-colors cursor-pointer"
        style={{
          background: "rgba(0,0,0,0.7)",
          boxShadow: "2px 2px 0 rgba(0,0,0,0.5)",
        }}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#daa520" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </div>
  );
}
