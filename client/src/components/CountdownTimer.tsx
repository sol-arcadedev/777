import { useCountdown } from "../hooks/useCountdown";

interface CountdownTimerProps {
  durationSec: number;
}

export default function CountdownTimer({ durationSec }: CountdownTimerProps) {
  const { display } = useCountdown(durationSec);

  return (
    <div className="text-center bg-casino-card border border-casino-border rounded-lg px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">
        Buyback & Burn
      </div>
      <div className="text-2xl font-bold font-mono text-gold">{display}</div>
    </div>
  );
}
