import { useEffect, useRef, useCallback } from "react";
import type { WsServerMessage } from "@shared/types";

const INITIAL_DELAY_MS = 3_000;
const MAX_DELAY_MS = 30_000;

export function useWebSocket(onMessage: (msg: WsServerMessage) => void) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const wsRef = useRef<WebSocket | null>(null);
  const delayRef = useRef(INITIAL_DELAY_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    let url: string;
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      const wsProtocol = apiUrl.startsWith("https") ? "wss:" : "ws:";
      const host = apiUrl.replace(/^https?:\/\//, "");
      url = `${wsProtocol}//${host}/ws`;
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      url = `${protocol}//${window.location.host}/ws`;
    }
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      delayRef.current = INITIAL_DELAY_MS;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as WsServerMessage;
        onMessageRef.current(msg);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      scheduleReconnect();
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      delayRef.current = Math.min(delayRef.current * 2, MAX_DELAY_MS);
      connect();
    }, delayRef.current);
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);
}
