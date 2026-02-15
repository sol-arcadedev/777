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
    <div className="w-20 h-24 bg-casino-dark border-3 border-brass overflow-hidden flex items-center justify-center"
      style={{ boxShadow: "inset 0 2px 8px rgba(0,0,0,0.6), 2px 2px 0 rgba(0,0,0,0.4)" }}>
      {spinning ? (
        <div className="animate-spin-reel">
          {symbols.map((s, i) => (
            <div key={i} className="text-5xl font-bold text-gold h-24 flex items-center justify-center"
              style={{ fontFamily: "'Press Start 2P', cursive" }}>
              {s}
            </div>
          ))}
        </div>
      ) : (
        <div className={`text-5xl font-bold ${symbol === "X" ? "text-lose-red" : "text-gold"} animate-bounce-in`}
          style={{ fontFamily: "'Press Start 2P', cursive" }}>
          {symbol}
        </div>
      )}
    </div>
  );
}

function Lever({ pulling }: { pulling: boolean }) {
  return (
    <div className="flex flex-col items-center ml-3" style={{ width: "28px" }}>
      {/* Lever arm with pivot at bottom */}
      <div
        className={pulling ? "animate-lever-pull" : ""}
        style={{
          transformOrigin: "bottom center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Knob */}
        <div
          className="bg-lose-red border-2 border-maroon"
          style={{
            width: "20px",
            height: "20px",
            borderRadius: "50%",
            boxShadow: "inset -2px -2px 0 rgba(0,0,0,0.3), 2px 2px 0 rgba(0,0,0,0.3)",
          }}
        />
        {/* Shaft */}
        <div
          className="bg-gold-dim"
          style={{
            width: "6px",
            height: "60px",
            boxShadow: "1px 0 0 rgba(0,0,0,0.3), -1px 0 0 rgba(255,255,255,0.1)",
          }}
        />
      </div>
      {/* Pivot base */}
      <div
        className="bg-brass"
        style={{
          width: "16px",
          height: "8px",
          borderRadius: "0 0 4px 4px",
          boxShadow: "2px 2px 0 rgba(0,0,0,0.3)",
        }}
      />
    </div>
  );
}

function ConfettiParticle({ index }: { index: number }) {
  const colors = ["#ffd700", "#ffe44d", "#00ff41", "#60a5fa", "#f472b6"];
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
  const [leverPull, setLeverPull] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (spinResult) {
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
      setLeverPull(true);
      setTimeout(() => setLeverPull(false), 600);
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
    "relative overflow-hidden",
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
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}

      {/* Slot Machine Cabinet */}
      <div
        className="flex flex-col items-center"
        style={{
          background: "linear-gradient(180deg, #5c0000 0%, #8b0000 30%, #6b0000 100%)",
          border: "4px solid #daa520",
          boxShadow: "4px 4px 0 rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.3), 0 0 12px rgba(218,165,32,0.3)",
          padding: "12px 16px",
          minWidth: "340px",
        }}
      >
        {/* Top Marquee */}
        <div className="text-center mb-3">
          <div className="text-2xl text-gold animate-marquee-glow font-bold tracking-wider">
            777
          </div>
          <div className="text-[8px] uppercase tracking-widest text-gold-dim mt-1">
            {paused
              ? "PAUSED"
              : showingResult
                ? isWin
                  ? "WINNER!"
                  : "NO LUCK"
                : phase === "spinning"
                  ? "SPINNING..."
                  : "INSERT COIN"}
          </div>
        </div>

        {/* Reel area + Lever */}
        <div className="flex items-center">
          {/* Reel Window */}
          <div
            className="flex gap-2 p-3"
            style={{
              background: "#0a0a0a",
              border: "3px solid #b5a642",
              boxShadow: "inset 0 4px 12px rgba(0,0,0,0.8), 2px 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            <Reel spinning={phase === "spinning"} symbol={reelSymbols[0]} />
            <Reel spinning={phase === "spinning"} symbol={reelSymbols[1]} />
            <Reel spinning={phase === "spinning"} symbol={reelSymbols[2]} />
          </div>

          {/* Side Lever */}
          <Lever pulling={leverPull} />
        </div>

        {/* Result Display */}
        <div className="mt-3 text-center min-h-[24px]">
          {showingResult && isWin && displayResult.rewardSol !== null && (
            <div className="text-win-green text-sm font-bold animate-bounce-in">
              +{displayResult.rewardSol.toFixed(4)} SOL
            </div>
          )}

          {showingResult && isLose && (
            <div className="text-lose-red text-[9px] animate-bounce-in">
              BETTER LUCK NEXT TIME
            </div>
          )}

          {paused && !showingResult && (
            <div className="text-[8px] text-gold-dim border border-gold-dim/30 px-3 py-1">
              MACHINE PAUSED - SPINS QUEUED
            </div>
          )}

          {!showingResult && !paused && (
            <div className="text-[7px] text-gold-dim/70 max-w-[260px]">
              SEND {minSolTransfer}+ SOL TO SPIN
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
