import { useState, useEffect } from "react";
import { copyToClipboard } from "../lib/utils";
import { PUMP_BUY_URL } from "../lib/constants";
import { useCountdown } from "../hooks/useCountdown";
import { getBurnStats } from "../lib/api";
import type { BurnStatsDTO } from "@shared/types";

interface HeaderProps {
  tokenCA: string;
  expiresAt: string | null;
  burnUpdate: BurnStatsDTO | null;
}

export default function Header({ tokenCA, expiresAt, burnUpdate }: HeaderProps) {
  const [copied, setCopied] = useState(false);
  const hasCA = tokenCA !== "To be added";

  const handleCopy = async () => {
    if (!hasCA) return;
    const ok = await copyToClipboard(tokenCA);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <header
      className="flex items-center justify-between px-6 py-3 relative z-[2]"
      style={{
        background: "linear-gradient(180deg, #4a0000 0%, #8b0000 40%, #6b0000 100%)",
        borderBottom: "3px solid #daa520",
        boxShadow: "0 3px 0 rgba(0,0,0,0.6), 0 6px 20px rgba(0,0,0,0.8), 0 0 15px rgba(218,165,32,0.2)",
      }}
    >
      <div className="flex items-center gap-4">
        <img src="/777_TokenImage.png" alt="777" className="h-12 w-12" style={{ imageRendering: "auto" }} />
        <div
          className="flex items-center gap-2 text-[12px] border-2 border-gold-dim px-3 py-1.5 text-cream"
          style={{
            background: "rgba(0,0,0,0.5)",
            boxShadow: "2px 2px 0 rgba(0,0,0,0.5)",
          }}
        >
          <span>CA: {hasCA ? tokenCA : "TBA"}</span>
          {hasCA && (
            <button
              onClick={handleCopy}
              className="text-gold-dim hover:text-gold transition-colors cursor-pointer"
              title="Copy CA"
            >
              {copied ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <HeaderCountdown expiresAt={expiresAt} />
        <HeaderBurn burnUpdate={burnUpdate} />
        <div className="border-l-2 h-6 mx-1" style={{ borderColor: "rgba(218,165,32,0.3)" }} />
        {hasCA && (
          <a
            href={`${PUMP_BUY_URL}${tokenCA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold text-casino-dark font-bold px-6 py-2 text-[11px] hover:bg-gold-bright transition-colors uppercase animate-buy-pulse flex items-center gap-2"
          >
            {/* PumpFun pill icon */}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: "pixelated" }}>
              <rect x="4" y="1" width="8" height="2" rx="0" fill="#1a1a1a" />
              <rect x="3" y="3" width="10" height="2" fill="#1a1a1a" />
              <rect x="2" y="5" width="12" height="4" fill="#1a1a1a" />
              <rect x="3" y="9" width="10" height="2" fill="#1a1a1a" />
              <rect x="4" y="11" width="8" height="2" fill="#1a1a1a" />
              <rect x="5" y="13" width="6" height="2" fill="#1a1a1a" />
              <rect x="5" y="3" width="6" height="2" fill="#3bba6a" />
              <rect x="4" y="5" width="8" height="2" fill="#3bba6a" />
              <rect x="4" y="7" width="8" height="2" fill="#1a8a4a" />
              <rect x="5" y="9" width="6" height="2" fill="#1a8a4a" />
              <rect x="6" y="4" width="2" height="2" fill="#fff" fillOpacity="0.4" />
            </svg>
            BUY ON PUMP
          </a>
        )}
        <a
          href="https://x.com"
          target="_blank"
          rel="noopener noreferrer"
          className="border-2 border-gold-dim px-5 py-2 text-[10px] text-cream hover:border-gold transition-colors uppercase"
          style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
        >
          X COMMUNITY
        </a>
      </div>
    </header>
  );
}

function HeaderCountdown({ expiresAt }: { expiresAt: string | null }) {
  const { display } = useCountdown(expiresAt);

  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 text-[10px]"
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "2px solid #ff6b35",
        boxShadow: "0 0 6px rgba(255,107,53,0.15)",
      }}
    >
      {/* Pixel stopwatch */}
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: "pixelated" }}>
        <rect x="6" y="0" width="4" height="2" fill="#ff6b35" />
        <rect x="7" y="2" width="2" height="1" fill="#ff6b35" />
        <rect x="4" y="3" width="8" height="2" fill="#ff6b35" />
        <rect x="3" y="5" width="10" height="2" fill="#ff6b35" />
        <rect x="3" y="7" width="10" height="2" fill="#ff6b35" />
        <rect x="3" y="9" width="10" height="2" fill="#ff6b35" />
        <rect x="4" y="11" width="8" height="2" fill="#ff6b35" />
        <rect x="5" y="13" width="6" height="2" fill="#ff6b35" />
        <rect x="7" y="5" width="2" height="4" fill="#0a0a0a" />
        <rect x="8" y="6" width="3" height="2" fill="#0a0a0a" />
      </svg>
      <span className="text-gold-dim uppercase tracking-wider text-[8px]">BURN</span>
      <span className="text-gold font-bold">{display}</span>
    </div>
  );
}

function HeaderBurn({ burnUpdate }: { burnUpdate: BurnStatsDTO | null }) {
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
      className="flex items-center gap-2 px-3 py-1.5 text-[10px]"
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "2px solid #9945FF",
        boxShadow: "0 0 6px rgba(153,69,255,0.15)",
      }}
    >
      {/* Pixel flame */}
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ imageRendering: "pixelated" }}>
        <rect x="7" y="0" width="2" height="2" fill="#ff6b35" />
        <rect x="6" y="2" width="4" height="2" fill="#ff6b35" />
        <rect x="5" y="4" width="6" height="2" fill="#ff6b35" />
        <rect x="4" y="6" width="8" height="2" fill="#ff6b35" />
        <rect x="3" y="8" width="10" height="2" fill="#ff6b35" />
        <rect x="3" y="10" width="10" height="2" fill="#ff6b35" />
        <rect x="4" y="12" width="8" height="2" fill="#ff6b35" />
        <rect x="5" y="14" width="6" height="2" fill="#ff6b35" />
        <rect x="6" y="6" width="4" height="2" fill="#ffd700" />
        <rect x="6" y="8" width="4" height="4" fill="#ffd700" />
        <rect x="7" y="4" width="2" height="2" fill="#ffd700" />
      </svg>
      <span className="text-gold-dim uppercase tracking-wider text-[8px]">BURNED</span>
      <span className="text-gold font-bold">{formatted}</span>
    </div>
  );
}
