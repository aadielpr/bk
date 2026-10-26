import * as v from "valibot";
import { RoleSchema, FarmRoleSchema } from "./role.js";
import { FarmSchema } from "./farm.js";

export const UsernameSchema = v.pipe(v.string(), v.minLength(3, "Username minimal 3 karakter"));
export const PasswordSchema = v.pipe(v.string(), v.minLength(8, "Password minimal 8 karakter"));

export const AuthUserSchema = v.object({
    id: v.number(),
    username: v.string(),
    role: RoleSchema,
    farmId: v.nullable(v.number()),
    farmName: v.nullable(v.string()),
    isActive: v.boolean(),
});

export type AuthUser = v.InferOutput<typeof AuthUserSchema>;

export const LoginRequestSchema = v.object({
    username: v.pipe(v.string(), v.minLength(1, "Username wajib diisi")),
    password: v.pipe(v.string(), v.minLength(1, "Password wajib diisi")),
});

export const ChangePasswordRequestSchema = v.object({
    currentPassword: v.string(),
    newPassword: PasswordSchema,
});

export const ProvisionUserRequestSchema = v.object({
    username: UsernameSchema,
    password: PasswordSchema,
    role: FarmRoleSchema,
    farmId: v.number(),
});

export const SetUserActiveRequestSchema = v.object({
    isActive: v.boolean(),
});

export const ResetUserPasswordRequestSchema = v.object({
    password: PasswordSchema,
});
