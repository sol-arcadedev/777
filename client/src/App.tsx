import { useState, useEffect } from "react";
import { useConfig } from "./hooks/useConfig";
import { useQueue } from "./hooks/useQueue";
import { useWinners } from "./hooks/useWinners";
import Layout from "./components/Layout";
import AdminPanel from "./components/admin/AdminPanel";
import NotificationToast from "./components/NotificationToast";

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
  const { config, updateConfig } = useConfig();
  const { activeSpin, waiting, newEntries, clearNewEntries } = useQueue();
  const { winners } = useWinners();

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
      />
      <NotificationToast newEntries={newEntries} onConsumed={clearNewEntries} />
    </>
  );
}

export default App;
