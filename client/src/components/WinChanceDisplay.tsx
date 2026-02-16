interface WinChanceDisplayProps {
  winChance: number;
}

export default function WinChanceDisplay({ winChance }: WinChanceDisplayProps) {
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
      <div className="text-[9px] uppercase tracking-wider text-gold-dim mb-1">WIN CHANCE</div>
      <div className="text-2xl font-bold text-gold">
        {winChance}%
      </div>
    </div>
  );
}
