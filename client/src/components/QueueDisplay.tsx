import { formatAddress } from "../lib/utils";
import type { QueueEntry } from "@shared/types";

interface QueueDisplayProps {
  waiting: QueueEntry[];
}

export default function QueueDisplay({ waiting }: QueueDisplayProps) {
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
        SPIN QUEUE ({waiting.length})
      </h2>

      {waiting.length === 0 ? (
        <div className="text-[8px] text-gold-dim/50 text-center py-3">
          NO SPINS WAITING
        </div>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {waiting.map((entry, i) => (
            <div
              key={`${entry.holderAddress}-${entry.queuePosition}`}
              className="flex items-center justify-between text-[7px] px-2 py-1.5"
              style={{
                background: "#0d5e2e",
                border: "1px solid #2a6e3f",
              }}
            >
              <span className="text-gold font-bold">#{i + 1}</span>
              <span className="text-cream">{formatAddress(entry.holderAddress)}</span>
              <span className="text-cream">{entry.solTransferred}</span>
              <span className="text-win-green">{entry.winChance}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
