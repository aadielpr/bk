import { Router } from "express";
import { z } from "zod";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { farms, users } from "../db/schema.js";
import { AuthedRequest, requireAuth, requireRole } from "../auth/middleware.js";
import { toAuthUser } from "../lib/serialize.js";

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole("super_admin"));

const farmSchema = z.object({ name: z.string().min(1) });

adminRouter.get("/farms", async (_req, res) => {
  res.json(await db.select().from(farms).orderBy(farms.id));
});

adminRouter.post("/farms", async (req, res) => {
  const parsed = farmSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Nama farm wajib diisi" });
    return;
  }
  const [farm] = await db
    .insert(farms)
    .values({ name: parsed.data.name })
    .returning();
  res.status(201).json(farm);
});

const userSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(8),
  role: z.enum(["owner", "operator"]),
  farmId: z.number().int(),
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
  const parsed = userSchema.safeParse(req.body);
  if (!parsed.success) {
    res
      .status(400)
      .json({ error: "Data tidak valid (username min 3, password min 8)" });
    return;
  }

  const [farm] = await db
    .select()
    .from(farms)
    .where(eq(farms.id, parsed.data.farmId));
  if (!farm) {
    res.status(400).json({ error: "Farm tidak ditemukan" });
    return;
  }

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.username, parsed.data.username));
  if (existing) {
    res.status(409).json({ error: "Username sudah digunakan" });
    return;
  }

  const [user] = await db
    .insert(users)
    .values({
      username: parsed.data.username,
      passwordHash: await Bun.password.hash(parsed.data.password),
      role: parsed.data.role,
      farmId: parsed.data.farmId,
    })
    .returning();

  res.status(201).json(toAuthUser(user, farm));
});

adminRouter.patch("/users/:id/active", async (req, res) => {
  const parsed = z.object({ isActive: z.boolean() }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "isActive wajib boolean" });
    return;
  }

  const id = Number(req.params.id);
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user || user.role === "super_admin") {
    res.status(404).json({ error: "User tidak ditemukan" });
    return;
  }

  const [updated] = await db
    .update(users)
    .set({ isActive: parsed.data.isActive })
    .where(eq(users.id, id))
    .returning();

  const [farm] = updated.farmId
    ? await db.select().from(farms).where(eq(farms.id, updated.farmId))
    : [];
  res.json(toAuthUser(updated, farm));
});

adminRouter.patch("/users/:id/password", async (req, res) => {
  const parsed = z.object({ password: z.string().min(8) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Password minimal 8 karakter" });
    return;
  }

  const id = Number(req.params.id);
  const [user] = await db.select().from(users).where(eq(users.id, id));
  if (!user || user.role === "super_admin") {
    res.status(404).json({ error: "User tidak ditemukan" });
    return;
  }

  await db
    .update(users)
    .set({ passwordHash: await Bun.password.hash(parsed.data.password) })
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
      .where(
        and(eq(users.role, "operator"), eq(users.farmId, farmId)),
      ),
  );
});
