import * as v from "valibot";
import { ValibotSchema } from "../valibot.schema.js";
import { PasswordSchema } from "./user.js";

export const LoginBodySchema = v.object({
    username: v.pipe(v.string(), v.minLength(1, "Username is required")),
    password: v.pipe(v.string(), v.minLength(1, "Password is required")),
});

export class LoginBody extends ValibotSchema(LoginBodySchema) {}

export type TLoginBody = v.InferOutput<typeof LoginBodySchema>;

export const ChangePasswordBodySchema = v.object({
    currentPassword: v.string(),
    newPassword: PasswordSchema,
});

export class ChangePasswordBody extends ValibotSchema(ChangePasswordBodySchema) {}

export type TChangePasswordBody = v.InferOutput<typeof ChangePasswordBodySchema>;
