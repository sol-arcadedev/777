import type { ConfigurationDTO, UpdateConfigRequest } from "@shared/types";
import ConfigForm from "./ConfigForm";
import AdminActions from "./AdminActions";

interface AdminPanelProps {
  config: ConfigurationDTO;
  onSave: (data: UpdateConfigRequest) => Promise<unknown>;
}

export default function AdminPanel({ config, onSave }: AdminPanelProps) {
  return (
    <div className="min-h-screen bg-casino-black p-8">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gold">777 Admin</h1>
          <a href="#" className="text-sm text-neutral-500 hover:text-gold transition-colors">
            ← Back to site
          </a>
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-6">
          <h2 className="text-sm uppercase tracking-wider text-gold-dim mb-4">Configuration</h2>
          <ConfigForm config={config} onSave={onSave} />
        </div>

        <div className="bg-casino-card border border-casino-border rounded-xl p-6">
          <AdminActions />
        </div>
      </div>
    </div>
  );
}
