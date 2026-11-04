import { Hono } from "hono";
import { Role } from "@bk/shared";
import type { AuthMiddleware, AuthEnv } from "../auth/auth.middleware.js";
import { CoopController } from "./coop.controller.js";

export function createCoopRouter(controller: CoopController, auth: AuthMiddleware): Hono<AuthEnv> {
    const router = new Hono<AuthEnv>();
    router.use("*", auth.requireAuth);

    router.get("/", (c) => controller.list(c));
    router.get("/operators", auth.requireRole(Role.OWNER), (c) => controller.listOperators(c));
    router.post("/", auth.requireRole(Role.OWNER), (c) => controller.create(c));
    router.patch("/:id", auth.requireRole(Role.OWNER), (c) => controller.rename(c));
    router.put("/:id/operators", auth.requireRole(Role.OWNER), (c) =>
        controller.assignOperators(c),
    );

    return router;
}
