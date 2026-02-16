import { formatAddress } from "../lib/utils";
import type { QueueEntry } from "@shared/types";

interface SlotDisplayProps {
  activeSpin: QueueEntry | null;
}

export default function SlotDisplay({ activeSpin }: SlotDisplayProps) {
  if (!activeSpin) {
    return (
      <div
        className="w-full max-w-[420px] text-center py-3 px-4 scanlines"
        style={{
          background: "linear-gradient(180deg, #2a0000 0%, #1a0000 100%)",
          border: "2px solid #8b7340",
          boxShadow: "2px 2px 0 rgba(0,0,0,0.4), inset 0 0 8px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <div
            className="animate-pulse-dot"
            style={{
              width: "4px",
              height: "4px",
              backgroundColor: "#8b7340",
              borderRadius: "50%",
              opacity: 0.4,
            }}
          />
          <span
            className="text-[9px] text-gold-dim/40 tracking-widest"
            style={{ fontFamily: "'Press Start 2P', cursive" }}
          >
            NO ACTIVE SPIN
          </span>
          <div
            className="animate-pulse-dot"
            style={{
              width: "4px",
              height: "4px",
              backgroundColor: "#8b7340",
              borderRadius: "50%",
              opacity: 0.4,
              animationDelay: "0.5s",
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      key={`${activeSpin.holderAddress}-${activeSpin.solTransferred}`}
      className="w-full max-w-[420px] flex items-center justify-center gap-6 text-[9px] px-4 py-2 animate-slide-up"
      style={{
        background: "#0d5e2e",
        border: "2px solid #00ff41",
        boxShadow: "2px 2px 0 rgba(0,0,0,0.4), 0 0 8px rgba(0,255,65,0.2)",
        animation: "slide-up-enter 0.4s steps(8) forwards, neon-spin-pulse 1.5s steps(4) infinite 0.4s",
      }}
    >
      {/* Pulsing dot */}
      <div className="flex items-center gap-1.5">
        <div
          className="animate-pulse-dot"
          style={{
            width: "6px",
            height: "6px",
            backgroundColor: "#00ff41",
            borderRadius: "50%",
            boxShadow: "0 0 4px #00ff41",
          }}
        />
        <span className="text-win-green font-bold text-[9px]">NOW SPINNING</span>
      </div>
      <div>
        <span className="text-gold text-[9px]">{formatAddress(activeSpin.holderAddress)}</span>
      </div>
      <div>
        <span className="text-cream">{activeSpin.solTransferred} SOL</span>
      </div>
    </div>
  );
}
