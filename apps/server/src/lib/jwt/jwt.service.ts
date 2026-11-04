import jwt from "jsonwebtoken";
import * as v from "valibot";
import { TokenPayloadSchema, type TokenPayload } from "@bk/shared";

export class JwtService {
    constructor(
        private readonly secret: string,
        private readonly expiresIn: string,
    ) {}

    sign(payload: TokenPayload): string {
        const token = jwt.sign({ role: payload.role }, this.secret, {
            subject: String(payload.userId),
            expiresIn: this.expiresIn as unknown as jwt.SignOptions["expiresIn"],
        });
        return token;
    }

    verify(token: string): TokenPayload | null {
        try {
            const decoded = jwt.verify(token, this.secret);
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
}
