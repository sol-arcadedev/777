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
        background: "#0a0a0a",
        border: "2px solid #daa520",
        boxShadow: "2px 2px 0 rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.5)",
      }}
    >
      <div className="text-[7px] uppercase tracking-wider text-gold-dim mb-1">
        BUYBACK & BURN
      </div>
      <div className="text-lg font-bold text-gold">{display}</div>
    </div>
  );
}
