import { useState, useEffect, useCallback } from "react";
import { getWinners } from "../lib/api";
import { POLL_WINNERS_MS, MAX_WINNERS_DISPLAY } from "../lib/constants";
import type { WinnerHistoryEntry } from "@shared/types";

export function useWinners() {
  const [winners, setWinners] = useState<WinnerHistoryEntry[]>([]);

  const fetchWinners = useCallback(async () => {
    try {
      const data = await getWinners(MAX_WINNERS_DISPLAY);
      setWinners(data);
    } catch {
      // silently retry on next poll
    }
  }, []);

  useEffect(() => {
    fetchWinners();
    const id = setInterval(fetchWinners, POLL_WINNERS_MS);
    return () => clearInterval(id);
  }, [fetchWinners]);

  return { winners };
}
