export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

export const POLL_FALLBACK_MS = 5_000;
export const POLL_CONFIG_MS = POLL_FALLBACK_MS;
export const POLL_QUEUE_MS = POLL_FALLBACK_MS;
export const POLL_WINNERS_MS = POLL_FALLBACK_MS;

export const SOLSCAN_TX_URL = "https://solscan.io/tx/";
export const SOLSCAN_TOKEN_URL = "https://solscan.io/token/";
export const PUMP_BUY_URL = "https://pump.fun/coin/";

export const MAX_WINNERS_DISPLAY = 20;
