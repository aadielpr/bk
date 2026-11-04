import { eq } from "drizzle-orm";
import { farms } from "../../lib/drizzle/schema.js";
import type { Database } from "../../lib/drizzle/client.js";

export class FarmRepository {
    constructor(private readonly db: Database) {}

    async list() {
        const rows = await this.db.select().from(farms).orderBy(farms.id);
        return rows;
    }

    async findById(id: number) {
        const [farm] = await this.db.select().from(farms).where(eq(farms.id, id));
        return farm;
    }

    async create(name: string) {
        const [farm] = await this.db.insert(farms).values({ name }).returning();
        return farm;
    }
}
