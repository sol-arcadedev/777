import { API_BASE } from "./constants";
import type {
  ConfigurationDTO,
  QueueEntry,
  WinnerHistoryEntry,
  UpdateConfigRequest,
  SubmitSpinRequest,
  SubmitSpinResponse,
} from "@shared/types";

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export function getConfig() {
  return fetchJSON<ConfigurationDTO>(`${API_BASE}/config`);
}

export function updateConfig(data: UpdateConfigRequest) {
  return fetchJSON<ConfigurationDTO>(`${API_BASE}/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getQueue() {
  return fetchJSON<QueueEntry[]>(`${API_BASE}/queue`);
}

export function getWinners(limit = 20) {
  return fetchJSON<WinnerHistoryEntry[]>(`${API_BASE}/winners?limit=${limit}`);
}

export function triggerTransfer() {
  return fetchJSON<{ message: string }>(`${API_BASE}/admin/trigger-transfer`, {
    method: "POST",
  });
}

export function submitSpin(data: SubmitSpinRequest) {
  return fetchJSON<SubmitSpinResponse>(`${API_BASE}/spin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function triggerBuyback() {
  return fetchJSON<{ message: string }>(`${API_BASE}/admin/trigger-buyback`, {
    method: "POST",
  });
}
