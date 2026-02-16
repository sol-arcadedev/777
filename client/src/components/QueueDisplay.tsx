import { useState } from "react";
import { formatAddress, copyToClipboard } from "../lib/utils";
import { SOLSCAN_TX_URL } from "../lib/constants";
import type { QueueEntry } from "@shared/types";

interface QueueDisplayProps {
  waiting: QueueEntry[];
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
      className="text-gold-dim/60 hover:text-gold transition-colors cursor-pointer ml-1 shrink-0"
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

export default function QueueDisplay({ waiting }: QueueDisplayProps) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? waiting.filter((e) =>
        e.holderAddress.toLowerCase().includes(search.trim().toLowerCase()),
      )
    : waiting;

  if (waiting.length === 0) {
    return (
      <div
        className="w-full py-2 px-3 text-center"
        style={{
          background: "rgba(10,10,10,0.92)",
          border: "2px solid #daa520",
          boxShadow: "2px 2px 0 rgba(0,0,0,0.4), 0 0 6px rgba(218,165,32,0.1)",
        }}
      >
        <span className="text-[9px] uppercase tracking-wider text-gold-dim/60">
          SPIN QUEUE — EMPTY
        </span>
      </div>
    );
  }

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
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[10px] uppercase tracking-wider text-gold">
          SPIN QUEUE ({waiting.length})
        </h2>
        {waiting.length > 3 && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH ADDRESS..."
            className="bg-casino-dark border-2 border-gold-dim/40 px-3 py-1.5 text-[9px] text-cream placeholder:text-gold-dim/30 focus:border-gold focus:outline-none w-44"
          />
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-[9px] text-gold-dim/50 text-center py-3">
          NO MATCHING ADDRESS
        </div>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {filtered.map((entry, i) => {
            const position = waiting.indexOf(entry) + 1;
            const isNext = position === 1;
            const isSearchHit = search.trim().length > 0;

            return (
              <div
                key={`${entry.holderAddress}-${entry.queuePosition}`}
                className="flex items-center text-[8px] px-2 py-1.5 animate-slide-in-left"
                style={{
                  background: isSearchHit
                    ? "#3d2a00"
                    : isNext
                      ? "#0d7e3e"
                      : i % 2 === 0
                        ? "#0d5e2e"
                        : "#0b5028",
                  border: isSearchHit
                    ? "1px solid #daa520"
                    : isNext
                      ? "1px solid #00ff41"
                      : "1px solid #2a6e3f",
                  boxShadow: isNext ? "0 0 4px rgba(0,255,65,0.2)" : "none",
                }}
              >
                <span className="text-gold font-bold w-8 shrink-0">
                  {isNext && !isSearchHit ? "NEXT" : `#${position}`}
                </span>
                <span className="text-cream ml-1">
                  {formatAddress(entry.holderAddress)}
                </span>
                <CopyButton text={entry.holderAddress} />
                {entry.incomingTxSignature && (
                  <a
                    href={`${SOLSCAN_TX_URL}${entry.incomingTxSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold-dim/60 hover:text-gold transition-colors ml-auto shrink-0"
                    title="View transfer on Solscan"
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
