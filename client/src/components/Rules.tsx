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
          SEND MIN <span className="text-gold">{minSolTransfer} SOL</span> TO VERIFICATION WALLET
        </li>
        <li>
          BASE WIN: <span className="text-win-green">3%</span> | +1% PER 0.01 SOL (MAX 5%)
        </li>
        <li>
          WINNERS GET % OF REWARD WALLET
        </li>
        <li>
          BUSY? YOU JOIN THE QUEUE
        </li>
      </ol>
    </div>
  );
}
