import { formatAddress } from "../lib/utils";
import type { SpinHistoryEntry, ReelSymbol } from "@shared/types";

interface SpinHistoryProps {
  spins: SpinHistoryEntry[];
}

function ReelSymbolIcon({ symbol }: { symbol: ReelSymbol }) {
  if (symbol === "7") {
    return <span className="text-gold font-bold">7</span>;
  }
  if (symbol === "SOL") {
    return <span style={{ color: "#14F195" }} className="font-bold">S</span>;
  }
  return <span className="text-lose-red font-bold">X</span>;
}

function ReelResult({ symbols }: { symbols: [ReelSymbol, ReelSymbol, ReelSymbol] }) {
  return (
    <span className="inline-flex gap-0.5 text-[9px]">
      <ReelSymbolIcon symbol={symbols[0]} />
      <ReelSymbolIcon symbol={symbols[1]} />
      <ReelSymbolIcon symbol={symbols[2]} />
    </span>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function SpinHistory({ spins }: SpinHistoryProps) {
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
        SPIN HISTORY ({spins.length})
      </h2>

      {spins.length === 0 ? (
        <div className="text-[8px] text-gold-dim/50 text-center py-3">
          NO SPINS YET
        </div>
      ) : (
        <div className="space-y-0.5 max-h-32 overflow-y-auto">
          {spins.map((spin, i) => {
            const isWin = spin.result === "WIN";
            const isRefund = spin.result === "REFUND";

            return (
              <div
                key={`${spin.holderAddress}-${spin.createdAt}-${i}`}
                className="flex items-center text-[7px] px-2 py-1"
                style={{
                  background: isWin
                    ? "rgba(218,165,32,0.15)"
                    : isRefund
                      ? "rgba(20,241,149,0.08)"
                      : i % 2 === 0
                        ? "rgba(255,255,255,0.03)"
                        : "transparent",
                  border: isWin
                    ? "1px solid rgba(218,165,32,0.4)"
                    : "1px solid transparent",
                }}
              >
                <span className="text-gold-dim/50 w-14 shrink-0">
                  {formatTime(spin.createdAt)}
                </span>
                <span className="text-cream w-20 shrink-0">
                  {formatAddress(spin.holderAddress)}
                </span>
                <span className="ml-auto">
                  <ReelResult symbols={spin.reelSymbols} />
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
