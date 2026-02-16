import { useState, useEffect } from "react";
import { getBurnStats } from "../lib/api";
import type { BurnStatsDTO } from "@shared/types";

interface BurnDisplayProps {
  burnUpdate: BurnStatsDTO | null;
}

export default function BurnDisplay({ burnUpdate }: BurnDisplayProps) {
  const [stats, setStats] = useState<BurnStatsDTO | null>(null);

  useEffect(() => {
    getBurnStats()
      .then(setStats)
      .catch((err) => console.error("Failed to fetch burn stats:", err));
  }, []);

  useEffect(() => {
    if (burnUpdate) {
      setStats(burnUpdate);
    }
  }, [burnUpdate]);

  const totalBurned = stats ? BigInt(stats.totalBurned) : 0n;
  const formatted = totalBurned > 0n
    ? Number(totalBurned / 1_000_000n).toLocaleString()
    : "0";

  return (
    <div
      className="text-center px-3 py-2"
      style={{
        background: "#0a0a0a",
        border: "2px solid #daa520",
        boxShadow: "2px 2px 0 rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.5)",
      }}
    >
      <div className="text-[7px] uppercase tracking-wider text-gold-dim mb-1">BURNED SUPPLY</div>
      <div className="text-lg font-bold text-gold">{formatted}</div>
      <div className="text-[7px] text-gold-dim/60">TOKENS BURNED</div>
    </div>
  );
}
