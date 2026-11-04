import type { Context } from "hono";
import { CoopNameBody, IdParam, OperatorAssignmentBody } from "@bk/shared";
import { Success } from "../../lib/response/success.response.js";
import type { AuthEnv } from "../auth/auth.middleware.js";
import { CoopService } from "./coop.service.js";

export class CoopController {
    constructor(private readonly coops: CoopService) {}

    // GET /api/v1/coops
    async list(c: Context<AuthEnv>) {
        const coops = await this.coops.listForUser(c.get("user"));
        return Success.Ok(c, coops);
    }

    // GET /api/v1/coops/operators
    async listOperators(c: Context<AuthEnv>) {
        const operators = await this.coops.listOperators(c.get("user").farmId!);
        return Success.Ok(c, operators);
    }

    // POST /api/v1/coops
    async create(c: Context<AuthEnv>) {
        const body = await c.req.json();
        const data = CoopNameBody.create(body);
        const coop = await this.coops.createCoop(data.name, c.get("user").farmId!);
        return Success.Created(c, coop);
    }

    // PATCH /api/v1/coops/:id
    async rename(c: Context<AuthEnv>) {
        const { id } = IdParam.create(c.req.param());
        const user = c.get("user");
        const body = await c.req.json();
        const data = CoopNameBody.create(body);
        const coop = await this.coops.renameCoop(id, user.farmId!, data.name);
        return Success.Ok(c, coop);
    }

    // PUT /api/v1/coops/:id/operators
    async assignOperators(c: Context<AuthEnv>) {
        const { id } = IdParam.create(c.req.param());
        const user = c.get("user");
        const body = await c.req.json();
        const data = OperatorAssignmentBody.create(body);
        const coop = await this.coops.assignOperators(id, user.farmId!, data.operatorIds);
        return Success.Ok(c, coop);
    }
}
