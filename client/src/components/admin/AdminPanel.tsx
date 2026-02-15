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
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(180deg, #1a0f00 0%, #0f0800 100%)" }}>
      <div
        className="p-6 w-full max-w-sm"
        style={{
          background: "#0a0a0a",
          border: "3px solid #daa520",
          boxShadow: "4px 4px 0 rgba(0,0,0,0.5)",
        }}
      >
        <h1 className="text-xl font-bold text-gold mb-4 text-center animate-marquee-glow">777 ADMIN</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="PASSWORD"
            className="w-full bg-casino-dark border-2 border-gold-dim px-3 py-2 text-[9px] text-cream placeholder-gold-dim/40 focus:border-gold focus:outline-none"
            autoFocus
          />
          {error && <p className="text-lose-red text-[8px]">{error}</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-gold text-casino-dark font-bold py-2 text-[9px] hover:bg-gold-bright transition-colors disabled:opacity-50 cursor-pointer uppercase"
            style={{ boxShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}
          >
            {loading ? "LOADING..." : "LOGIN"}
          </button>
        </form>
        <a href="#" className="block text-center mt-3 text-[8px] text-gold-dim hover:text-gold transition-colors">
          BACK TO SITE
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
    <div className="min-h-screen p-6"
      style={{ background: "linear-gradient(180deg, #1a0f00 0%, #0f0800 100%)" }}>
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gold animate-marquee-glow">777 ADMIN</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { clearAdminToken(); setAuthed(false); }}
              className="text-[8px] text-gold-dim hover:text-lose-red transition-colors cursor-pointer uppercase"
            >
              LOGOUT
            </button>
            <a href="#" className="text-[8px] text-gold-dim hover:text-gold transition-colors uppercase">
              BACK
            </a>
          </div>
        </div>

        <div
          className="p-4"
          style={{
            background: "#0a0a0a",
            border: "3px solid #daa520",
            boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
          }}
        >
          <h2 className="text-[9px] uppercase tracking-wider text-gold mb-3">CONFIGURATION</h2>
          <ConfigForm config={config} onSave={handleSave} />
        </div>

        <div
          className="p-4"
          style={{
            background: "#0a0a0a",
            border: "3px solid #daa520",
            boxShadow: "3px 3px 0 rgba(0,0,0,0.5)",
          }}
        >
          <AdminActions />
        </div>
      </div>
    </div>
  );
}
