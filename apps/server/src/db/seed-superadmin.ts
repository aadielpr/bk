import "dotenv/config";
import { eq } from "drizzle-orm";
import { config } from "../config.js";
import { db } from "./client.js";
import { users } from "./schema.js";

// One-time bootstrap of the Super Admin account. Run manually at deploy:
//   SUPER_ADMIN_USERNAME=... SUPER_ADMIN_PASSWORD=... bun src/db/seed-superadmin.ts
if (!config.superAdminUsername || !config.superAdminPassword) {
  console.error(
    "SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD env vars are required",
  );
  process.exit(1);
}

const existing = await db
  .select()
  .from(users)
  .where(eq(users.username, config.superAdminUsername));

if (existing.length > 0) {
  console.log(`super admin "${config.superAdminUsername}" already exists`);
  process.exit(0);
}

await db.insert(users).values({
  username: config.superAdminUsername,
  passwordHash: await Bun.password.hash(config.superAdminPassword),
  role: "super_admin",
});

console.log(`super admin "${config.superAdminUsername}" created`);
process.exit(0);
