import { formatAddress } from "../lib/utils";
import type { QueueEntry } from "@shared/types";

interface QueueDisplayProps {
  waiting: QueueEntry[];
}

export default function QueueDisplay({ waiting }: QueueDisplayProps) {
  return (
    <div className="bg-casino-card border border-casino-border rounded-xl p-4">
      <h2 className="text-sm uppercase tracking-wider text-gold-dim mb-3">
        Spin Queue ({waiting.length})
      </h2>

      {waiting.length === 0 ? (
        <div className="text-sm text-neutral-500 text-center py-4">
          No spins waiting
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {waiting.map((entry, i) => (
            <div
              key={`${entry.holderAddress}-${entry.queuePosition}`}
              className="flex items-center justify-between text-xs bg-casino-dark rounded px-3 py-2"
            >
              <span className="text-neutral-500">#{i + 1}</span>
              <span className="text-gold">{formatAddress(entry.holderAddress)}</span>
              <span>{entry.solTransferred} SOL</span>
              <span className="text-win-green">{entry.winChance}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
