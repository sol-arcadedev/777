import { useState, useEffect, useRef, useMemo } from "react";
import type { SpinResultEvent, ReelSymbol } from "@shared/types";

interface SlotMachineProps {
  isSpinning: boolean;
  paused: boolean;
  minSolTransfer: number;
  spinResult: SpinResultEvent | null;
  onResultDone: () => void;
}

type Phase = "idle" | "spinning" | "stopping" | "result";
type ReelState = "spinning" | "stopped";

const RESULT_DISPLAY_MS = 3500;
const STAGGER_DELAY_MS = 500;
const STRIP_LENGTH = 15;

const ALL_SYMBOLS: ReelSymbol[] = ["7", "SOL", "X"];

function randomSymbol(): ReelSymbol {
  return ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
}

function generateStrip(): ReelSymbol[] {
  return Array.from({ length: STRIP_LENGTH }, () => randomSymbol());
}

/** Inline Solana logo SVG */
function SolanaLogo({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 397 311"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sol-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <path
        d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"
        fill="url(#sol-grad)"
      />
      <path
        d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"
        fill="url(#sol-grad)"
      />
      <path
        d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
        fill="url(#sol-grad)"
      />
    </svg>
  );
}

/** Renders a single symbol: "7" (gold), "SOL" (Solana logo), or "X" (red) */
function SymbolDisplay({
  symbol,
  size = "large",
}: {
  symbol: ReelSymbol;
  size?: "large" | "small";
}) {
  const textClass =
    size === "large" ? "text-5xl" : "text-2xl";

  if (symbol === "SOL") {
    return (
      <div className="flex items-center justify-center">
        <SolanaLogo size={size === "large" ? 40 : 20} />
      </div>
    );
  }

  if (symbol === "X") {
    return (
      <div
        className={`${textClass} font-bold text-lose-red`}
        style={{ fontFamily: "'Press Start 2P', cursive" }}
      >
        X
      </div>
    );
  }

  // "7"
  return (
    <div
      className={`${textClass} font-bold text-gold`}
      style={{ fontFamily: "'Press Start 2P', cursive" }}
    >
      7
    </div>
  );
}

function Reel({
  state,
  finalSymbol,
  strip,
}: {
  state: ReelState;
  finalSymbol: ReelSymbol;
  strip: ReelSymbol[];
}) {
  return (
    <div
      className="w-20 h-24 bg-casino-dark border-3 border-brass overflow-hidden flex items-center justify-center"
      style={{
        boxShadow:
          "inset 0 2px 8px rgba(0,0,0,0.6), 2px 2px 0 rgba(0,0,0,0.4)",
      }}
    >
      {state === "spinning" ? (
        <div className="animate-reel-scroll flex flex-col">
          {strip.map((s, i) => (
            <div
              key={i}
              className="h-24 flex items-center justify-center shrink-0"
            >
              <SymbolDisplay symbol={s} />
            </div>
          ))}
        </div>
      ) : (
        <div className="animate-reel-stop">
          <SymbolDisplay symbol={finalSymbol} />
        </div>
      )}
    </div>
  );
}

function Lever({ pulling }: { pulling: boolean }) {
  return (
    <div className="flex flex-col items-center ml-3" style={{ width: "28px" }}>
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
            boxShadow:
              "inset -2px -2px 0 rgba(0,0,0,0.3), 2px 2px 0 rgba(0,0,0,0.3)",
          }}
        />
        {/* Shaft */}
        <div
          className="bg-gold-dim"
          style={{
            width: "6px",
            height: "60px",
            boxShadow:
              "1px 0 0 rgba(0,0,0,0.3), -1px 0 0 rgba(255,255,255,0.1)",
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

export default function SlotMachine({
  isSpinning,
  paused,
  minSolTransfer,
  spinResult,
  onResultDone,
}: SlotMachineProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [displayResult, setDisplayResult] = useState<SpinResultEvent | null>(
    null,
  );
  const [reelStates, setReelStates] = useState<[ReelState, ReelState, ReelState]>([
    "stopped",
    "stopped",
    "stopped",
  ]);
  const [leverPull, setLeverPull] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staggerTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Generate random strips for spinning animation (regenerate each spin)
  const strips = useMemo(
    () => [generateStrip(), generateStrip(), generateStrip()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase === "spinning"],
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      staggerTimers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (spinResult) {
      // Start staggered stop sequence
      setPhase("stopping");
      setDisplayResult(spinResult);

      // Stop left reel first
      setReelStates(["stopped", "spinning", "spinning"]);

      // Stop middle reel after delay
      const t1 = setTimeout(() => {
        setReelStates(["stopped", "stopped", "spinning"]);
      }, STAGGER_DELAY_MS);

      // Stop right reel after another delay, then show result
      const t2 = setTimeout(() => {
        setReelStates(["stopped", "stopped", "stopped"]);
        setPhase("result");
      }, STAGGER_DELAY_MS * 2);

      staggerTimers.current = [t1, t2];

      // Auto-dismiss result after display period
      timerRef.current = setTimeout(() => {
        setPhase("idle");
        setDisplayResult(null);
        setReelStates(["stopped", "stopped", "stopped"]);
        onResultDone();
      }, STAGGER_DELAY_MS * 2 + RESULT_DISPLAY_MS);
    } else if (isSpinning && phase !== "result" && phase !== "stopping") {
      setPhase("spinning");
      setReelStates(["spinning", "spinning", "spinning"]);
      setLeverPull(true);
      setTimeout(() => setLeverPull(false), 600);
    } else if (!isSpinning && phase !== "result" && phase !== "stopping") {
      setPhase("idle");
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinResult, isSpinning]);

  const isWin = displayResult?.result === "WIN";
  const isRefund = displayResult?.result === "REFUND";
  const isLose = displayResult?.result === "LOSE";
  const showingResult =
    (phase === "result" || phase === "stopping") && displayResult !== null;

  const finalSymbols: [ReelSymbol, ReelSymbol, ReelSymbol] =
    displayResult?.reelSymbols ?? ["7", "7", "7"];

  const marqueeText = paused
    ? "PAUSED"
    : showingResult
      ? isWin
        ? "JACKPOT!"
        : isRefund
          ? "REFUND!"
          : "NO LUCK"
      : phase === "spinning"
        ? "SPINNING..."
        : "INSERT COIN";

  const containerClass = [
    "relative overflow-hidden",
    phase === "spinning" && "animate-glow",
    showingResult && isWin && "win-glow",
    showingResult && isRefund && "refund-glow",
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
          background:
            "linear-gradient(180deg, #5c0000 0%, #8b0000 30%, #6b0000 100%)",
          border: "4px solid #daa520",
          boxShadow:
            "4px 4px 0 rgba(0,0,0,0.6), inset 0 0 20px rgba(0,0,0,0.3), 0 0 12px rgba(218,165,32,0.3)",
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
            {marqueeText}
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
              boxShadow:
                "inset 0 4px 12px rgba(0,0,0,0.8), 2px 2px 0 rgba(0,0,0,0.4)",
            }}
          >
            <Reel
              state={reelStates[0]}
              finalSymbol={finalSymbols[0]}
              strip={strips[0]}
            />
            <Reel
              state={reelStates[1]}
              finalSymbol={finalSymbols[1]}
              strip={strips[1]}
            />
            <Reel
              state={reelStates[2]}
              finalSymbol={finalSymbols[2]}
              strip={strips[2]}
            />
          </div>

          {/* Side Lever */}
          <Lever pulling={leverPull} />
        </div>

        {/* Result Display */}
        <div className="mt-3 text-center min-h-[24px]">
          {showingResult &&
            isWin &&
            displayResult.rewardSol !== null && (
              <div className="text-win-green text-sm font-bold animate-bounce-in">
                +{displayResult.rewardSol.toFixed(4)} SOL
              </div>
            )}

          {showingResult && isRefund && displayResult.refundSol !== null && (
            <div
              className="text-sm font-bold animate-bounce-in"
              style={{ color: "#14F195" }}
            >
              REFUND! +{displayResult.refundSol.toFixed(4)} SOL
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

          {!showingResult && !paused && phase === "idle" && (
            <div className="text-[7px] text-gold-dim/70 max-w-[260px]">
              SEND {minSolTransfer}+ SOL TO SPIN
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
