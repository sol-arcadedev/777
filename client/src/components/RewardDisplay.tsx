interface RewardDisplayProps {
  rewardPercent: number;
  balanceSol: number | null;
}

export default function RewardDisplay({ rewardPercent, balanceSol }: RewardDisplayProps) {
  const rewardAmount = balanceSol !== null ? balanceSol * (rewardPercent / 100) : null;

  return (
    <div
      className="text-center px-3 py-2"
      style={{
        background: "#0a0a0a",
        border: "2px solid #daa520",
        boxShadow: "2px 2px 0 rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.5)",
      }}
    >
      <div className="text-[7px] uppercase tracking-wider text-gold-dim mb-1">CURRENT REWARD</div>
      {rewardAmount !== null ? (
        <>
          <div className="text-lg font-bold text-gold">{rewardAmount.toFixed(4)} SOL</div>
          <div className="text-[7px] text-gold-dim/60">
            {rewardPercent}% OF {balanceSol!.toFixed(4)}
          </div>
        </>
      ) : (
        <>
          <div className="text-lg font-bold text-gold">{rewardPercent}%</div>
          <div className="text-[7px] text-gold-dim/60">OF REWARD WALLET</div>
        </>
      )}
    </div>
  );
}
