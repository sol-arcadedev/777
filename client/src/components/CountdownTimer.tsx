import { useCountdown } from "../hooks/useCountdown";

interface CountdownTimerProps {
  expiresAt: string | null;
}

export default function CountdownTimer({ expiresAt }: CountdownTimerProps) {
  const { display } = useCountdown(expiresAt);

  return (
    <div
      className="text-center px-3 py-2"
      style={{
        background: "rgba(10,10,10,0.9)",
        border: "2px solid #ff6b35",
        boxShadow: "2px 2px 0 rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.5), 0 0 8px rgba(255,107,53,0.15)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="text-[8px] uppercase tracking-wider text-gold-dim mb-1">
        BUYBACK & BURN
      </div>
      <div className="text-xl font-bold text-gold">{display}</div>
    </div>
  );
}
