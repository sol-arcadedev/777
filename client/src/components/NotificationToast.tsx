import { useEffect, useState } from "react";
import type { QueueEntry } from "@shared/types";

interface Toast {
  id: number;
  entry: QueueEntry;
}

let nextId = 0;

interface NotificationToastProps {
  newEntries: QueueEntry[];
  onConsumed: () => void;
}

export default function NotificationToast({ newEntries, onConsumed }: NotificationToastProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (newEntries.length === 0) return;

    const incoming = newEntries.map((entry) => ({
      id: nextId++,
      entry,
    }));

    setToasts((prev) => [...prev, ...incoming]);
    onConsumed();
  }, [newEntries, onConsumed]);

  useEffect(() => {
    if (toasts.length === 0) return;

    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);

    return () => clearTimeout(timer);
  }, [toasts]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
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
            {toast.entry.holderAddress.slice(0, 4)}...{toast.entry.holderAddress.slice(-4)}
          </div>
          <div className="text-[7px] text-gold-dim mt-1">
            {toast.entry.solTransferred} SOL | {toast.entry.winChance}%
          </div>
        </div>
      ))}
    </div>
  );
}
