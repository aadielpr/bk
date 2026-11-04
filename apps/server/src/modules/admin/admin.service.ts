import { Role, UserDto, type TProvisionUserBody } from "@bk/shared";
import { Err } from "../../lib/response/err.response.js";
import type { FarmRepository } from "../farm/farm.repository.js";
import type { UserRepository } from "../user/user.repository.js";

export class AdminService {
    constructor(
        private readonly farms: FarmRepository,
        private readonly users: UserRepository,
    ) {}

    async listFarms() {
        const rows = await this.farms.list();
        const data = rows.map(({ id, name }) => ({ id, name }));
        return data;
    }

    async createFarm(name: string) {
        const farm = await this.farms.create(name);
        return { id: farm.id, name: farm.name };
    }

    async listUsers(farmId?: number) {
        const rows = await this.users.listWithFarm(farmId);
        const data = rows.map(({ user, farm }) =>
            UserDto.create({
                id: user.id,
                username: user.username,
                role: user.role,
                farmId: user.farmId,
                farmName: farm?.name ?? null,
                isActive: user.dAt === null,
            }),
        );
        return data;
    }

    async provisionUser(input: TProvisionUserBody) {
        const farm = await this.farms.findById(input.farmId);
        if (!farm) throw Err.BadRequest("Farm not found");

        const existing = await this.users.findByUsername(input.username);
        if (existing) throw Err.Conflict("Username is already taken");

        const user = await this.users.create(
            input.username,
            await Bun.password.hash(input.password),
            input.role,
            input.farmId,
        );
        const authUser = UserDto.create({
            id: user.id,
            username: user.username,
            role: user.role,
            farmId: user.farmId,
            farmName: farm?.name ?? null,
            isActive: user.dAt === null,
        });
        return authUser;
    }

    async setUserActive(id: number, isActive: boolean) {
        const user = await this.users.findById(id);
        if (!user || user.role === Role.SUPER_ADMIN) {
            throw Err.NotFound("User not found");
        }

        if (isActive) {
            const live = await this.users.findByUsername(user.username);
            if (live && live.id !== id) throw Err.Conflict("Username is already taken");
        }

        const updated = await this.users.updateActive(id, isActive);
        const farm = updated.farmId ? await this.farms.findById(updated.farmId) : undefined;
        const authUser = UserDto.create({
            id: updated.id,
            username: updated.username,
            role: updated.role,
            farmId: updated.farmId,
            farmName: farm?.name ?? null,
            isActive: updated.dAt === null,
        });
        return authUser;
    }

    async resetUserPassword(id: number, password: string): Promise<void> {
        const user = await this.users.findById(id);
        if (!user || user.role === Role.SUPER_ADMIN) {
            throw Err.NotFound("User not found");
        }

        await this.users.updatePassword(id, await Bun.password.hash(password));
    }

    async listOperators(farmId: number) {
        const operators = await this.users.listOperatorsByFarm(farmId);
        return operators;
    }
}
