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
    <div className="space-y-3">
      <h3 className="text-[9px] uppercase tracking-wider text-gold">ACTIONS</h3>

      <div className="flex items-center gap-3">
        <button
          onClick={handleTransfer}
          className="bg-casino-dark border-2 border-gold-dim px-3 py-2 text-[8px] text-cream hover:border-gold transition-colors cursor-pointer uppercase"
          style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
        >
          TRANSFER VERIFY -&gt; CREATOR
        </button>
        {transferStatus && <span className="text-[7px] text-gold-dim">{transferStatus}</span>}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleBuyback}
          className="bg-casino-dark border-2 border-gold-dim px-3 py-2 text-[8px] text-cream hover:border-gold transition-colors cursor-pointer uppercase"
          style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
        >
          BUYBACK & BURN
        </button>
        {buybackStatus && <span className="text-[7px] text-gold-dim">{buybackStatus}</span>}
      </div>
    </div>
  );
}
