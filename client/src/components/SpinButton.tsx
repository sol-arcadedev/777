import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { submitSpin } from "../lib/api";

interface SpinButtonProps {
  minSolTransfer: number;
  paused: boolean;
}

export default function SpinButton({ minSolTransfer, paused }: SpinButtonProps) {
  const { publicKey, connected } = useWallet();
  const [solAmount, setSolAmount] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!connected || !publicKey) {
    return (
      <div className="text-sm text-gold-dim text-center py-2">
        Connect wallet to spin
      </div>
    );
  }

  const solValue = parseFloat(solAmount) || 0;
  const effectiveAmount = Math.max(solValue, minSolTransfer);

  async function handleSpin() {
    if (!publicKey || solValue < minSolTransfer) return;

    setSubmitting(true);
    setFeedback(null);
    setError(null);

    try {
      const res = await submitSpin({
        holderAddress: publicKey.toBase58(),
        solTransferred: solValue,
      });
      setFeedback(
        `Queued! Position #${res.queuePosition} — ${res.winChance}% win chance`
      );
      setSolAmount("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Spin failed");
    } finally {
      setSubmitting(false);
    }
  }

  // Calculate win chance preview
  const extraSteps = Math.floor((effectiveAmount - minSolTransfer) / 0.01);
  const previewChance = Math.min(3 + extraSteps, 5);

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-xs">
      <div className="flex gap-2 w-full">
        <input
          type="number"
          step={0.01}
          min={minSolTransfer}
          placeholder={`Min ${minSolTransfer} SOL`}
          value={solAmount}
          onChange={(e) => setSolAmount(e.target.value)}
          disabled={submitting}
          className="flex-1 bg-casino-black border border-casino-border rounded px-3 py-2 text-sm text-white placeholder-gold-dim/50 focus:border-gold-dim focus:outline-none"
        />
        <button
          onClick={handleSpin}
          disabled={submitting || solValue < minSolTransfer || paused}
          className="px-5 py-2 bg-gold text-casino-black font-bold rounded text-sm uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gold-bright transition-colors"
        >
          {submitting ? "..." : "SPIN"}
        </button>
      </div>

      {solValue >= minSolTransfer && (
        <div className="text-xs text-gold-dim">
          Win chance: {previewChance}%
        </div>
      )}

      {feedback && (
        <div className="text-xs text-win-green text-center">{feedback}</div>
      )}
      {error && (
        <div className="text-xs text-lose-red text-center">{error}</div>
      )}
    </div>
  );
}
