import { useState, useEffect, useCallback, useRef } from "react";
import { getQueue } from "../lib/api";
import { POLL_QUEUE_MS } from "../lib/constants";
import type { QueueEntry } from "@shared/types";

export function useQueue() {
  const [activeSpin, setActiveSpin] = useState<QueueEntry | null>(null);
  const [waiting, setWaiting] = useState<QueueEntry[]>([]);
  const [newEntries, setNewEntries] = useState<QueueEntry[]>([]);
  const prevAddressesRef = useRef<Set<string> | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const entries = await getQueue();

      // Detect new entries by comparing holder+position keys
      const currentKeys = new Set(
        entries.map((e) => `${e.holderAddress}:${e.queuePosition}`)
      );

      if (prevAddressesRef.current !== null) {
        const added = entries.filter(
          (e) => !prevAddressesRef.current!.has(`${e.holderAddress}:${e.queuePosition}`)
        );
        if (added.length > 0) {
          setNewEntries(added);
        }
      }

      prevAddressesRef.current = currentKeys;

      if (entries.length > 0) {
        setActiveSpin(entries[0]);
        setWaiting(entries.slice(1));
      } else {
        setActiveSpin(null);
        setWaiting([]);
      }
    } catch {
      // silently retry on next poll
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const id = setInterval(fetchQueue, POLL_QUEUE_MS);
    return () => clearInterval(id);
  }, [fetchQueue]);

  return { activeSpin, waiting, newEntries, clearNewEntries: () => setNewEntries([]) };
}
