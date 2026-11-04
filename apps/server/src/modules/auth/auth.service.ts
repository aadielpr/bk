import type { TChangePasswordBody, TLoginBody } from "@bk/shared";
import { UserDto } from "@bk/shared";
import { Err } from "../../lib/response/err.response.js";
import type { JwtService } from "../../lib/jwt/jwt.service.js";
import type { FarmRepository } from "../farm/farm.repository.js";
import type { UserRepository } from "../user/user.repository.js";

export class AuthService {
    constructor(
        private readonly users: UserRepository,
        private readonly farms: FarmRepository,
        private readonly jwt: JwtService,
    ) {}

    async login(input: TLoginBody) {
        const user = await this.users.findByUsername(input.username);
        if (!user) {
            throw Err.Unauthorized("Invalid username or password");
        }

        const valid = await Bun.password.verify(input.password, user.passwordHash);
        if (!valid) throw Err.Unauthorized("Invalid username or password");

        const farm = user.farmId ? await this.farms.findById(user.farmId) : undefined;
        const authUser = UserDto.create({
            id: user.id,
            username: user.username,
            role: user.role,
            farmId: user.farmId,
            farmName: farm?.name ?? null,
            isActive: user.dAt === null,
        });
        const token = this.jwt.sign({ userId: user.id, role: user.role });

        return { token, user: authUser };
    }

    async currentUser(userId: number) {
        const user = await this.users.findById(userId);
        if (!user) throw Err.Unauthorized("Account not found");

        const farm = user.farmId ? await this.farms.findById(user.farmId) : undefined;
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

    async changePassword(userId: number, input: TChangePasswordBody): Promise<void> {
        const user = await this.users.findById(userId);
        if (!user) throw Err.Unauthorized("Account not found");

        const valid = await Bun.password.verify(input.currentPassword, user.passwordHash);
        if (!valid) throw Err.BadRequest("Current password is incorrect");

        await this.users.updatePassword(userId, await Bun.password.hash(input.newPassword));
    }
}
