import WebSocket, { WebSocketServer } from "ws";
import type { Server } from "http";
import type { WsServerMessage } from "@shared/types";

const HEARTBEAT_INTERVAL_MS = 30_000;

class WsBroadcaster {
  private wss: WebSocketServer | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  attach(server: Server): void {
    this.wss = new WebSocketServer({ server, path: "/ws" });

    this.wss.on("connection", (ws: WebSocket) => {
      (ws as any).isAlive = true;
      console.log(`WS: client connected (total: ${this.wss?.clients.size})`);

      ws.on("pong", () => {
        (ws as any).isAlive = true;
      });

      ws.on("close", () => {
        console.log(`WS: client disconnected (total: ${this.wss?.clients.size})`);
      });

      ws.on("error", (err: Error) => {
        console.error("WS: client error:", err.message);
      });
    });

    this.heartbeatTimer = setInterval(() => {
      this.wss?.clients.forEach((ws: WebSocket) => {
        if ((ws as any).isAlive === false) {
          ws.terminate();
          return;
        }
        (ws as any).isAlive = false;
        ws.ping();
      });
    }, HEARTBEAT_INTERVAL_MS);

    this.wss.on("close", () => {
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
    });

    console.log("WS: WebSocket server attached on /ws");
  }

  broadcast(message: WsServerMessage): void {
    if (!this.wss) return;

    const payload = JSON.stringify(message);
    let sent = 0;

    this.wss.clients.forEach((client: WebSocket) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        sent++;
      }
    });

    console.log(`WS: broadcast ${message.type} to ${sent} client(s)`);
  }
}

export const wsBroadcaster = new WsBroadcaster();
