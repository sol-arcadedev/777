import { formatAddress } from "../lib/utils";
import type { QueueEntry } from "@shared/types";

interface SlotDisplayProps {
  activeSpin: QueueEntry | null;
}

export default function SlotDisplay({ activeSpin }: SlotDisplayProps) {
  if (!activeSpin) {
    return (
      <div className="text-center text-sm text-neutral-500 py-2">
        No active spin
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center gap-6 text-sm bg-casino-card border border-casino-border rounded-lg px-4 py-3">
      <div>
        <span className="text-neutral-500">Spinner: </span>
        <span className="text-gold">{formatAddress(activeSpin.holderAddress)}</span>
      </div>
      <div>
        <span className="text-neutral-500">SOL: </span>
        <span>{activeSpin.solTransferred}</span>
      </div>
      <div>
        <span className="text-neutral-500">Win: </span>
        <span className="text-win-green">{activeSpin.winChance}%</span>
      </div>
    </div>
  );
}
