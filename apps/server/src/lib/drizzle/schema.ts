import { sql } from "drizzle-orm";
import {
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

function timestamps() {
    return {
        cAt: timestamp("c_at", { withTimezone: true }).notNull().defaultNow(),
        uAt: timestamp("u_at", { withTimezone: true }),
        dAt: timestamp("d_at", { withTimezone: true }),
    };
}

export const farms = pgTable("farms", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    ...timestamps(),
});

export const users = pgTable(
    "users",
    {
        id: serial("id").primaryKey(),
        username: text("username").notNull(),
        passwordHash: text("password_hash").notNull(),
        role: userRole("role").notNull(),
        farmId: integer("farm_id").references(() => farms.id),
        ...timestamps(),
    },
    (t) => [
        uniqueIndex("users_username_live_idx")
            .on(t.username)
            .where(sql`${t.dAt} IS NULL`),
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
    ...timestamps(),
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
        ...timestamps(),
    },
    (t) => [
        uniqueIndex("coop_assignments_coop_user_live_idx")
            .on(t.coopId, t.userId)
            .where(sql`${t.dAt} IS NULL`),
    ],
);
