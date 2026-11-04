import { Role, type Coop, type TOperatorAssignmentBody } from "@bk/shared";
import { Err } from "../../lib/response/err.response.js";
import type { AuthenticatedUser } from "../auth/auth.middleware.js";
import type { FarmRepository } from "../farm/farm.repository.js";
import type { UserRepository } from "../user/user.repository.js";
import type { CoopRepository } from "./coop.repository.js";

export class CoopService {
    constructor(
        private readonly coops: CoopRepository,
        private readonly users: UserRepository,
        private readonly farms: FarmRepository,
    ) {}

    async listForUser(user: AuthenticatedUser): Promise<Coop[]> {
        if (user.role === Role.SUPER_ADMIN) {
            const all = await this.coops.listAll();
            return all;
        }

        if (user.role === Role.OWNER) {
            const byFarm = await this.coops.listByFarmIds([user.farmId!]);
            return byFarm;
        }

        const coopIds = await this.coops.assignedCoopIds(user.id);
        const assigned = await this.coops.listByCoopIds(coopIds);
        return assigned;
    }

    async listOperators(farmId: number) {
        const operators = await this.users.listOperatorsByFarm(farmId);
        return operators;
    }

    async createCoop(name: string, farmId: number): Promise<Coop> {
        const coop = await this.coops.create(name, farmId);
        const farmName = await this.farmName(farmId);
        return {
            id: coop.id,
            farmId: coop.farmId,
            farmName,
            name: coop.name,
            operatorIds: [],
        };
    }

    async renameCoop(id: number, farmId: number, name: string): Promise<Coop> {
        const coop = await this.findCoopInFarm(id, farmId);
        const updated = await this.coops.updateName(coop.id, name);
        if (!updated) throw Err.NotFound("Coop not found");

        const farmName = await this.farmName(farmId);
        return {
            id: updated.id,
            farmId: updated.farmId,
            farmName,
            name: updated.name,
            operatorIds: [],
        };
    }

    async assignOperators(
        id: number,
        farmId: number,
        operatorIds: TOperatorAssignmentBody["operatorIds"],
    ): Promise<Coop> {
        const coop = await this.findCoopInFarm(id, farmId);

        const operators = await this.users.findByIds(operatorIds);
        const invalid = operators.some(
            (operator) =>
                operator.dAt !== null ||
                operator.role !== Role.OPERATOR ||
                operator.farmId !== farmId,
        );
        if (invalid || operators.length !== operatorIds.length) {
            throw Err.BadRequest("Operator not found on this farm");
        }

        await this.coops.replaceOperators(coop.id, operatorIds);

        const farmName = await this.farmName(farmId);
        return {
            id: coop.id,
            farmId: coop.farmId,
            farmName,
            name: coop.name,
            operatorIds,
        };
    }

    private async findCoopInFarm(id: number, farmId: number) {
        const coop = await this.coops.findLiveCoopInFarm(id, farmId);
        if (!coop) throw Err.NotFound("Coop not found");
        return coop;
    }

    private async farmName(farmId: number): Promise<string | null> {
        const farm = await this.farms.findById(farmId);
        return farm?.name ?? null;
    }
}
