import { useState, useEffect, useRef } from "react";
import type { SpinResultEvent } from "@shared/types";

interface SlotMachineProps {
  isSpinning: boolean;
  paused: boolean;
  minSolTransfer: number;
  spinResult: SpinResultEvent | null;
  onResultDone: () => void;
}

type Phase = "idle" | "spinning" | "result";

const RESULT_DISPLAY_MS = 3500;

const LOSE_SYMBOLS = [
  ["7", "X", "7"],
  ["X", "7", "X"],
  ["7", "7", "X"],
  ["X", "X", "7"],
];

function Reel({ spinning, symbol }: { spinning: boolean; symbol: string }) {
  const symbols = ["7", "7", "7"];
  return (
    <div className="w-20 h-24 bg-casino-black border-2 border-gold-dim rounded-lg overflow-hidden flex items-center justify-center">
      {spinning ? (
        <div className="animate-spin-reel">
          {symbols.map((s, i) => (
            <div key={i} className="text-5xl font-bold text-gold h-24 flex items-center justify-center">
              {s}
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-5xl font-bold ${symbol === "X" ? "text-lose-red" : "text-gold"} animate-bounce-in`}>
          {symbol}
        </div>
      )}
    </div>
  );
}

function ConfettiParticle({ index }: { index: number }) {
  const colors = ["#fbbf24", "#fde68a", "#22c55e", "#60a5fa", "#f472b6"];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const duration = 1.5 + Math.random();

  return (
    <div
      className="confetti-particle"
      style={{
        left: `${left}%`,
        backgroundColor: color,
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
      }}
    />
  );
}

export default function SlotMachine({ isSpinning, paused, minSolTransfer, spinResult, onResultDone }: SlotMachineProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayResult, setDisplayResult] = useState<SpinResultEvent | null>(null);
  const [loseSymbols, setLoseSymbols] = useState<string[]>(["7", "7", "7"]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (spinResult) {
      // Spin result received — transition to result phase
      if (spinResult.result === "LOSE") {
        setLoseSymbols(LOSE_SYMBOLS[Math.floor(Math.random() * LOSE_SYMBOLS.length)]);
      }
      setDisplayResult(spinResult);
      setPhase("result");

      timerRef.current = setTimeout(() => {
        setPhase("idle");
        setDisplayResult(null);
        onResultDone();
      }, RESULT_DISPLAY_MS);
    } else if (isSpinning && phase !== "result") {
      setPhase("spinning");
    } else if (!isSpinning && phase !== "result") {
      setPhase("idle");
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [spinResult, isSpinning]);

  const isWin = displayResult?.result === "WIN";
  const isLose = displayResult?.result === "LOSE";
  const showingResult = phase === "result" && displayResult !== null;

  const reelSymbols = showingResult
    ? isWin
      ? ["7", "7", "7"]
      : loseSymbols
    : ["7", "7", "7"];

  const containerClass = [
    "flex flex-col items-center gap-4 p-6 bg-casino-card border border-casino-border rounded-xl relative overflow-hidden",
    phase === "spinning" && "animate-glow",
    showingResult && isWin && "win-glow",
    showingResult && isLose && "lose-flash",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      {/* Confetti overlay for wins */}
      {showingResult && isWin && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}

      <div className="text-xs uppercase tracking-widest text-gold-dim">
        {paused
          ? "Paused"
          : showingResult
            ? isWin
              ? "WINNER!"
              : "Better luck next time"
            : phase === "spinning"
              ? "Spinning..."
              : "Waiting for spins"}
      </div>

      <div className="flex gap-3">
        <Reel spinning={phase === "spinning"} symbol={reelSymbols[0]} />
        <Reel spinning={phase === "spinning"} symbol={reelSymbols[1]} />
        <Reel spinning={phase === "spinning"} symbol={reelSymbols[2]} />
      </div>

      {showingResult && isWin && displayResult.rewardSol !== null && (
        <div className="text-win-green text-lg font-bold animate-bounce-in">
          +{displayResult.rewardSol.toFixed(4)} SOL
        </div>
      )}

      {showingResult && isLose && (
        <div className="text-lose-red text-sm font-medium animate-bounce-in">
          No win this time
        </div>
      )}

      {paused && !showingResult && (
        <div className="text-sm text-gold-dim border border-gold-dim/30 px-4 py-2 rounded">
          Slot machine is paused — spins are still queued
        </div>
      )}

      {!showingResult && (
        <div className="text-xs text-gold-dim text-center max-w-xs">
          Send at least {minSolTransfer} SOL to the verification wallet to spin
        </div>
      )}
    </div>
  );
}
