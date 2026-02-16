import { useState } from "react";
import { formatAddress, copyToClipboard } from "../lib/utils";
import { PUMP_BUY_URL } from "../lib/constants";

interface HeaderProps {
  tokenCA: string;
}

export default function Header({ tokenCA }: HeaderProps) {
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
        <h1 className="text-5xl font-bold tracking-wider text-shimmer animate-marquee-glow">
          777
        </h1>
        <div
          className="flex items-center gap-2 text-[9px] border-2 border-gold-dim px-3 py-1.5 text-cream"
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
        {hasCA && (
          <a
            href={`${PUMP_BUY_URL}${tokenCA}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-gold text-casino-dark font-bold px-6 py-2 text-[11px] hover:bg-gold-bright transition-colors uppercase animate-buy-pulse"
          >
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
