import { useEffect, useState } from "react";
import type { QueueEntry } from "@shared/types";

interface NotificationToastProps {
  newEntries: QueueEntry[];
  onConsumed: () => void;
}

export default function NotificationToast({ newEntries, onConsumed }: NotificationToastProps) {
  const [current, setCurrent] = useState<QueueEntry | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (newEntries.length === 0) return;

    // Always show the most recent entry
    setCurrent(newEntries[newEntries.length - 1]);
    setVisible(true);
    onConsumed();
  }, [newEntries, onConsumed]);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => {
      setVisible(false);
    }, 4000);

    return () => clearTimeout(timer);
  }, [visible, current]);

  if (!visible || !current) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div
        className="animate-slide-in-left px-3 py-2 max-w-xs"
        style={{
          background: "#0a0a0a",
          border: "2px solid #daa520",
          boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
        }}
      >
        <div className="text-[8px] uppercase tracking-widest text-gold mb-1">
          NEW SPIN QUEUED
        </div>
        <div className="text-[9px] text-cream truncate">
          {current.holderAddress.slice(0, 4)}...{current.holderAddress.slice(-4)}
        </div>
        <div className="text-[7px] text-gold-dim mt-1">
          {current.solTransferred} SOL | {current.winChance}%
        </div>
      </div>
    </div>
  );
}
