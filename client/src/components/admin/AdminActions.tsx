import { useState } from "react";
import { triggerTransfer, triggerBuyback, clearAdminToken } from "../../lib/api";

export default function AdminActions() {
  const [transferStatus, setTransferStatus] = useState<string | null>(null);
  const [buybackStatus, setBuybackStatus] = useState<string | null>(null);

  const handleTransfer = async () => {
    setTransferStatus("Processing...");
    try {
      const res = await triggerTransfer();
      setTransferStatus(res.message);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("401")) {
        clearAdminToken();
        window.location.reload();
        return;
      }
      setTransferStatus(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleBuyback = async () => {
    setBuybackStatus("Processing...");
    try {
      const res = await triggerBuyback();
      setBuybackStatus(res.message);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("401")) {
        clearAdminToken();
        window.location.reload();
        return;
      }
      setBuybackStatus(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm uppercase tracking-wider text-gold-dim">Actions</h3>

      <div className="flex items-center gap-3">
        <button
          onClick={handleTransfer}
          className="bg-casino-dark border border-casino-border px-4 py-2 rounded text-sm hover:border-gold-dim transition-colors cursor-pointer"
        >
          Transfer Verification → Creator
        </button>
        {transferStatus && <span className="text-xs text-neutral-400">{transferStatus}</span>}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleBuyback}
          className="bg-casino-dark border border-casino-border px-4 py-2 rounded text-sm hover:border-gold-dim transition-colors cursor-pointer"
        >
          Trigger Buyback & Burn
        </button>
        {buybackStatus && <span className="text-xs text-neutral-400">{buybackStatus}</span>}
      </div>
    </div>
  );
}
