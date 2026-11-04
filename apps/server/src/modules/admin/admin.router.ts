import { Hono } from "hono";
import { Role } from "@bk/shared";
import type { AuthMiddleware } from "../auth/auth.middleware.js";
import { AdminController } from "./admin.controller.js";

export function createAdminRouter(controller: AdminController, auth: AuthMiddleware): Hono {
    const router = new Hono();
    router.use("*", auth.requireAuth, auth.requireRole(Role.SUPER_ADMIN));

    router.get("/farms", (c) => controller.listFarms(c));
    router.post("/farms", (c) => controller.createFarm(c));
    router.get("/users", (c) => controller.listUsers(c));
    router.post("/users", (c) => controller.provisionUser(c));
    router.patch("/users/:id/active", (c) => controller.setUserActive(c));
    router.patch("/users/:id/password", (c) => controller.resetUserPassword(c));
    router.get("/operators", (c) => controller.listOperators(c));

    return router;
}
