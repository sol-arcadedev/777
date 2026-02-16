import { useState } from "react";
import { resetEscalation } from "../../lib/api";
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
  const [winChanceStart, setWinChanceStart] = useState(String(config.winChanceStart));
  const [winChanceEnd, setWinChanceEnd] = useState(String(config.winChanceEnd));
  const [rewardPercentStart, setRewardPercentStart] = useState(String(config.rewardPercentStart));
  const [rewardPercentEnd, setRewardPercentEnd] = useState(String(config.rewardPercentEnd));
  const [escalationDurationMin, setEscalationDurationMin] = useState(String(config.escalationDurationMin));
  const [timerDurationSec, setTimerDurationSec] = useState(String(config.timerDurationSec));
  const [feeClaimIntervalSec, setFeeClaimIntervalSec] = useState(String(config.feeClaimIntervalSec));
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
        winChanceStart: parseFloat(winChanceStart),
        winChanceEnd: parseFloat(winChanceEnd),
        rewardPercentStart: parseFloat(rewardPercentStart),
        rewardPercentEnd: parseFloat(rewardPercentEnd),
        escalationDurationMin: parseInt(escalationDurationMin, 10),
        timerDurationSec: parseInt(timerDurationSec, 10),
        feeClaimIntervalSec: parseInt(feeClaimIntervalSec, 10),
        paused,
      });
      setStatus("Saved");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleResetEscalation = async () => {
    try {
      await resetEscalation();
      setStatus("Escalation reset");
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Reset failed");
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

      <div>
        <label className="block text-[7px] text-gold-dim mb-1 uppercase">MIN SOL PER SPIN</label>
        <input
          type="number"
          step="0.001"
          value={minSolTransfer}
          onChange={(e) => setMinSolTransfer(e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Escalation Config */}
      <div className="border-2 border-gold-dim/30 p-3 space-y-2">
        <div className="text-[8px] text-gold uppercase tracking-wider mb-1">ESCALATION CYCLE</div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[7px] text-gold-dim mb-1 uppercase">WIN CHANCE START %</label>
            <input
              type="number"
              step="0.5"
              value={winChanceStart}
              onChange={(e) => setWinChanceStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[7px] text-gold-dim mb-1 uppercase">WIN CHANCE END %</label>
            <input
              type="number"
              step="0.5"
              value={winChanceEnd}
              onChange={(e) => setWinChanceEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[7px] text-gold-dim mb-1 uppercase">REWARD % START</label>
            <input
              type="number"
              step="1"
              value={rewardPercentStart}
              onChange={(e) => setRewardPercentStart(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[7px] text-gold-dim mb-1 uppercase">REWARD % END</label>
            <input
              type="number"
              step="1"
              value={rewardPercentEnd}
              onChange={(e) => setRewardPercentEnd(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-[7px] text-gold-dim mb-1 uppercase">CYCLE DURATION (MIN)</label>
          <input
            type="number"
            value={escalationDurationMin}
            onChange={(e) => setEscalationDurationMin(e.target.value)}
            className={inputClass}
          />
        </div>

        <button
          type="button"
          onClick={handleResetEscalation}
          className="w-full px-3 py-1.5 text-[8px] border-2 border-gold-dim text-gold-dim hover:border-gold hover:text-gold cursor-pointer uppercase"
          style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.4)" }}
        >
          RESET ESCALATION CYCLE
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[7px] text-gold-dim mb-1 uppercase">TIMER (SEC)</label>
          <input
            type="number"
            value={timerDurationSec}
            onChange={(e) => setTimerDurationSec(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-[7px] text-gold-dim mb-1 uppercase">FEE CLAIM INTERVAL (SEC)</label>
          <input
            type="number"
            value={feeClaimIntervalSec}
            onChange={(e) => setFeeClaimIntervalSec(e.target.value)}
            className={inputClass}
          />
        </div>
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
          <span className={`text-[8px] ${status === "Saved" || status === "Escalation reset" ? "text-win-green" : "text-lose-red"}`}>
            {status}
          </span>
        )}
      </div>
    </form>
  );
}
