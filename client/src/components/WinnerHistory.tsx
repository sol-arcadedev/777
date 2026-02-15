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
      className="text-neutral-500 hover:text-gold transition-colors cursor-pointer"
      title="Copy address"
    >
      {copied ? "ok" : "cp"}
    </button>
  );
}

export default function WinnerHistory({ winners }: WinnerHistoryProps) {
  return (
    <div className="bg-casino-card border border-casino-border rounded-xl p-4">
      <h2 className="text-sm uppercase tracking-wider text-gold-dim mb-3">
        Winners
      </h2>

      {winners.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-4">
          No winners yet
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {winners.map((w) => (
            <div
              key={w.rewardTxSignature}
              className="bg-casino-dark rounded px-3 py-2 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gold">{formatAddress(w.holderAddress)}</span>
                  <CopyButton text={w.holderAddress} />
                </div>
                <span className="text-win-green font-semibold">+{w.solWon} SOL</span>
              </div>
              <div className="flex items-center justify-between text-neutral-500">
                <span>Sent {w.solTransferred} SOL &middot; {w.winChance}% chance</span>
                <a
                  href={`${SOLSCAN_TX_URL}${w.rewardTxSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-dim hover:text-gold transition-colors underline"
                >
                  tx
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
