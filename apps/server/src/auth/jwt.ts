import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@bk/shared";
import { config } from "../config.js";

const secret = new TextEncoder().encode(config.jwtSecret);

export interface TokenPayload {
  userId: number;
  role: Role;
}

export async function signToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(payload.userId))
    .setIssuedAt()
    .setExpirationTime(config.jwtExpiresIn)
    .sign(secret);
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.sub) return null;
    return {
      userId: Number(payload.sub),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}
