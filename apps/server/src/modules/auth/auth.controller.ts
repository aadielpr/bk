import type { Context } from "hono";
import { ChangePasswordBody, LoginBody } from "@bk/shared";
import { Success } from "../../lib/response/success.response.js";
import type { AuthEnv } from "./auth.middleware.js";
import { AuthService } from "./auth.service.js";

export class AuthController {
    constructor(private readonly auth: AuthService) {}

    // POST /api/v1/auth/login
    async login(c: Context<AuthEnv>) {
        const body = await c.req.json();
        const data = LoginBody.create(body);
        const result = await this.auth.login(data);
        return Success.Ok(c, result.user, { access: result.token });
    }

    // GET /api/v1/auth/me
    async currentUser(c: Context<AuthEnv>) {
        const user = await this.auth.currentUser(c.get("user").id);
        return Success.Ok(c, user);
    }

    // POST /api/v1/auth/change-password
    async changePassword(c: Context<AuthEnv>) {
        const body = await c.req.json();
        const data = ChangePasswordBody.create(body);
        await this.auth.changePassword(c.get("user").id, data);
        return Success.NoContent(c);
    }
}
