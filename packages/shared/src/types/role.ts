import * as v from "valibot";

export const Role = {
    SUPER_ADMIN: "super_admin",
    OWNER: "owner",
    OPERATOR: "operator",
} as const;

export const RoleSchema = v.picklist([Role.SUPER_ADMIN, Role.OWNER, Role.OPERATOR]);
export type Role = v.InferOutput<typeof RoleSchema>;

// Role for provisioned farm accounts — provisioning a Super Admin is forbidden.
export const FarmRoleSchema = v.picklist([Role.OWNER, Role.OPERATOR]);
export type FarmRole = v.InferOutput<typeof FarmRoleSchema>;
