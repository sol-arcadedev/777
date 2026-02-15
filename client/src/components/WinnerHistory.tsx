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
      className="text-gold-dim hover:text-gold transition-colors cursor-pointer text-[7px]"
      title="Copy address"
    >
      {copied ? "OK" : "CP"}
    </button>
  );
}

export default function WinnerHistory({ winners }: WinnerHistoryProps) {
  return (
    <div
      className="p-3"
      style={{
        background: "linear-gradient(180deg, #0a0a0a 0%, #111 100%)",
        border: "3px solid #daa520",
        boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
      }}
    >
      <h2 className="text-[9px] uppercase tracking-wider text-gold mb-2">
        RECENT REWARDS
      </h2>

      {winners.length === 0 ? (
        <div className="text-[8px] text-gold-dim/50 text-center py-3">
          NO REWARDS YET
        </div>
      ) : (
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {winners.map((w) => (
            <div
              key={w.rewardTxSignature}
              className="px-2 py-1.5 text-[7px] space-y-0.5"
              style={{
                background: "#0d5e2e",
                border: "1px solid #2a6e3f",
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span className="text-gold">{formatAddress(w.holderAddress)}</span>
                  <CopyButton text={w.holderAddress} />
                </div>
                <span className="text-win-green font-bold">+{w.solWon} SOL</span>
              </div>
              <div className="flex items-center justify-between text-gold-dim/60">
                <span>SENT {w.solTransferred} SOL | {w.winChance}%</span>
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
