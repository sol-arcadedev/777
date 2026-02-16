import { useState, useEffect, useCallback, useRef } from "react";
import { useConfig } from "./hooks/useConfig";
import { useQueue } from "./hooks/useQueue";
import { useWinners } from "./hooks/useWinners";
import { useWebSocket } from "./hooks/useWebSocket";
import { getRewardBalance, getSpinHistory } from "./lib/api";
import Layout from "./components/Layout";
import AdminPanel from "./components/admin/AdminPanel";
import NotificationToast from "./components/NotificationToast";
import type { SpinResultEvent, WsServerMessage, BurnStatsDTO, SpinHistoryEntry, WinnerHistoryEntry, QueueEntry } from "@shared/types";

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return hash;
}

function App() {
  const hash = useHashRoute();
  const { config, updateConfig, applyConfig } = useConfig();
  const { activeSpin, waiting, newEntries, clearNewEntries, applyQueue } = useQueue();
  const { winners, applyWinners } = useWinners();
  const [rewardBalance, setRewardBalance] = useState<number | null>(null);
  const [spinResult, setSpinResult] = useState<SpinResultEvent | null>(null);
  const [burnUpdate, setBurnUpdate] = useState<BurnStatsDTO | null>(null);
  const [spinHistory, setSpinHistory] = useState<SpinHistoryEntry[]>([]);

  // Queue updates that should only appear after the spin animation finishes
  const pendingSpinsRef = useRef<SpinHistoryEntry[] | null>(null);
  const pendingWinnersRef = useRef<WinnerHistoryEntry[] | null>(null);
  const pendingQueueRef = useRef<QueueEntry[] | null>(null);
  // Tracks whether a spin animation is active — updated immediately in the handler, not on render
  const animatingRef = useRef(false);

  // Fetch initial reward balance + spin history
  useEffect(() => {
    getRewardBalance()
      .then((data) => setRewardBalance(data.balanceSol))
      .catch(() => {});
    getSpinHistory()
      .then(setSpinHistory)
      .catch(() => {});
  }, []);

  const onWsMessage = useCallback(
    (msg: WsServerMessage) => {
      switch (msg.type) {
        case "spin:result":
          // Set animating flag IMMEDIATELY so subsequent messages in the same tick are deferred
          animatingRef.current = true;
          setSpinResult(msg.data);
          break;
        case "queue:update":
          if (animatingRef.current) {
            pendingQueueRef.current = msg.data;
          } else {
            applyQueue(msg.data);
          }
          break;
        case "winners:update":
          if (animatingRef.current) {
            pendingWinnersRef.current = msg.data;
          } else {
            applyWinners(msg.data);
          }
          break;
        case "config:update":
          applyConfig(msg.data);
          break;
        case "reward:balance":
          setRewardBalance(msg.data.balanceSol);
          break;
        case "burn:update":
          setBurnUpdate(msg.data);
          break;
        case "spins:update":
          if (animatingRef.current) {
            pendingSpinsRef.current = msg.data;
          } else {
            setSpinHistory(msg.data);
          }
          break;
      }
    },
    [applyQueue, applyWinners, applyConfig],
  );

  useWebSocket(onWsMessage);

  // Called when the spin animation fully completes (reels stopped + result displayed)
  const handleSpinResultDone = useCallback(() => {
    animatingRef.current = false;
    setSpinResult(null);

    // Flush any deferred updates
    if (pendingQueueRef.current) {
      applyQueue(pendingQueueRef.current);
      pendingQueueRef.current = null;
    }
    if (pendingSpinsRef.current) {
      setSpinHistory(pendingSpinsRef.current);
      pendingSpinsRef.current = null;
    }
    if (pendingWinnersRef.current) {
      applyWinners(pendingWinnersRef.current);
      pendingWinnersRef.current = null;
    }
  }, [applyQueue, applyWinners]);

  if (!config) {
    return (
      <div className="min-h-screen bg-casino-black flex items-center justify-center">
        <div className="text-gold text-xl">Loading 777...</div>
      </div>
    );
  }

  if (hash === "#admin") {
    return <AdminPanel config={config} onSave={updateConfig} />;
  }

  return (
    <>
      <Layout
        config={config}
        activeSpin={activeSpin}
        waiting={waiting}
        winners={winners}
        rewardBalance={rewardBalance}
        spinResult={spinResult}
        onSpinResultDone={handleSpinResultDone}
        burnUpdate={burnUpdate}
        spinHistory={spinHistory}
      />
      <NotificationToast newEntries={newEntries} onConsumed={clearNewEntries} />
    </>
  );
}

export default App;
