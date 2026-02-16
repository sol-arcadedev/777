import { useState, useEffect, useRef } from "react";

interface RewardDisplayProps {
  rewardPercent: number;
  balanceSol: number | null;
}

export default function RewardDisplay({ rewardPercent, balanceSol }: RewardDisplayProps) {
  const rewardAmount = balanceSol !== null ? balanceSol * (rewardPercent / 100) : null;
  const [pulsing, setPulsing] = useState(false);
  const prevBalance = useRef(balanceSol);

  useEffect(() => {
    if (prevBalance.current !== null && balanceSol !== null && balanceSol !== prevBalance.current) {
      setPulsing(true);
      const timer = setTimeout(() => setPulsing(false), 600);
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
          <div className={`text-2xl font-bold text-gold ${pulsing ? "animate-reward-pulse" : ""}`}>{rewardAmount.toFixed(4)} SOL</div>
          <div className="text-[8px] text-gold-dim/60">
            {rewardPercent}% OF {balanceSol!.toFixed(4)}
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
