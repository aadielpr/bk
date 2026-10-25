import type { NextFunction, Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { verifyToken } from "./jwt.js";

export interface AuthedRequest extends Request {
  user: {
    id: number;
    username: string;
    role: "owner" | "operator" | "super_admin";
    farmId: number | null;
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Tidak terautentikasi" });
    return;
  }

  const payload = await verifyToken(header.slice("Bearer ".length));
  if (!payload) {
    res.status(401).json({ error: "Sesi tidak valid, silakan login kembali" });
    return;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.userId));

  if (!user || !user.isActive) {
    res.status(401).json({ error: "Akun tidak aktif" });
    return;
  }

  (req as AuthedRequest).user = {
    id: user.id,
    username: user.username,
    role: user.role,
    farmId: user.farmId,
  };
  next();
}

export function requireRole(...roles: Array<AuthedRequest["user"]["role"]>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthedRequest).user;
    if (!user || !roles.includes(user.role)) {
      res.status(403).json({ error: "Akses ditolak" });
      return;
    }
    next();
  };
}
