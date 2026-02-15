import { API_BASE } from "./constants";
import type {
  ConfigurationDTO,
  QueueEntry,
  WinnerHistoryEntry,
  UpdateConfigRequest,
} from "@shared/types";

const ADMIN_TOKEN_KEY = "admin_token";

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

function authHeaders(): Record<string, string> {
  const token = getAdminToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function getConfig() {
  return fetchJSON<ConfigurationDTO>(`${API_BASE}/config`);
}

export function updateConfig(data: UpdateConfigRequest) {
  return fetchJSON<ConfigurationDTO>(`${API_BASE}/config`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
}

export function getQueue() {
  return fetchJSON<QueueEntry[]>(`${API_BASE}/queue`);
}

export function getWinners(limit = 20) {
  return fetchJSON<WinnerHistoryEntry[]>(`${API_BASE}/winners?limit=${limit}`);
}

export function getRewardBalance() {
  return fetchJSON<{ balanceSol: number }>(`${API_BASE}/reward-balance`);
}

export function triggerTransfer() {
  return fetchJSON<{ message: string }>(`${API_BASE}/admin/trigger-transfer`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export function triggerBuyback() {
  return fetchJSON<{ message: string }>(`${API_BASE}/admin/trigger-buyback`, {
    method: "POST",
    headers: authHeaders(),
  });
}

export function adminLogin(password: string) {
  return fetchJSON<{ token: string }>(`${API_BASE}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
}
