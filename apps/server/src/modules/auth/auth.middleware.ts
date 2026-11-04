import type { MiddlewareHandler } from "hono";
import type { Role } from "@bk/shared";
import type { users } from "../../lib/drizzle/schema.js";
import { Err } from "../../lib/response/err.response.js";
import type { JwtService } from "../../lib/jwt/jwt.service.js";
import type { UserRepository } from "../user/user.repository.js";

export type AuthenticatedUser = Pick<
    typeof users.$inferSelect,
    "id" | "username" | "role" | "farmId"
>;

export type AuthEnv = {
    Variables: {
        user: AuthenticatedUser;
    };
};

export type AuthMiddleware = {
    requireAuth: MiddlewareHandler<AuthEnv>;
    requireRole: (...roles: Role[]) => MiddlewareHandler<AuthEnv>;
};

export function createAuthMiddleware(users: UserRepository, jwt: JwtService): AuthMiddleware {
    const requireAuth: MiddlewareHandler<AuthEnv> = async (c, next) => {
        const header = c.req.header("Authorization");
        if (!header?.startsWith("Bearer ")) {
            throw Err.Unauthorized("Unauthenticated");
        }

        const payload = jwt.verify(header.slice("Bearer ".length));
        if (!payload) {
            throw Err.Unauthorized("Invalid session, please log in again");
        }

        const user = await users.findById(payload.userId);
        if (!user || user.dAt !== null) {
            throw Err.Unauthorized("Account is inactive");
        }

        c.set("user", {
            id: user.id,
            username: user.username,
            role: user.role,
            farmId: user.farmId,
        });
        await next();
    };

    const requireRole =
        (...roles: Role[]): MiddlewareHandler<AuthEnv> =>
        async (c, next) => {
            if (!roles.includes(c.get("user").role)) {
                throw Err.Forbidden("Access denied");
            }
            await next();
        };

    return { requireAuth, requireRole };
}
