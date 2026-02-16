import { useState } from "react";
import { formatAddress, copyToClipboard } from "../lib/utils";
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
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-[6px] text-gold-dim/60 hover:text-gold cursor-pointer ml-1 shrink-0"
      title="Copy address"
    >
      {copied ? "OK" : "COPY"}
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

  return (
    <div
      className="p-3 w-full max-w-[420px]"
      style={{
        background: "linear-gradient(180deg, rgba(10,10,10,0.92) 0%, rgba(17,17,17,0.92) 100%)",
        border: "3px solid #daa520",
        boxShadow: "3px 3px 0 rgba(0,0,0,0.5), 0 0 10px rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[9px] uppercase tracking-wider text-gold">
          SPIN QUEUE ({waiting.length})
        </h2>
        {waiting.length > 3 && (
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="SEARCH ADDRESS..."
            className="bg-casino-dark border border-gold-dim/40 px-2 py-0.5 text-[7px] text-cream placeholder:text-gold-dim/30 focus:border-gold focus:outline-none w-32"
          />
        )}
      </div>

      {waiting.length === 0 ? (
        <div className="text-[8px] text-gold-dim/50 text-center py-3">
          NO SPINS WAITING
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-[8px] text-gold-dim/50 text-center py-3">
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
                className="flex items-center text-[7px] px-2 py-1.5 animate-slide-in-left"
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
                <a
                  href={`https://solscan.io/account/${entry.holderAddress}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cream hover:text-gold transition-colors ml-1"
                  title="View on Solscan"
                >
                  {formatAddress(entry.holderAddress)}
                </a>
                <CopyButton text={entry.holderAddress} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
