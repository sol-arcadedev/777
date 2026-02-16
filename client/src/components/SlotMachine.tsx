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
type ReelState = "spinning" | "stopped" | "initial";

const MIN_SPIN_MS = 2000;
const STAGGER_DELAY_MS = 600;
const RESULT_DISPLAY_MS = 3000;
const STRIP_LENGTH = 15;

const ALL_SYMBOLS: ReelSymbol[] = ["7", "SOL", "X"];

const winSfx = new Audio("/sfx/777_sfx.mp3");
const refundSfx = new Audio("/sfx/SOLRefund_sfx.mp3");
winSfx.preload = "auto";
refundSfx.preload = "auto";
winSfx.volume = 0.03;
refundSfx.volume = 0.03;

function randomSymbol(): ReelSymbol {
  return ALL_SYMBOLS[Math.floor(Math.random() * ALL_SYMBOLS.length)];
}

function generateStrip(): ReelSymbol[] {
  return Array.from({ length: STRIP_LENGTH }, () => randomSymbol());
}

/** Inline Solana logo SVG */
function SolanaLogo({ size = 48 }: { size?: number }) {
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
    size === "large" ? "text-6xl" : "text-2xl";

  if (symbol === "SOL") {
    return (
      <div className="flex items-center justify-center">
        <SolanaLogo size={size === "large" ? 48 : 20} />
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
      className="w-24 h-28 overflow-hidden flex items-center justify-center scanlines"
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #111 50%, #0a0a0a 100%)",
        border: "3px solid #8b7340",
        boxShadow:
          "inset 0 2px 8px rgba(0,0,0,0.8), inset 0 -2px 8px rgba(0,0,0,0.8), 2px 2px 0 rgba(0,0,0,0.4)",
      }}
    >
      {state === "spinning" ? (
        <div className="animate-reel-scroll flex flex-col">
          {strip.map((s, i) => (
            <div
              key={i}
              className="h-28 flex items-center justify-center shrink-0"
            >
              <SymbolDisplay symbol={s} />
            </div>
          ))}
        </div>
      ) : (
        <div className={state === "stopped" ? "animate-reel-stop" : ""}>
          <SymbolDisplay symbol={finalSymbol} />
        </div>
      )}
    </div>
  );
}

function Lever({ pulling }: { pulling: boolean }) {
  return (
    <div className="flex flex-col items-center ml-4" style={{ width: "32px" }}>
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
          style={{
            width: "22px",
            height: "22px",
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 35%, #ff4444, #8b0000)",
            border: "3px solid #600",
            boxShadow:
              "inset -2px -2px 0 rgba(0,0,0,0.4), 2px 2px 0 rgba(0,0,0,0.4), 0 0 6px rgba(255,0,0,0.3)",
          }}
        />
        {/* Shaft */}
        <div
          style={{
            width: "8px",
            height: "65px",
            background: "linear-gradient(90deg, #b5a642 0%, #daa520 40%, #b5a642 100%)",
            boxShadow:
              "2px 0 0 rgba(0,0,0,0.3), -1px 0 0 rgba(255,255,255,0.15)",
          }}
        />
      </div>
      {/* Pivot base */}
      <div
        style={{
          width: "20px",
          height: "10px",
          borderRadius: "0 0 6px 6px",
          background: "linear-gradient(180deg, #b5a642, #8b7340)",
          boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
        }}
      />
    </div>
  );
}

/** Decorative light bulbs row */
function LightBulbs({ count, spinning }: { count: number; spinning: boolean }) {
  return (
    <div className="flex justify-center gap-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={spinning ? "slot-bulb-spinning" : "slot-bulb-idle"}
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: i % 2 === 0 ? "#ffd700" : "#ff4444",
            border: "1px solid rgba(0,0,0,0.4)",
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

function ConfettiParticle({ index }: { index: number }) {
  const colors = ["#ffd700", "#ffe44d", "#00ff41", "#60a5fa", "#f472b6", "#ff6b6b"];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const duration = 1.5 + Math.random();
  const size = 6 + Math.random() * 6;

  return (
    <div
      className="confetti-particle"
      style={{
        left: `${left}%`,
        backgroundColor: color,
        width: `${size}px`,
        height: `${size}px`,
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
    "initial",
    "initial",
    "initial",
  ]);
  const [leverPull, setLeverPull] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staggerTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const spinStartRef = useRef<number>(0);
  const handledResultRef = useRef<SpinResultEvent | null>(null);

  const strips = useMemo(
    () => [generateStrip(), generateStrip(), generateStrip()],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [phase === "spinning"],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      staggerTimers.current.forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    // Clear all pending animation timers
    const clearAllTimers = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      staggerTimers.current.forEach(clearTimeout);
      staggerTimers.current = [];
    };

    // Only handle each spinResult once — prevents re-entry when isSpinning changes
    if (spinResult && spinResult !== handledResultRef.current) {
      handledResultRef.current = spinResult;
      clearAllTimers();

      const elapsed = Date.now() - spinStartRef.current;
      const remaining = Math.max(0, MIN_SPIN_MS - elapsed);

      const stopReels = () => {
        setPhase("stopping");
        setDisplayResult(spinResult);

        setReelStates(["stopped", "spinning", "spinning"]);

        const t1 = setTimeout(() => {
          setReelStates(["stopped", "stopped", "spinning"]);
        }, STAGGER_DELAY_MS);

        const t2 = setTimeout(() => {
          setReelStates(["stopped", "stopped", "stopped"]);
          setPhase("result");

          if (spinResult.result === "WIN") {
            winSfx.currentTime = 0;
            winSfx.play().catch(() => {});
          } else if (spinResult.result === "REFUND") {
            refundSfx.currentTime = 0;
            refundSfx.play().catch(() => {});
          }
        }, STAGGER_DELAY_MS * 2);

        staggerTimers.current = [t1, t2];

        timerRef.current = setTimeout(() => {
          setPhase("idle");
          setDisplayResult(null);
          setReelStates(["stopped", "stopped", "stopped"]);
          handledResultRef.current = null;
          onResultDone();
        }, STAGGER_DELAY_MS * 2 + RESULT_DISPLAY_MS);
      };

      if (remaining > 0) {
        const waitTimer = setTimeout(stopReels, remaining);
        staggerTimers.current = [waitTimer];
      } else {
        stopReels();
      }
    } else if (!spinResult && isSpinning && phase !== "result" && phase !== "stopping") {
      clearAllTimers();
      setPhase("spinning");
      setReelStates(["spinning", "spinning", "spinning"]);
      spinStartRef.current = Date.now();
      setLeverPull(true);
      setTimeout(() => setLeverPull(false), 600);
    } else if (!spinResult && !isSpinning && phase !== "result" && phase !== "stopping") {
      setPhase("idle");
    }
    // No cleanup — timers are managed explicitly above.
    // Mount cleanup (line 270-275) handles unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spinResult, isSpinning]);

  const isWin = displayResult?.result === "WIN";
  const isRefund = displayResult?.result === "REFUND";
  const isLose = displayResult?.result === "LOSE";
  const showingResult =
    (phase === "result" || phase === "stopping") && displayResult !== null;
  const isSpinPhase = phase === "spinning";

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
    showingResult && isWin && "win-glow",
    showingResult && isRefund && "refund-glow",
    showingResult && isLose && "lose-flash",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      {/* Jackpot flash overlay */}
      {showingResult && isWin && (
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: "radial-gradient(circle, rgba(255,215,0,0.4), transparent 70%)",
            animation: "jackpot-flash 1s steps(4) 2",
          }}
        />
      )}

      {/* Confetti overlay for wins */}
      {showingResult && isWin && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiParticle key={i} index={i} />
          ))}
        </div>
      )}

      {/* === SLOT MACHINE CABINET === */}
      <div
        className="flex flex-col items-center"
        style={{
          minWidth: "400px",
        }}
      >
        {/* ─── Cabinet Top Crown ─── */}
        <div
          style={{
            width: "100%",
            background: "linear-gradient(180deg, #daa520 0%, #b5a642 50%, #8b7340 100%)",
            border: "3px solid #daa520",
            borderBottom: "none",
            borderRadius: "12px 12px 0 0",
            padding: "6px 0 4px",
            boxShadow: "0 -2px 8px rgba(218,165,32,0.3), inset 0 2px 0 rgba(255,255,255,0.2)",
          }}
        >
          <div
            className="text-center font-bold tracking-widest"
            style={{
              fontSize: "10px",
              color: "#1a0f00",
              textShadow: "0 1px 0 rgba(255,255,255,0.3)",
            }}
          >
            THE CREATOR FEE SLOT
          </div>
        </div>

        {/* ─── Top Light Bulbs ─── */}
        <div
          style={{
            width: "100%",
            background: "linear-gradient(180deg, #5c0000, #8b0000 20%)",
            borderLeft: "3px solid #daa520",
            borderRight: "3px solid #daa520",
            padding: "6px 12px",
          }}
        >
          <LightBulbs count={18} spinning={isSpinPhase} />
        </div>

        {/* ─── Main Cabinet Body ─── */}
        <div
          style={{
            width: "100%",
            background:
              "linear-gradient(180deg, #8b0000 0%, #6b0000 40%, #4a0000 100%)",
            borderLeft: "3px solid #daa520",
            borderRight: "3px solid #daa520",
            padding: "4px 16px 12px",
            boxShadow: "inset 0 0 30px rgba(0,0,0,0.3)",
          }}
        >
          {/* Marquee Display */}
          <div
            className="text-center mb-2 py-2"
            style={{
              background: "linear-gradient(180deg, #0a0a0a, #111, #0a0a0a)",
              border: "3px solid #8b7340",
              boxShadow: "inset 0 0 12px rgba(0,0,0,0.8), 0 0 6px rgba(218,165,32,0.15)",
            }}
          >
            <div className="text-3xl text-gold animate-marquee-glow font-bold tracking-wider">
              777
            </div>
            <div
              className="text-[8px] uppercase tracking-widest mt-0.5"
              style={{
                color: showingResult && isWin ? "#00ff41" : showingResult && isLose ? "#ff2020" : "#daa520",
              }}
            >
              {marqueeText}
            </div>
          </div>

          {/* Decorative rivets row */}
          <div className="flex justify-between px-2 mb-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, #daa520, #8b7340)",
                  border: "1px solid #6b5a30",
                  boxShadow: "inset -1px -1px 0 rgba(0,0,0,0.3), 1px 1px 0 rgba(0,0,0,0.2)",
                }}
              />
            ))}
          </div>

          {/* Reel area + Lever */}
          <div className="flex items-center justify-center">
            {/* Reel Window Frame */}
            <div
              style={{
                background: "linear-gradient(180deg, #8b7340, #b5a642, #8b7340)",
                padding: "4px",
                boxShadow: "3px 3px 0 rgba(0,0,0,0.5), 0 0 8px rgba(218,165,32,0.2)",
              }}
            >
              <div
                className="flex gap-1.5 p-2.5"
                style={{
                  background: "#050505",
                  boxShadow: "inset 0 4px 16px rgba(0,0,0,0.9), inset 0 -4px 16px rgba(0,0,0,0.9)",
                }}
              >
                <Reel
                  state={reelStates[0]}
                  finalSymbol={finalSymbols[0]}
                  strip={strips[0]}
                />
                {/* Separator */}
                <div style={{ width: "2px", background: "#8b7340", boxShadow: "0 0 2px rgba(218,165,32,0.3)" }} />
                <Reel
                  state={reelStates[1]}
                  finalSymbol={finalSymbols[1]}
                  strip={strips[1]}
                />
                <div style={{ width: "2px", background: "#8b7340", boxShadow: "0 0 2px rgba(218,165,32,0.3)" }} />
                <Reel
                  state={reelStates[2]}
                  finalSymbol={finalSymbols[2]}
                  strip={strips[2]}
                />
              </div>
            </div>

            {/* Side Lever */}
            <Lever pulling={leverPull} />
          </div>

          {/* Decorative rivets row */}
          <div className="flex justify-between px-2 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 35% 35%, #daa520, #8b7340)",
                  border: "1px solid #6b5a30",
                  boxShadow: "inset -1px -1px 0 rgba(0,0,0,0.3), 1px 1px 0 rgba(0,0,0,0.2)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ─── Bottom Light Bulbs ─── */}
        <div
          style={{
            width: "100%",
            background: "linear-gradient(180deg, #4a0000 80%, #3a0000)",
            borderLeft: "3px solid #daa520",
            borderRight: "3px solid #daa520",
            padding: "6px 12px",
          }}
        >
          <LightBulbs count={18} spinning={isSpinPhase} />
        </div>

        {/* ─── Payout / Result Tray ─── */}
        <div
          style={{
            width: "100%",
            background: "linear-gradient(180deg, #3a0000 0%, #2a0000 100%)",
            borderLeft: "3px solid #daa520",
            borderRight: "3px solid #daa520",
            padding: "8px 16px",
          }}
        >
          <div
            className="text-center min-h-[28px]"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "2px solid #8b7340",
              padding: "4px",
              boxShadow: "inset 0 2px 6px rgba(0,0,0,0.6)",
            }}
          >
            {showingResult &&
              isWin &&
              displayResult.rewardSol !== null && (
                <div className="text-win-green text-base font-bold animate-bounce-in animate-win-amount-pulse">
                  +{displayResult.rewardSol.toFixed(4)} SOL
                </div>
              )}

            {showingResult && isRefund && displayResult.refundSol !== null && (
              <div
                className="text-base font-bold animate-bounce-in"
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
              <div className="text-[8px] text-gold-dim">
                MACHINE PAUSED - SPINS QUEUED
              </div>
            )}

            {!showingResult && !paused && phase === "idle" && (
              <div className="text-[7px] text-gold-dim/70">
                AWAITING NEXT SPIN
              </div>
            )}
          </div>
        </div>

        {/* ─── Coin Slot / Base ─── */}
        <div
          style={{
            width: "100%",
            background: "linear-gradient(180deg, #2a0000, #1a0000)",
            border: "3px solid #daa520",
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            padding: "6px 0",
            boxShadow: "0 4px 8px rgba(0,0,0,0.6), inset 0 -2px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* Coin slot */}
          <div className="flex justify-center">
            <div
              style={{
                width: "40px",
                height: "6px",
                background: "#0a0a0a",
                border: "2px solid #8b7340",
                borderRadius: "3px",
                boxShadow: "inset 0 1px 3px rgba(0,0,0,0.8)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
