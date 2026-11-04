import { and, asc, eq, inArray, isNull, type SQL } from "drizzle-orm";
import type { Coop } from "@bk/shared";
import { coopAssignments, coops, farms } from "../../lib/drizzle/schema.js";
import type { Database } from "../../lib/drizzle/client.js";

export class CoopRepository {
    constructor(private readonly db: Database) {}

    async listAll(): Promise<Coop[]> {
        const rows = await this.listCoops();
        return rows;
    }

    async listByFarmIds(farmIds: number[]): Promise<Coop[]> {
        const inFarm = inArray(coops.farmId, farmIds.length ? farmIds : [-1]);
        const rows = await this.listCoops(inFarm);
        return rows;
    }

    async listByCoopIds(coopIds: number[]): Promise<Coop[]> {
        const inCoop = inArray(coops.id, coopIds.length ? coopIds : [-1]);
        const rows = await this.listCoops(inCoop);
        return rows;
    }

    async assignedCoopIds(userId: number): Promise<number[]> {
        const assignments = await this.db
            .select({ coopId: coopAssignments.coopId })
            .from(coopAssignments)
            .where(and(eq(coopAssignments.userId, userId), isNull(coopAssignments.dAt)));
        const coopIds = assignments.map((assignment) => assignment.coopId);
        return coopIds;
    }

    async findLiveCoopInFarm(id: number, farmId: number) {
        const [coop] = await this.db
            .select()
            .from(coops)
            .where(and(eq(coops.id, id), eq(coops.farmId, farmId), isNull(coops.dAt)));
        return coop;
    }

    async create(name: string, farmId: number) {
        const [coop] = await this.db.insert(coops).values({ name, farmId }).returning();
        return coop;
    }

    async updateName(id: number, name: string) {
        const [coop] = await this.db
            .update(coops)
            .set({ name, uAt: new Date() })
            .where(and(eq(coops.id, id), isNull(coops.dAt)))
            .returning();
        return coop;
    }

    async replaceOperators(coopId: number, operatorIds: number[]): Promise<void> {
        const now = new Date();
        await this.db
            .update(coopAssignments)
            .set({ dAt: now, uAt: now })
            .where(and(eq(coopAssignments.coopId, coopId), isNull(coopAssignments.dAt)));

        if (!operatorIds.length) return;

        await this.db
            .insert(coopAssignments)
            .values(operatorIds.map((userId) => ({ coopId, userId })));
    }

    private async listCoops(where?: SQL<unknown>): Promise<Coop[]> {
        const rows = await this.db
            .select({ coop: coops, farm: farms })
            .from(coops)
            .innerJoin(farms, eq(coops.farmId, farms.id))
            .where(where ? and(where, isNull(coops.dAt)) : isNull(coops.dAt))
            .orderBy(asc(coops.id));

        const coopIds = rows.map((row) => row.coop.id);
        const assignments = coopIds.length
            ? await this.db
                  .select()
                  .from(coopAssignments)
                  .where(and(inArray(coopAssignments.coopId, coopIds), isNull(coopAssignments.dAt)))
            : [];

        const result = rows.map(({ coop, farm }) => ({
            id: coop.id,
            farmId: coop.farmId,
            farmName: farm.name,
            name: coop.name,
            operatorIds: assignments
                .filter((assignment) => assignment.coopId === coop.id)
                .map((assignment) => assignment.userId),
        }));
        return result;
    }
}
