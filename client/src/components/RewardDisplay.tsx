interface RewardDisplayProps {
  rewardPercent: number;
}

export default function RewardDisplay({ rewardPercent }: RewardDisplayProps) {
  return (
    <div className="text-center bg-casino-card border border-casino-border rounded-lg px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Current Reward</div>
      <div className="text-2xl font-bold text-gold">{rewardPercent}%</div>
      <div className="text-xs text-neutral-500">of Reward Wallet balance</div>
    </div>
  );
}
