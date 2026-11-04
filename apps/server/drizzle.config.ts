import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// DATABASE_URL is supplied by the operator via the environment.

export default defineConfig({
    schema: "./src/lib/drizzle/schema.ts",
    out: "./src/db/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
