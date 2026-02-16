import { useState, useEffect, useRef } from "react";

interface RewardDisplayProps {
  rewardPercent: number;
  balanceSol: number | null;
}

export default function RewardDisplay({ rewardPercent, balanceSol }: RewardDisplayProps) {
  const rewardAmount = balanceSol !== null ? balanceSol * (rewardPercent / 100) : null;
  const [pulsing, setPulsing] = useState(false);
  const [showArrow, setShowArrow] = useState(false);
  const prevBalance = useRef(balanceSol);

  useEffect(() => {
    if (prevBalance.current !== null && balanceSol !== null && balanceSol !== prevBalance.current) {
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 600);

      if (balanceSol > prevBalance.current) {
        setShowArrow(true);
        const arrowTimer = setTimeout(() => setShowArrow(false), 1500);
        prevBalance.current = balanceSol;
        return () => { clearTimeout(timer); clearTimeout(arrowTimer); };
      }

      prevBalance.current = balanceSol;
      return () => clearTimeout(timer);
    }
    prevBalance.current = balanceSol;
  }, [balanceSol]);

  return (
    <div
      className="text-center px-3 py-2"
      style={{
        background: "rgba(10,10,10,0.9)",
        border: "2px solid #daa520",
        boxShadow: "2px 2px 0 rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.5), 0 0 8px rgba(218,165,32,0.15)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="text-[9px] uppercase tracking-wider text-gold-dim mb-1">CURRENT REWARD</div>
      {rewardAmount !== null ? (
        <>
          <div className="flex items-center justify-center gap-1">
            <div className={`text-2xl font-bold text-gold ${pulsing ? "animate-reward-pulse" : ""}`}>{rewardAmount.toFixed(4)} SOL</div>
            {showArrow && (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                className="reward-arrow-up"
                style={{ color: "#00ff41" }}
              >
                <path d="M8 2L13 8H10V14H6V8H3L8 2Z" fill="currentColor" />
              </svg>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="text-2xl font-bold text-gold">{rewardPercent}%</div>
          <div className="text-[8px] text-gold-dim/60">OF REWARD WALLET</div>
        </>
      )}
    </div>
  );
}
