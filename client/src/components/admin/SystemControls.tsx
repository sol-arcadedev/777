import { useState } from "react";
import type { ConfigurationDTO } from "@shared/types";
import { toggleFeeClaim, toggleBuyback, toggleQueue, toggleSlot, clearAdminToken } from "../../lib/api";

interface SystemControlsProps {
  config: ConfigurationDTO;
}

function ToggleButton({
  label,
  enabled,
  loading,
  onClick,
}: {
  label: string;
  enabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[8px] text-cream uppercase tracking-wider">{label}</span>
      <button
        onClick={onClick}
        disabled={loading}
        className={`px-4 py-1 text-[8px] font-bold border-2 cursor-pointer uppercase transition-colors disabled:opacity-50 ${
          enabled
            ? "border-win-green text-win-green"
            : "border-lose-red text-lose-red"
        }`}
        style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.4)", minWidth: "60px" }}
      >
        {loading ? "..." : enabled ? "ON" : "OFF"}
      </button>
    </div>
  );
}

export default function SystemControls({ config }: SystemControlsProps) {
  const [feeClaim, setFeeClaim] = useState(config.feeClaimEnabled);
  const [buyback, setBuyback] = useState(config.buybackEnabled);
  const [queue, setQueue] = useState(config.queueEnabled);
  const [slot, setSlot] = useState(config.slotActive);
  const [loading, setLoading] = useState<string | null>(null);

  const handleToggle = async (
    key: string,
    toggleFn: () => Promise<unknown>,
    setter: (v: boolean) => void,
    current: boolean,
  ) => {
    setLoading(key);
    try {
      await toggleFn();
      setter(!current);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("401")) {
        clearAdminToken();
        window.location.reload();
        return;
      }
      console.error(`Toggle ${key} failed:`, err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-1">
      <h3 className="text-[9px] uppercase tracking-wider text-gold mb-2">SYSTEM CONTROLS</h3>

      <ToggleButton
        label="FEE CLAIMING"
        enabled={feeClaim}
        loading={loading === "feeClaim"}
        onClick={() => handleToggle("feeClaim", toggleFeeClaim, setFeeClaim, feeClaim)}
      />
      <div className="text-[7px] text-gold-dim/50 -mt-1 mb-1 pl-1">
        Interval: {config.feeClaimIntervalSec}s
      </div>

      <ToggleButton
        label="QUEUE (WALLET MONITOR)"
        enabled={queue}
        loading={loading === "queue"}
        onClick={() => handleToggle("queue", toggleQueue, setQueue, queue)}
      />

      <ToggleButton
        label="SLOT MACHINE"
        enabled={slot}
        loading={loading === "slot"}
        onClick={() => handleToggle("slot", toggleSlot, setSlot, slot)}
      />

      <ToggleButton
        label="BUYBACK & BURN"
        enabled={buyback}
        loading={loading === "buyback"}
        onClick={() => handleToggle("buyback", toggleBuyback, setBuyback, buyback)}
      />
    </div>
  );
}
