interface RulesProps {
  requiredHoldings: string;
  minSolTransfer: number;
}

export default function Rules({ requiredHoldings, minSolTransfer }: RulesProps) {
  return (
    <div
      className="p-3"
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #111 100%)",
        border: "3px solid #daa520",
        boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
      }}
    >
      <h2 className="text-[9px] uppercase tracking-wider text-gold mb-2">
        HOW TO PLAY
      </h2>
      <ol className="text-[7px] text-cream/70 space-y-2 list-decimal list-inside">
        <li>
          HOLD <span className="text-gold">{Number(requiredHoldings).toLocaleString()}</span> 777 TOKENS
        </li>
        <li>
          SEND <span className="text-gold">{minSolTransfer} SOL</span> TO VERIFICATION WALLET
        </li>
        <li>
          WIN CHANCE INCREASES OVER TIME (<span className="text-win-green">2% &rarr; 8%</span>)
        </li>
        <li>
          REWARD DECREASES AS CHANCE RISES (<span className="text-gold">40% &rarr; 10%</span>)
        </li>
        <li>
          CYCLE RESETS EVERY <span className="text-gold">60 MIN</span>
        </li>
        <li>
          BUSY? YOU JOIN THE QUEUE
        </li>
      </ol>
    </div>
  );
}
