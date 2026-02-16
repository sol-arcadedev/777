import { useState } from "react";
import { triggerTransfer, triggerBuyback, claimFees, clearAdminToken } from "../../lib/api";

export default function AdminActions() {
  const [transferStatus, setTransferStatus] = useState<string | null>(null);
  const [buybackStatus, setBuybackStatus] = useState<string | null>(null);
  const [feeClaimStatus, setFeeClaimStatus] = useState<string | null>(null);
  const [feeAmount, setFeeAmount] = useState("0.05");

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

      <div className="flex items-center gap-3">
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={feeAmount}
          onChange={(e) => setFeeAmount(e.target.value)}
          className="w-20 bg-casino-dark border-2 border-gold-dim px-2 py-2 text-[8px] text-cream focus:border-gold focus:outline-none"
        />
        <button
          onClick={async () => {
            setFeeClaimStatus("Processing...");
            try {
              const res = await claimFees(parseFloat(feeAmount) || 0.05);
              setFeeClaimStatus(`Done: ${res.treasuryAmount.toFixed(4)} Treasury, ${res.rewardAmount.toFixed(4)} Reward`);
            } catch (err) {
              if (err instanceof Error && err.message.startsWith("401")) {
                clearAdminToken();
                window.location.reload();
                return;
              }
              setFeeClaimStatus(err instanceof Error ? err.message : "Failed");
            }
          }}
          className="bg-casino-dark border-2 border-gold-dim px-3 py-2 text-[8px] text-cream hover:border-gold transition-colors cursor-pointer uppercase"
          style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
        >
          CLAIM FEES (70/30)
        </button>
        {feeClaimStatus && <span className="text-[7px] text-gold-dim">{feeClaimStatus}</span>}
      </div>
    </div>
  );
}
