import { formatAddress } from "../lib/utils";
import type { QueueEntry } from "@shared/types";

interface SlotDisplayProps {
  activeSpin: QueueEntry | null;
}

export default function SlotDisplay({ activeSpin }: SlotDisplayProps) {
  if (!activeSpin) {
    return (
      <div className="text-center text-[8px] text-gold-dim/50 py-2">
        NO ACTIVE SPIN
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center gap-6 text-[8px] px-4 py-2"
      style={{
        background: "#0d5e2e",
        border: "2px solid #2a6e3f",
        boxShadow: "2px 2px 0 rgba(0,0,0,0.4)",
      }}
    >
      <div>
        <span className="text-gold-dim">SPINNER: </span>
        <span className="text-gold">{formatAddress(activeSpin.holderAddress)}</span>
      </div>
      <div>
        <span className="text-gold-dim">SOL: </span>
        <span className="text-cream">{activeSpin.solTransferred}</span>
      </div>
      <div>
        <span className="text-gold-dim">WIN: </span>
        <span className="text-win-green">{activeSpin.winChance}%</span>
      </div>
    </div>
  );
}
