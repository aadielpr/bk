import { Router } from "express";
import * as v from "valibot";
import { eq } from "drizzle-orm";
import { LoginRequestSchema, ChangePasswordRequestSchema } from "@bk/shared";
import { db } from "../db/client.js";
import { farms, users } from "../db/schema.js";
import { signToken } from "../auth/jwt.js";
import { AuthedRequest, requireAuth } from "../auth/middleware.js";
import { toAuthUser } from "../lib/serialize.js";
import { firstIssue } from "../lib/validate.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
    const parsed = v.safeParse(LoginRequestSchema, req.body);
    if (!parsed.success) {
        res.status(400).json({ error: firstIssue(parsed.issues) });
        return;
    }

    const [user] = await db.select().from(users).where(eq(users.username, parsed.output.username));

    if (!user || !user.isActive) {
        res.status(401).json({ error: "Username atau password salah" });
        return;
    }

    const valid = await Bun.password.verify(parsed.output.password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ error: "Username atau password salah" });
        return;
    }

    const [farm] = user.farmId
        ? await db.select().from(farms).where(eq(farms.id, user.farmId))
        : [];

    res.json({
        token: signToken({ userId: user.id, role: user.role }),
        user: toAuthUser(user, farm),
    });
});

authRouter.get("/me", requireAuth, async (req, res) => {
    const authed = (req as AuthedRequest).user;
    const [user] = await db.select().from(users).where(eq(users.id, authed.id));
    if (!user) {
        res.status(401).json({ error: "Akun tidak ditemukan" });
        return;
    }
    const [farm] = user.farmId
        ? await db.select().from(farms).where(eq(farms.id, user.farmId))
        : [];
    res.json(toAuthUser(user, farm));
});

authRouter.post("/change-password", requireAuth, async (req, res) => {
    const parsed = v.safeParse(ChangePasswordRequestSchema, req.body);
    if (!parsed.success) {
        res.status(400).json({ error: firstIssue(parsed.issues) });
        return;
    }

    const authed = (req as AuthedRequest).user;
    const [user] = await db.select().from(users).where(eq(users.id, authed.id));
    if (!user) {
        res.status(401).json({ error: "Akun tidak ditemukan" });
        return;
    }

    const valid = await Bun.password.verify(parsed.output.currentPassword, user.passwordHash);
    if (!valid) {
        res.status(400).json({ error: "Password saat ini salah" });
        return;
    }

    await db
        .update(users)
        .set({
            passwordHash: await Bun.password.hash(parsed.output.newPassword),
        })
        .where(eq(users.id, authed.id));

    res.json({ ok: true });
});
