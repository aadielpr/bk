import { and, eq, inArray, isNull } from "drizzle-orm";
import type { FarmRole } from "@bk/shared";
import { farms, users } from "../../lib/drizzle/schema.js";
import type { Database } from "../../lib/drizzle/client.js";

export class UserRepository {
    constructor(private readonly db: Database) {}

    async findById(id: number) {
        const [user] = await this.db.select().from(users).where(eq(users.id, id));
        return user;
    }

    async findByUsername(username: string) {
        const [user] = await this.db
            .select()
            .from(users)
            .where(and(eq(users.username, username), isNull(users.dAt)));
        return user;
    }

    async listWithFarm(farmId?: number) {
        const rows = await this.db
            .select({ user: users, farm: farms })
            .from(users)
            .leftJoin(farms, eq(users.farmId, farms.id))
            .where(farmId ? eq(users.farmId, farmId) : undefined)
            .orderBy(users.id);
        return rows;
    }

    async create(username: string, passwordHash: string, role: FarmRole, farmId: number) {
        const [user] = await this.db
            .insert(users)
            .values({ username, passwordHash, role, farmId })
            .returning();
        return user;
    }

    async updateActive(id: number, isActive: boolean) {
        const now = new Date();
        const [user] = await this.db
            .update(users)
            .set({ dAt: isActive ? null : now, uAt: now })
            .where(eq(users.id, id))
            .returning();
        return user;
    }

    async updatePassword(id: number, passwordHash: string): Promise<void> {
        await this.db.update(users).set({ passwordHash, uAt: new Date() }).where(eq(users.id, id));
    }

    async listOperatorsByFarm(farmId: number) {
        const rows = await this.db
            .select({ id: users.id, username: users.username })
            .from(users)
            .where(and(eq(users.role, "operator"), eq(users.farmId, farmId), isNull(users.dAt)))
            .orderBy(users.username);
        return rows;
    }

    async findByIds(ids: number[]) {
        return ids.length ? this.db.select().from(users).where(inArray(users.id, ids)) : [];
    }
}
