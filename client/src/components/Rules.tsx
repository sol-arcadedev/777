interface RulesProps {
  requiredHoldings: string;
  minSolTransfer: number;
}

export default function Rules({ requiredHoldings, minSolTransfer }: RulesProps) {
  return (
    <div
      className="p-4"
      style={{
        background: "linear-gradient(180deg, rgba(10,10,10,0.92) 0%, rgba(17,17,17,0.92) 100%)",
        border: "3px solid #daa520",
        boxShadow: "3px 3px 0 rgba(0,0,0,0.5), 0 0 10px rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <h2 className="text-[11px] uppercase tracking-wider text-gold mb-3">
        HOW TO PLAY
      </h2>
      <ol className="text-[9px] text-cream/70 space-y-3 list-none">
        <li>
          <span className="text-gold-dim mr-1">[1]</span>
          HOLD <span className="text-gold font-bold">{Number(requiredHoldings).toLocaleString()}</span> 777 TOKENS
        </li>
        <li>
          <span className="text-gold-dim mr-1">[2]</span>
          SEND <span className="text-gold font-bold">{minSolTransfer} SOL</span> TO VERIFICATION WALLET
        </li>
        <li>
          <span className="text-gold-dim mr-1">[3]</span>
          WIN CHANCE INCREASES OVER TIME (<span className="text-win-green font-bold">2% &rarr; 8%</span>)
        </li>
        <li>
          <span className="text-gold-dim mr-1">[4]</span>
          REWARD DECREASES AS CHANCE RISES (<span className="text-gold font-bold">40% &rarr; 10%</span>)
        </li>
        <li>
          <span className="text-gold-dim mr-1">[5]</span>
          CYCLE RESETS EVERY <span className="text-gold font-bold">60 MIN</span>
        </li>
        <li>
          <span className="text-gold-dim mr-1">[6]</span>
          BUSY? YOU JOIN THE QUEUE
        </li>
      </ol>
    </div>
  );
}
