import { config } from "./config.js";
import { DatabaseClient } from "./lib/drizzle/client.js";
import { JwtService } from "./lib/jwt/jwt.service.js";
import { Server } from "./server.js";
import { Slog } from "./utils/slog.js";
import { createAuthMiddleware } from "./modules/auth/auth.middleware.js";
import { AuthController } from "./modules/auth/auth.controller.js";
import { createAuthRouter } from "./modules/auth/auth.router.js";
import { AuthService } from "./modules/auth/auth.service.js";
import { AdminController } from "./modules/admin/admin.controller.js";
import { createAdminRouter } from "./modules/admin/admin.router.js";
import { AdminService } from "./modules/admin/admin.service.js";
import { CoopController } from "./modules/coop/coop.controller.js";
import { createCoopRouter } from "./modules/coop/coop.router.js";
import { CoopRepository } from "./modules/coop/coop.repository.js";
import { CoopService } from "./modules/coop/coop.service.js";
import { FarmRepository } from "./modules/farm/farm.repository.js";
import { UserRepository } from "./modules/user/user.repository.js";

const log = Slog.New("main");

export async function bootstrap(): Promise<Server> {
    try {
        log.info("Starting application");

        const databaseClient = new DatabaseClient(config.databaseUrl).init().connect();
        const jwtService = new JwtService(config.jwtSecret, config.jwtExpiresIn);

        const userRepository = new UserRepository(databaseClient.db);
        const farmRepository = new FarmRepository(databaseClient.db);
        const coopRepository = new CoopRepository(databaseClient.db);

        const authMiddleware = createAuthMiddleware(userRepository, jwtService);
        const authService = new AuthService(userRepository, farmRepository, jwtService);
        const adminService = new AdminService(farmRepository, userRepository);
        const coopService = new CoopService(coopRepository, userRepository, farmRepository);

        const authController = new AuthController(authService);
        const adminController = new AdminController(adminService);
        const coopController = new CoopController(coopService);

        const server = new Server({
            authRouter: createAuthRouter(authController, authMiddleware),
            adminRouter: createAdminRouter(adminController, authMiddleware),
            coopRouter: createCoopRouter(coopController, authMiddleware),
            port: config.port,
            logger: log,
        });

        server.start();

        const shutdown = async (signal: string) => {
            log.info("Shutting down", { signal });
            await server.close();
            await databaseClient.close();
            process.exit(0);
        };

        process.on("SIGINT", () => void shutdown("SIGINT"));
        process.on("SIGTERM", () => void shutdown("SIGTERM"));

        return server;
    } catch (error) {
        log.error("Failed to start application", {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        process.exit(1);
    }
}

if (import.meta.main) void bootstrap();
