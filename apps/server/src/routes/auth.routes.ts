import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { farms, users } from "../db/schema.js";
import { signToken } from "../auth/jwt.js";
import { AuthedRequest, requireAuth } from "../auth/middleware.js";
import { toAuthUser } from "../lib/serialize.js";

export const authRouter = Router();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Username dan password wajib diisi" });
    return;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, parsed.data.username));

  if (!user || !user.isActive) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  const valid = await Bun.password.verify(
    parsed.data.password,
    user.passwordHash,
  );
  if (!valid) {
    res.status(401).json({ error: "Username atau password salah" });
    return;
  }

  const [farm] = user.farmId
    ? await db.select().from(farms).where(eq(farms.id, user.farmId))
    : [];

  res.json({
    token: await signToken({ userId: user.id, role: user.role }),
    user: toAuthUser(user, farm),
  });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const authed = (req as AuthedRequest).user;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, authed.id));
  if (!user) {
    res.status(401).json({ error: "Akun tidak ditemukan" });
    return;
  }
  const [farm] = user.farmId
    ? await db.select().from(farms).where(eq(farms.id, user.farmId))
    : [];
  res.json(toAuthUser(user, farm));
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

authRouter.post(
  "/change-password",
  requireAuth,
  async (req, res) => {
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      res
        .status(400)
        .json({ error: "Password baru minimal 8 karakter" });
      return;
    }

    const authed = (req as AuthedRequest).user;
    const [user] = await db.select().from(users).where(eq(users.id, authed.id));
    if (!user) {
      res.status(401).json({ error: "Akun tidak ditemukan" });
      return;
    }

    const valid = await Bun.password.verify(
      parsed.data.currentPassword,
      user.passwordHash,
    );
    if (!valid) {
      res.status(400).json({ error: "Password saat ini salah" });
      return;
    }

    await db
      .update(users)
      .set({
        passwordHash: await Bun.password.hash(parsed.data.newPassword),
      })
      .where(eq(users.id, authed.id));

    res.json({ ok: true });
  },
);
