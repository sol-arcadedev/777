interface WinChanceDisplayProps {
  winChance: number;
  cycleSecondsLeft: number;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function WinChanceDisplay({ winChance, cycleSecondsLeft }: WinChanceDisplayProps) {
  return (
    <div
      className="text-center px-3 py-2"
      style={{
        background: "rgba(10,10,10,0.9)",
        border: "2px solid #00ff41",
        boxShadow: "2px 2px 0 rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.5), 0 0 8px rgba(0,255,65,0.15)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="text-[8px] uppercase tracking-wider text-gold-dim mb-1">WIN CHANCE</div>
      <div className="text-2xl font-bold text-win-green">
        {winChance}%
        <span className="text-[10px] ml-1 text-win-green/70">&uarr;</span>
      </div>
      <div className="text-[7px] text-gold-dim/60">
        RESETS IN {formatTime(cycleSecondsLeft)}
      </div>
    </div>
  );
}
