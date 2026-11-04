import { Hono } from "hono";
import type { AuthMiddleware, AuthEnv } from "./auth.middleware.js";
import { AuthController } from "./auth.controller.js";

export function createAuthRouter(controller: AuthController, auth: AuthMiddleware): Hono<AuthEnv> {
    const router = new Hono<AuthEnv>();

    router.post("/login", (c) => controller.login(c));
    router.get("/me", auth.requireAuth, (c) => controller.currentUser(c));
    router.post("/change-password", auth.requireAuth, (c) => controller.changePassword(c));

    return router;
}
