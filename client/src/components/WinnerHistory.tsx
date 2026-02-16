import { useState } from "react";
import { formatAddress, copyToClipboard } from "../lib/utils";
import { SOLSCAN_TX_URL } from "../lib/constants";
import type { WinnerHistoryEntry } from "@shared/types";

interface WinnerHistoryProps {
  winners: WinnerHistoryEntry[];
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
      className="text-gold-dim hover:text-gold transition-colors cursor-pointer"
      title="Copy address"
    >
      {copied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

export default function WinnerHistory({ winners }: WinnerHistoryProps) {
  return (
    <div
      className="p-4 flex flex-col max-h-[420px]"
      style={{
        background: "linear-gradient(180deg, rgba(10,10,10,0.92) 0%, rgba(17,17,17,0.92) 100%)",
        border: "3px solid #daa520",
        boxShadow: "3px 3px 0 rgba(0,0,0,0.5), 0 0 10px rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
    >
      <h2 className="text-[11px] uppercase tracking-wider text-gold mb-3">
        RECENT REWARDS
      </h2>

      {winners.length === 0 ? (
        <div className="text-[9px] text-gold-dim/50 text-center py-4">
          NO REWARDS YET
        </div>
      ) : (
        <div className="space-y-1.5 flex-1 overflow-y-auto overflow-x-hidden">
          {winners.map((w, i) => (
            <div
              key={w.rewardTxSignature}
              className={`px-3 py-2 text-[8px] ${i === 0 ? "animate-gold-flash" : ""}`}
              style={{
                background: i === 0 ? "rgba(20,20,8,0.95)" : "rgba(12,12,12,0.9)",
                border: i === 0 ? "1px solid #daa520" : "1px solid rgba(218,165,32,0.25)",
              }}
            >
              {/* Row 1: Address + copy */}
              <div className="flex items-center gap-1 mb-1">
                {i === 0 && <span className="text-gold">*</span>}
                <span className="text-cream">{formatAddress(w.holderAddress)}</span>
                <CopyButton text={w.holderAddress} />
              </div>
              {/* Row 2: Reward amount — prominent */}
              <div
                className="font-bold mb-1"
                style={{
                  color: i === 0 ? "#ffd700" : "#f5e6c8",
                  fontSize: i === 0 ? "11px" : "9px",
                  textShadow: i === 0 ? "0 0 8px rgba(255,215,0,0.5)" : "none",
                }}
              >
                +{Number(w.solWon).toFixed(4)} SOL
              </div>
              {/* Row 3: Details */}
              <div className="flex items-center justify-between text-[7px]" style={{ color: "rgba(218,165,32,0.5)" }}>
                <span>SENT {Number(w.solTransferred).toFixed(4)} | {w.winChance}%</span>
                <a
                  href={`${SOLSCAN_TX_URL}${w.rewardTxSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-dim hover:text-gold transition-colors underline"
                >
                  TX
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
