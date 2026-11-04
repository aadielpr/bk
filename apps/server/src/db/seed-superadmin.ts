import "dotenv/config";
import { eq } from "drizzle-orm";
import { config } from "../config.js";
import { users } from "../lib/drizzle/schema.js";
import { Slog } from "../utils/slog.js";
import { DatabaseClient } from "../lib/drizzle/client.js";

const logger = Slog.New("seed-superadmin");
const databaseClient = new DatabaseClient(config.databaseUrl).init().connect();
const db = databaseClient.db;

if (!config.superAdminUsername || !config.superAdminPassword) {
    logger.error("SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD env vars are required");
    process.exit(1);
}

const existing = await db.select().from(users).where(eq(users.username, config.superAdminUsername));

if (existing.length > 0) {
    logger.info(`super admin "${config.superAdminUsername}" already exists`);
    process.exit(0);
}

await db.insert(users).values({
    username: config.superAdminUsername,
    passwordHash: await Bun.password.hash(config.superAdminPassword),
    role: "super_admin",
});

logger.info(`super admin "${config.superAdminUsername}" created`);
await databaseClient.close();
process.exit(0);
