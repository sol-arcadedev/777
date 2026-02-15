interface RulesProps {
  requiredHoldings: string;
  minSolTransfer: number;
}

export default function Rules({ requiredHoldings, minSolTransfer }: RulesProps) {
  return (
    <div className="bg-casino-card border border-casino-border rounded-xl p-4">
      <h2 className="text-sm uppercase tracking-wider text-gold-dim mb-3">
        How to Play
      </h2>
      <ol className="text-xs text-neutral-400 space-y-2 list-decimal list-inside">
        <li>
          Hold at least <span className="text-white">{Number(requiredHoldings).toLocaleString()}</span> 777 tokens
        </li>
        <li>
          Send minimum <span className="text-white">{minSolTransfer} SOL</span> to the Verification Wallet
        </li>
        <li>
          Base win chance is <span className="text-win-green">3%</span>. Each extra 0.01 SOL adds +1% (max 5%)
        </li>
        <li>
          Winners receive a % of the Reward Wallet balance automatically
        </li>
        <li>
          If the machine is busy, you're placed in a queue
        </li>
      </ol>
    </div>
  );
}
