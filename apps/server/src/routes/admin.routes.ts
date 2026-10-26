import { Router } from "express";
import * as v from "valibot";
import { and, eq } from "drizzle-orm";
import {
    Role,
    FarmNameRequestSchema,
    ProvisionUserRequestSchema,
    ResetUserPasswordRequestSchema,
    SetUserActiveRequestSchema,
} from "@bk/shared";
import { db } from "../db/client.js";
import { farms, users } from "../db/schema.js";
import { AuthedRequest, requireAuth, requireRole } from "../auth/middleware.js";
import { toAuthUser } from "../lib/serialize.js";
import { firstIssue } from "../lib/validate.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole(Role.SUPER_ADMIN));

adminRouter.get("/farms", async (_req, res) => {
    res.json(await db.select().from(farms).orderBy(farms.id));
});

adminRouter.post("/farms", async (req, res) => {
    const parsed = v.safeParse(FarmNameRequestSchema, req.body);
    if (!parsed.success) {
        res.status(400).json({ error: firstIssue(parsed.issues) });
        return;
    }
    const [farm] = await db.insert(farms).values({ name: parsed.output.name }).returning();
    res.status(201).json(farm);
});

adminRouter.get("/users", async (req, res) => {
    const farmId = req.query.farmId ? Number(req.query.farmId) : null;
    const rows = await db
        .select({ user: users, farm: farms })
        .from(users)
        .leftJoin(farms, eq(users.farmId, farms.id))
        .where(farmId ? eq(users.farmId, farmId) : undefined)
        .orderBy(users.id);

    res.json(rows.map((r) => toAuthUser(r.user, r.farm ?? undefined)));
});

adminRouter.post("/users", async (req, res) => {
    const parsed = v.safeParse(ProvisionUserRequestSchema, req.body);
    if (!parsed.success) {
        res.status(400).json({ error: firstIssue(parsed.issues) });
        return;
    }

    const [farm] = await db.select().from(farms).where(eq(farms.id, parsed.output.farmId));
    if (!farm) {
        res.status(400).json({ error: "Farm tidak ditemukan" });
        return;
    }

    const [existing] = await db
        .select()
        .from(users)
        .where(eq(users.username, parsed.output.username));
    if (existing) {
        res.status(409).json({ error: "Username sudah digunakan" });
        return;
    }

    const [user] = await db
        .insert(users)
        .values({
            username: parsed.output.username,
            passwordHash: await Bun.password.hash(parsed.output.password),
            role: parsed.output.role,
            farmId: parsed.output.farmId,
        })
        .returning();

    res.status(201).json(toAuthUser(user, farm));
});

adminRouter.patch("/users/:id/active", async (req, res) => {
    const parsed = v.safeParse(SetUserActiveRequestSchema, req.body);
    if (!parsed.success) {
        res.status(400).json({ error: firstIssue(parsed.issues) });
        return;
    }

    const id = Number(req.params.id);
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user || user.role === Role.SUPER_ADMIN) {
        res.status(404).json({ error: "User tidak ditemukan" });
        return;
    }

    const [updated] = await db
        .update(users)
        .set({ isActive: parsed.output.isActive })
        .where(eq(users.id, id))
        .returning();

    const [farm] = updated.farmId
        ? await db.select().from(farms).where(eq(farms.id, updated.farmId))
        : [];
    res.json(toAuthUser(updated, farm));
});

adminRouter.patch("/users/:id/password", async (req, res) => {
    const parsed = v.safeParse(ResetUserPasswordRequestSchema, req.body);
    if (!parsed.success) {
        res.status(400).json({ error: firstIssue(parsed.issues) });
        return;
    }

    const id = Number(req.params.id);
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (!user || user.role === Role.SUPER_ADMIN) {
        res.status(404).json({ error: "User tidak ditemukan" });
        return;
    }

    await db
        .update(users)
        .set({ passwordHash: await Bun.password.hash(parsed.output.password) })
        .where(eq(users.id, id));

    res.json({ ok: true });
});

adminRouter.get("/operators", async (req, res) => {
    const farmId = Number(req.query.farmId);
    if (!farmId) {
        res.status(400).json({ error: "farmId wajib diisi" });
        return;
    }
    res.json(
        await db
            .select({ id: users.id, username: users.username })
            .from(users)
            .where(and(eq(users.role, Role.OPERATOR), eq(users.farmId, farmId))),
    );
});
