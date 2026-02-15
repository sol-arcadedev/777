import { useState, useEffect } from "react";
import type { ConfigurationDTO, UpdateConfigRequest } from "@shared/types";
import { adminLogin, getAdminToken, setAdminToken, clearAdminToken, updateConfig as apiUpdateConfig } from "../../lib/api";
import ConfigForm from "./ConfigForm";
import AdminActions from "./AdminActions";

interface AdminPanelProps {
  config: ConfigurationDTO;
  onSave: (data: UpdateConfigRequest) => Promise<unknown>;
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { token } = await adminLogin(password);
      setAdminToken(token);
      onLogin();
    } catch {
      setError("Invalid password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-casino-black flex items-center justify-center">
      <div className="bg-casino-card border border-casino-border rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gold mb-6 text-center">777 Admin</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            className="w-full bg-casino-dark border border-casino-border rounded px-4 py-2 text-white placeholder-neutral-500 focus:border-gold-dim focus:outline-none"
            autoFocus
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-gold text-casino-black font-semibold py-2 rounded hover:bg-gold-dim transition-colors disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <a href="#" className="block text-center mt-4 text-sm text-neutral-500 hover:text-gold transition-colors">
          ← Back to site
        </a>
      </div>
    </div>
  );
}

export default function AdminPanel({ config, onSave }: AdminPanelProps) {
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!getAdminToken());
  }, []);

  const handleSave = async (data: UpdateConfigRequest) => {
    try {
      return await onSave(data);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("401")) {
        clearAdminToken();
        setAuthed(false);
      }
      throw err;
    }
  };

  if (!authed) {
    return <LoginForm onLogin={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-casino-black p-8">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gold">777 Admin</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => { clearAdminToken(); setAuthed(false); }}
              className="text-sm text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
            >
              Logout
            </button>
            <a href="#" className="text-sm text-neutral-500 hover:text-gold transition-colors">
              ← Back to site
            </a>
          </div>
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-6">
          <h2 className="text-sm uppercase tracking-wider text-gold-dim mb-4">Configuration</h2>
          <ConfigForm config={config} onSave={handleSave} />
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-6">
          <AdminActions />
        </div>
      </div>
    </div>
  );
}
