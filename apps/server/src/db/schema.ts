import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  integer,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", ["owner", "operator", "super_admin"]);

export const farms = pgTable("farms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRole("role").notNull(),
    farmId: integer("farm_id").references(() => farms.id),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "users_farm_id_matches_role",
      sql`((${t.role} = 'super_admin') AND ${t.farmId} IS NULL) OR ((${t.role} <> 'super_admin') AND ${t.farmId} IS NOT NULL)`,
    ),
  ],
);

export const coops = pgTable("coops", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id")
    .notNull()
    .references(() => farms.id),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const coopAssignments = pgTable(
  "coop_assignments",
  {
    id: serial("id").primaryKey(),
    coopId: integer("coop_id")
      .notNull()
      .references(() => coops.id),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
  },
  (t) => [uniqueIndex("coop_assignments_coop_user_idx").on(t.coopId, t.userId)],
);
