import { useState, useEffect, useCallback } from "react";
import { getQueue } from "../lib/api";
import { POLL_QUEUE_MS } from "../lib/constants";
import type { QueueEntry } from "@shared/types";

export function useQueue() {
  const [activeSpin, setActiveSpin] = useState<QueueEntry | null>(null);
  const [waiting, setWaiting] = useState<QueueEntry[]>([]);

  const fetchQueue = useCallback(async () => {
    try {
      const entries = await getQueue();
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

  return { activeSpin, waiting };
}
