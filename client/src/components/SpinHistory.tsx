import { useState } from "react";
import { formatAddress, copyToClipboard } from "../lib/utils";
import type { SpinHistoryEntry, ReelSymbol } from "@shared/types";

interface SpinHistoryProps {
  spins: SpinHistoryEntry[];
}

function MiniSolanaLogo() {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 397 311"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sol-grad-hist" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9945FF" />
          <stop offset="100%" stopColor="#14F195" />
        </linearGradient>
      </defs>
      <path
        d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z"
        fill="url(#sol-grad-hist)"
      />
      <path
        d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"
        fill="url(#sol-grad-hist)"
      />
      <path
        d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"
        fill="url(#sol-grad-hist)"
      />
    </svg>
  );
}

function ReelSymbolIcon({ symbol }: { symbol: ReelSymbol }) {
  if (symbol === "SOL") {
    return (
      <span className="inline-flex items-center justify-center w-[14px] h-[14px]">
        <MiniSolanaLogo />
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center justify-center w-[14px] h-[14px] text-[10px] font-bold ${symbol === "7" ? "text-gold" : "text-lose-red"}`}
      style={{ fontFamily: "'Press Start 2P', cursive" }}
    >
      {symbol}
    </span>
  );
}

function ReelResult({ symbols }: { symbols: [ReelSymbol, ReelSymbol, ReelSymbol] }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <ReelSymbolIcon symbol={symbols[0]} />
      <ReelSymbolIcon symbol={symbols[1]} />
      <ReelSymbolIcon symbol={symbols[2]} />
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-gold-dim/40 hover:text-gold transition-colors cursor-pointer shrink-0 ml-1"
      title="Copy address"
    >
      {copied ? (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function SpinHistory({ spins }: SpinHistoryProps) {
  return (
    <div
      className="p-3 w-full"
      style={{
        background: "linear-gradient(180deg, rgba(10,10,10,0.92) 0%, rgba(17,17,17,0.92) 100%)",
        border: "3px solid #daa520",
        boxShadow: "3px 3px 0 rgba(0,0,0,0.5), 0 0 10px rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="-mx-3 -mt-3 mb-2 py-1.5 px-3 text-center"
        style={{
          background: "linear-gradient(180deg, #daa520, #8b7340)",
          borderBottom: "2px solid #6b5320",
        }}
      >
        <h2 className="text-[9px] uppercase tracking-wider" style={{ color: "#1a0f00" }}>
          SPIN HISTORY ({spins.length})
        </h2>
      </div>

      {spins.length === 0 ? (
        <div className="text-[9px] text-gold-dim/50 text-center py-3">
          NO SPINS YET
        </div>
      ) : (
        <div className="space-y-0.5 max-h-64 overflow-y-auto">
          {spins.map((spin, i) => {
            const isWin = spin.result === "WIN";
            const isRefund = spin.result === "REFUND";

            return (
              <div
                key={`${spin.holderAddress}-${spin.createdAt}-${i}`}
                className="flex items-center text-[8px] px-2 py-1"
                style={{
                  background: isWin
                    ? "rgba(218,165,32,0.15)"
                    : isRefund
                      ? "rgba(20,241,149,0.08)"
                      : i % 2 === 0
                        ? "rgba(255,255,255,0.03)"
                        : "transparent",
                  border: isWin
                    ? "1px solid rgba(218,165,32,0.4)"
                    : "1px solid transparent",
                }}
              >
                <span className="text-gold-dim/50 w-[4.5rem] shrink-0">
                  {formatTime(spin.createdAt)}
                </span>
                <span className="flex-1 flex items-center justify-center gap-0.5">
                  <span className="text-cream">
                    {formatAddress(spin.holderAddress)}
                  </span>
                  <CopyButton text={spin.holderAddress} />
                </span>
                <span className="shrink-0">
                  <ReelResult symbols={spin.reelSymbols} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
