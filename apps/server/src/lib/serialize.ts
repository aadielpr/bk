import type { farms as farmsTable, users as usersTable } from "../db/schema.js";
import type { AuthUser } from "@bk/shared";

type UserRow = typeof usersTable.$inferSelect;
type FarmRow = typeof farmsTable.$inferSelect;

export function toAuthUser(user: UserRow, farm?: FarmRow): AuthUser {
    return {
        id: user.id,
        username: user.username,
        role: user.role,
        farmId: user.farmId,
        farmName: farm?.name ?? null,
        isActive: user.isActive,
    };
}
