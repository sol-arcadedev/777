interface RewardDisplayProps {
  rewardPercent: number;
  balanceSol: number | null;
}

export default function RewardDisplay({ rewardPercent, balanceSol }: RewardDisplayProps) {
  const rewardAmount = balanceSol !== null ? balanceSol * (rewardPercent / 100) : null;

  return (
    <div className="text-center bg-casino-card border border-casino-border rounded-lg px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Current Reward</div>
      {rewardAmount !== null ? (
        <>
          <div className="text-2xl font-bold text-gold">{rewardAmount.toFixed(4)} SOL</div>
          <div className="text-xs text-neutral-500">
            {rewardPercent}% of {balanceSol!.toFixed(4)} SOL
          </div>
        </>
      ) : (
        <>
          <div className="text-2xl font-bold text-gold">{rewardPercent}%</div>
          <div className="text-xs text-neutral-500">of Reward Wallet balance</div>
        </>
      )}
    </div>
  );
}
