import jwt from "jsonwebtoken";
import * as v from "valibot";
import { TokenPayloadSchema, type TokenPayload } from "@bk/shared";
import { config } from "../config.js";

const secret = config.jwtSecret;

export function signToken(payload: TokenPayload): string {
    return jwt.sign({ role: payload.role }, secret, {
        subject: String(payload.userId),
        expiresIn: config.jwtExpiresIn as unknown as jwt.SignOptions["expiresIn"],
    });
}

export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, secret);
        if (typeof decoded === "string") return null;
        const parsed = v.safeParse(TokenPayloadSchema, {
            userId: Number(decoded.sub),
            role: decoded.role,
        });
        return parsed.success ? parsed.output : null;
    } catch {
        return null;
    }
}
