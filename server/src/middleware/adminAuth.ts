import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";

// In-memory session store: token → expiry timestamp
const sessions = new Map<string, number>();

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export function createSession(): string {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, Date.now() + SESSION_DURATION_MS);
  return token;
}

export function validateSession(token: string): boolean {
  const expiry = sessions.get(token);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    sessions.delete(token);
    return false;
  }
  return true;
}

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(503).json({ error: "Admin not configured" });
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const token = authHeader.slice(7);
  if (!validateSession(token)) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
