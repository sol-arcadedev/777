import { formatAddress } from "../lib/utils";
import type { QueueEntry } from "@shared/types";

interface QueueDisplayProps {
  waiting: QueueEntry[];
}

export default function QueueDisplay({ waiting }: QueueDisplayProps) {
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
      <h2 className="text-[9px] uppercase tracking-wider text-gold mb-2">
        SPIN QUEUE ({waiting.length})
      </h2>

      {waiting.length === 0 ? (
        <div className="text-[8px] text-gold-dim/50 text-center py-3">
          NO SPINS WAITING
        </div>
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {waiting.map((entry, i) => (
            <div
              key={`${entry.holderAddress}-${entry.queuePosition}`}
              className="flex items-center justify-between text-[7px] px-2 py-1.5 animate-slide-in-left"
              style={{
                background: i === 0 ? "#0d7e3e" : i % 2 === 0 ? "#0d5e2e" : "#0b5028",
                border: i === 0 ? "1px solid #00ff41" : "1px solid #2a6e3f",
                boxShadow: i === 0 ? "0 0 4px rgba(0,255,65,0.2)" : "none",
              }}
            >
              <span className="text-gold font-bold">
                {i === 0 ? "NEXT" : `#${i + 1}`}
              </span>
              <span className="text-cream">{formatAddress(entry.holderAddress)}</span>
              <span className="text-cream">{entry.solTransferred} SOL</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
