import { useState } from "react";
import type { ConfigurationDTO, UpdateConfigRequest } from "@shared/types";

interface ConfigFormProps {
  config: ConfigurationDTO;
  onSave: (data: UpdateConfigRequest) => Promise<unknown>;
}

const inputClass = "w-full bg-casino-dark border-2 border-gold-dim px-3 py-2 text-[9px] text-cream focus:border-gold focus:outline-none";

export default function ConfigForm({ config, onSave }: ConfigFormProps) {
  const [tokenCA, setTokenCA] = useState(config.tokenCA);
  const [requiredHoldings, setRequiredHoldings] = useState(config.requiredHoldings);
  const [minSolTransfer, setMinSolTransfer] = useState(String(config.minSolTransfer));
  const [rewardPercent, setRewardPercent] = useState(String(config.rewardPercent));
  const [timerDurationSec, setTimerDurationSec] = useState(String(config.timerDurationSec));
  const [paused, setPaused] = useState(config.paused);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      await onSave({
        tokenCA,
        requiredHoldings,
        minSolTransfer: parseFloat(minSolTransfer),
        rewardPercent: parseFloat(rewardPercent),
        timerDurationSec: parseInt(timerDurationSec, 10),
        paused,
      });
      setStatus("Saved");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-[7px] text-gold-dim mb-1 uppercase">TOKEN CA</label>
        <input
          type="text"
          value={tokenCA}
          onChange={(e) => setTokenCA(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-[7px] text-gold-dim mb-1 uppercase">REQUIRED HOLDINGS</label>
        <input
          type="text"
          value={requiredHoldings}
          onChange={(e) => setRequiredHoldings(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[7px] text-gold-dim mb-1 uppercase">MIN SOL</label>
          <input
            type="number"
            step="0.001"
            value={minSolTransfer}
            onChange={(e) => setMinSolTransfer(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[7px] text-gold-dim mb-1 uppercase">REWARD %</label>
          <input
            type="number"
            step="1"
            value={rewardPercent}
            onChange={(e) => setRewardPercent(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-[7px] text-gold-dim mb-1 uppercase">TIMER (SEC)</label>
        <input
          type="number"
          value={timerDurationSec}
          onChange={(e) => setTimerDurationSec(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-[7px] text-gold-dim uppercase">STATUS</label>
        <button
          type="button"
          onClick={() => setPaused(!paused)}
          className={`px-3 py-1 text-[8px] border-2 cursor-pointer uppercase ${
            paused
              ? "border-lose-red text-lose-red"
              : "border-win-green text-win-green"
          }`}
          style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
        >
          {paused ? "PAUSED" : "ACTIVE"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-gold text-casino-dark font-bold px-5 py-2 text-[8px] hover:bg-gold-bright transition-colors disabled:opacity-50 cursor-pointer uppercase"
          style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
        >
          {saving ? "SAVING..." : "SAVE CONFIG"}
        </button>
        {status && (
          <span className={`text-[8px] ${status === "Saved" ? "text-win-green" : "text-lose-red"}`}>
            {status}
          </span>
        )}
      </div>
    </form>
  );
}
