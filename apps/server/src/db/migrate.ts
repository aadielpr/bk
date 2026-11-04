import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { config } from "../config.js";
import { Slog } from "../utils/slog.js";

const logger = Slog.New("drizzle-migrate");
const client = postgres(config.databaseUrl, { max: 1, prepare: false });
const db = drizzle({ client });

await migrate(db, { migrationsFolder: "./src/db/migrations" });
logger.info("migrations applied");
await client.end();
