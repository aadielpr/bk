import { Router } from "express";
import { z } from "zod";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../db/client.js";
import { coopAssignments, coops, farms, users } from "../db/schema.js";
import { AuthedRequest, requireAuth, requireRole } from "../auth/middleware.js";

export const coopRouter = Router();

coopRouter.use(requireAuth);

async function listCoops(filter: { farmIds?: number[]; coopIds?: number[] } | "all") {
  const where =
    filter === "all"
      ? undefined
      : filter.coopIds
        ? inArray(coops.id, filter.coopIds.length ? filter.coopIds : [-1])
        : inArray(coops.farmId, filter.farmIds!.length ? filter.farmIds! : [-1]);

  const rows = await db
    .select({ coop: coops, farm: farms })
    .from(coops)
    .innerJoin(farms, eq(coops.farmId, farms.id))
    .where(where)
    .orderBy(asc(coops.id));

  const coopIds = rows.map((r) => r.coop.id);
  const assignments = coopIds.length
    ? await db
        .select()
        .from(coopAssignments)
        .where(inArray(coopAssignments.coopId, coopIds))
    : [];

  return rows.map((r) => ({
    id: r.coop.id,
    farmId: r.coop.farmId,
    farmName: r.farm.name,
    name: r.coop.name,
    operatorIds: assignments
      .filter((a) => a.coopId === r.coop.id)
      .map((a) => a.userId),
  }));
}

coopRouter.get("/", async (req, res) => {
  const user = (req as AuthedRequest).user;

  if (user.role === "super_admin") {
    res.json(await listCoops("all"));
    return;
  }
  if (user.role === "owner") {
    res.json(await listCoops({ farmIds: [user.farmId!] }));
    return;
  }

  // Operator: only assigned coops.
  const assigned = await db
    .select({ coopId: coopAssignments.coopId })
    .from(coopAssignments)
    .where(eq(coopAssignments.userId, user.id));

  res.json(await listCoops({ coopIds: assigned.map((a) => a.coopId) }));
});

// Operators of the owner's farm, for coop assignment UI.
coopRouter.get(
  "/operators",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    const user = (req as AuthedRequest).user;
    res.json(
      await db
        .select({ id: users.id, username: users.username })
        .from(users)
        .where(and(eq(users.role, "operator"), eq(users.farmId, user.farmId!)))
        .orderBy(asc(users.username)),
    );
  },
);

const coopSchema = z.object({ name: z.string().min(1) });

async function ownedCoop(req: AuthedRequest, coopId: number) {
  const [coop] = await db
    .select()
    .from(coops)
    .where(and(eq(coops.id, coopId), eq(coops.farmId, req.user.farmId!)));
  return coop;
}

coopRouter.post("/", requireAuth, requireRole("owner"), async (req, res) => {
  const user = (req as AuthedRequest).user;
  const parsed = coopSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Nama kandang wajib diisi" });
    return;
  }

  const [coop] = await db
    .insert(coops)
    .values({ name: parsed.data.name, farmId: user.farmId! })
    .returning();

  res.status(201).json({
    id: coop.id,
    farmId: coop.farmId,
    farmName: null,
    name: coop.name,
    operatorIds: [],
  });
});

coopRouter.patch(
  "/:id",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    const user = (req as AuthedRequest).user;
    const coop = await ownedCoop(req as AuthedRequest, Number(req.params.id));
    if (!coop) {
      res.status(404).json({ error: "Kandang tidak ditemukan" });
      return;
    }

    const parsed = coopSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Nama kandang wajib diisi" });
      return;
    }

    const [updated] = await db
      .update(coops)
      .set({ name: parsed.data.name })
      .where(eq(coops.id, coop.id))
      .returning();

    res.json({
      id: updated.id,
      farmId: updated.farmId,
      farmName: null,
      name: updated.name,
      operatorIds: [],
    });
  },
);

const assignmentSchema = z.object({
  operatorIds: z.array(z.number().int()),
});

coopRouter.put(
  "/:id/operators",
  requireAuth,
  requireRole("owner"),
  async (req, res) => {
    const user = (req as AuthedRequest).user;
    const coop = await ownedCoop(req as AuthedRequest, Number(req.params.id));
    if (!coop) {
      res.status(404).json({ error: "Kandang tidak ditemukan" });
      return;
    }

    const parsed = assignmentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "operatorIds wajib array angka" });
      return;
    }

    // Every operator must belong to the owner's farm.
    const operators = parsed.data.operatorIds.length
      ? await db
          .select()
          .from(users)
          .where(inArray(users.id, parsed.data.operatorIds))
      : [];
    const invalid = operators.some(
      (o) => o.role !== "operator" || o.farmId !== user.farmId,
    );
    if (invalid || operators.length !== parsed.data.operatorIds.length) {
      res
        .status(400)
        .json({ error: "Operator tidak ditemukan di farm ini" });
      return;
    }

    await db.delete(coopAssignments).where(eq(coopAssignments.coopId, coop.id));
    if (parsed.data.operatorIds.length) {
      await db.insert(coopAssignments).values(
        parsed.data.operatorIds.map((operatorId) => ({
          coopId: coop.id,
          userId: operatorId,
        })),
      );
    }

    res.json({ ok: true, operatorIds: parsed.data.operatorIds });
  },
);
