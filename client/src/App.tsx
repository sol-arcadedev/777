import { useState, useEffect, useCallback } from "react";
import { useConfig } from "./hooks/useConfig";
import { useQueue } from "./hooks/useQueue";
import { useWinners } from "./hooks/useWinners";
import { useWebSocket } from "./hooks/useWebSocket";
import { getRewardBalance, getDynamicValues as fetchDynamicValues } from "./lib/api";
import { getDynamicValuesLocal } from "./lib/dynamicValues";
import Layout from "./components/Layout";
import AdminPanel from "./components/admin/AdminPanel";
import NotificationToast from "./components/NotificationToast";
import type { SpinResultEvent, WsServerMessage, BurnStatsDTO, DynamicValues } from "@shared/types";

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
  const [dynamicValues, setDynamicValues] = useState<DynamicValues | null>(null);

  // Fetch initial reward balance + dynamic values
  useEffect(() => {
    getRewardBalance()
      .then((data) => setRewardBalance(data.balanceSol))
      .catch(() => {});
    fetchDynamicValues()
      .then((data) => setDynamicValues(data))
      .catch(() => {});
  }, []);

  // Local dynamic values calculation (1s interval for smooth UI)
  useEffect(() => {
    if (!config) return;
    const interval = setInterval(() => {
      const local = getDynamicValuesLocal(config);
      setDynamicValues(local);
    }, 1000);
    return () => clearInterval(interval);
  }, [config]);

  const onWsMessage = useCallback(
    (msg: WsServerMessage) => {
      switch (msg.type) {
        case "queue:update":
          applyQueue(msg.data);
          break;
        case "winners:update":
          applyWinners(msg.data);
          break;
        case "config:update":
          applyConfig(msg.data);
          break;
        case "spin:result":
          setSpinResult(msg.data);
          break;
        case "reward:balance":
          setRewardBalance(msg.data.balanceSol);
          break;
        case "burn:update":
          setBurnUpdate(msg.data);
          break;
        case "dynamic:update":
          setDynamicValues(msg.data);
          break;
      }
    },
    [applyQueue, applyWinners, applyConfig],
  );

  useWebSocket(onWsMessage);

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
        onSpinResultDone={() => setSpinResult(null)}
        burnUpdate={burnUpdate}
        dynamicValues={dynamicValues}
      />
      <NotificationToast newEntries={newEntries} onConsumed={clearNewEntries} />
    </>
  );
}

export default App;
