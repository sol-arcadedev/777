interface SlotMachineProps {
  isSpinning: boolean;
  paused: boolean;
  minSolTransfer: number;
}

function Reel({ spinning }: { spinning: boolean }) {
  const symbols = ["7", "7", "7"];
  return (
    <div className="w-20 h-24 bg-casino-black border-2 border-gold-dim rounded-lg overflow-hidden flex items-center justify-center">
      {spinning ? (
        <div className="animate-spin-reel">
          {symbols.map((s, i) => (
            <div key={i} className="text-5xl font-bold text-gold h-24 flex items-center justify-center">
              {s}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-5xl font-bold text-gold">7</div>
      )}
    </div>
  );
}

export default function SlotMachine({ isSpinning, paused, minSolTransfer }: SlotMachineProps) {
  return (
    <div className={`flex flex-col items-center gap-4 p-6 bg-casino-card border border-casino-border rounded-xl ${isSpinning ? "animate-glow" : ""}`}>
      <div className="text-xs uppercase tracking-widest text-gold-dim">
        {paused ? "Paused" : isSpinning ? "Spinning..." : "Waiting for spins"}
      </div>

      <div className="flex gap-3">
        <Reel spinning={isSpinning} />
        <Reel spinning={isSpinning} />
        <Reel spinning={isSpinning} />
      </div>

      {paused && (
        <div className="text-sm text-gold-dim border border-gold-dim/30 px-4 py-2 rounded">
          Slot machine is paused — spins are still queued
        </div>
      )}

      <div className="text-xs text-gold-dim text-center max-w-xs">
        Send at least {minSolTransfer} SOL to the verification wallet to spin
      </div>
    </div>
  );
}
