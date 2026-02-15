import { useState, useEffect, useCallback } from "react";
import { getConfig, updateConfig as apiUpdateConfig } from "../lib/api";
import { POLL_CONFIG_MS } from "../lib/constants";
import type { ConfigurationDTO, UpdateConfigRequest } from "@shared/types";

export function useConfig() {
  const [config, setConfig] = useState<ConfigurationDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      const data = await getConfig();
      setConfig(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch config");
    }
  }, []);

  useEffect(() => {
    fetchConfig();
    const id = setInterval(fetchConfig, POLL_CONFIG_MS);
    return () => clearInterval(id);
  }, [fetchConfig]);

  const updateConfigFn = useCallback(async (data: UpdateConfigRequest) => {
    const updated = await apiUpdateConfig(data);
    setConfig(updated);
    return updated;
  }, []);

  const applyConfig = useCallback((data: ConfigurationDTO) => {
    setConfig(data);
  }, []);

  return { config, error, updateConfig: updateConfigFn, refetch: fetchConfig, applyConfig };
}
