import type { Context } from "hono";
import {
    FarmIdQuery,
    FarmNameBody,
    IdParam,
    ProvisionUserBody,
    RequiredFarmIdQuery,
    ResetUserPasswordBody,
    SetUserActiveBody,
} from "@bk/shared";
import { Success } from "../../lib/response/success.response.js";
import { AdminService } from "./admin.service.js";

export class AdminController {
    constructor(private readonly admin: AdminService) {}

    // GET /api/v1/admin/farms
    async listFarms(c: Context) {
        const farms = await this.admin.listFarms();
        return Success.Ok(c, farms);
    }

    // POST /api/v1/admin/farms
    async createFarm(c: Context) {
        const body = await c.req.json();
        const data = FarmNameBody.create(body);
        const farm = await this.admin.createFarm(data.name);
        return Success.Created(c, farm);
    }

    // GET /api/v1/admin/users
    async listUsers(c: Context) {
        const query = FarmIdQuery.create(c.req.query());
        const users = await this.admin.listUsers(query.farmId);
        return Success.Ok(c, users);
    }

    // POST /api/v1/admin/users
    async provisionUser(c: Context) {
        const body = await c.req.json();
        const data = ProvisionUserBody.create(body);
        const user = await this.admin.provisionUser(data);
        return Success.Created(c, user);
    }

    // PATCH /api/v1/admin/users/:id/active
    async setUserActive(c: Context) {
        const { id } = IdParam.create(c.req.param());
        const body = await c.req.json();
        const data = SetUserActiveBody.create(body);
        const user = await this.admin.setUserActive(id, data.isActive);
        return Success.Ok(c, user);
    }

    // PATCH /api/v1/admin/users/:id/password
    async resetUserPassword(c: Context) {
        const { id } = IdParam.create(c.req.param());
        const body = await c.req.json();
        const data = ResetUserPasswordBody.create(body);
        await this.admin.resetUserPassword(id, data.password);
        return Success.NoContent(c);
    }

    // GET /api/v1/admin/operators
    async listOperators(c: Context) {
        const query = RequiredFarmIdQuery.create(c.req.query());
        const operators = await this.admin.listOperators(query.farmId);
        return Success.Ok(c, operators);
    }
}
