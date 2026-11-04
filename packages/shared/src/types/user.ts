import * as v from "valibot";
import { ValibotSchema } from "../valibot.schema.js";
import { FarmRoleSchema, RoleSchema } from "./role.js";

export const UsernameSchema = v.pipe(
    v.string(),
    v.minLength(3, "Username must be at least 3 characters"),
);
export const PasswordSchema = v.pipe(
    v.string(),
    v.minLength(8, "Password must be at least 8 characters"),
);

export const AuthUserSchema = v.object({
    id: v.number(),
    username: v.string(),
    role: RoleSchema,
    farmId: v.nullable(v.number()),
    farmName: v.nullable(v.string()),
    isActive: v.boolean(),
});

export type AuthUser = v.InferOutput<typeof AuthUserSchema>;

export class UserDto extends ValibotSchema(AuthUserSchema) {}

export const ProvisionUserBodySchema = v.object({
    username: UsernameSchema,
    password: PasswordSchema,
    role: FarmRoleSchema,
    farmId: v.number(),
});

export class ProvisionUserBody extends ValibotSchema(ProvisionUserBodySchema) {}

export type TProvisionUserBody = v.InferOutput<typeof ProvisionUserBodySchema>;

export const SetUserActiveBodySchema = v.object({
    isActive: v.boolean(),
});

export class SetUserActiveBody extends ValibotSchema(SetUserActiveBodySchema) {}

export type TSetUserActiveBody = v.InferOutput<typeof SetUserActiveBodySchema>;

export const ResetUserPasswordBodySchema = v.object({
    password: PasswordSchema,
});

export class ResetUserPasswordBody extends ValibotSchema(ResetUserPasswordBodySchema) {}

export type TResetUserPasswordBody = v.InferOutput<typeof ResetUserPasswordBodySchema>;
