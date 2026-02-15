import { useState } from "react";
import type { ConfigurationDTO, UpdateConfigRequest } from "@shared/types";

interface ConfigFormProps {
  config: ConfigurationDTO;
  onSave: (data: UpdateConfigRequest) => Promise<unknown>;
}

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Token CA</label>
        <input
          type="text"
          value={tokenCA}
          onChange={(e) => setTokenCA(e.target.value)}
          className="w-full bg-casino-black border border-casino-border rounded px-3 py-2 text-sm focus:border-gold-dim focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1">Required Token Holdings</label>
        <input
          type="text"
          value={requiredHoldings}
          onChange={(e) => setRequiredHoldings(e.target.value)}
          className="w-full bg-casino-black border border-casino-border rounded px-3 py-2 text-sm focus:border-gold-dim focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Min SOL Transfer</label>
          <input
            type="number"
            step="0.001"
            value={minSolTransfer}
            onChange={(e) => setMinSolTransfer(e.target.value)}
            className="w-full bg-casino-black border border-casino-border rounded px-3 py-2 text-sm focus:border-gold-dim focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Reward % of Wallet</label>
          <input
            type="number"
            step="1"
            value={rewardPercent}
            onChange={(e) => setRewardPercent(e.target.value)}
            className="w-full bg-casino-black border border-casino-border rounded px-3 py-2 text-sm focus:border-gold-dim focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-neutral-500 mb-1">Timer Duration (seconds)</label>
        <input
          type="number"
          value={timerDurationSec}
          onChange={(e) => setTimerDurationSec(e.target.value)}
          className="w-full bg-casino-black border border-casino-border rounded px-3 py-2 text-sm focus:border-gold-dim focus:outline-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-xs text-neutral-500">Paused</label>
        <button
          type="button"
          onClick={() => setPaused(!paused)}
          className={`px-3 py-1 text-sm rounded border cursor-pointer ${
            paused
              ? "border-lose-red text-lose-red"
              : "border-win-green text-win-green"
          }`}
        >
          {paused ? "PAUSED" : "ACTIVE"}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-gold text-black font-semibold px-6 py-2 rounded text-sm hover:bg-gold-bright transition-colors disabled:opacity-50 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Config"}
        </button>
        {status && (
          <span className={`text-xs ${status === "Saved" ? "text-win-green" : "text-lose-red"}`}>
            {status}
          </span>
        )}
      </div>
    </form>
  );
}
