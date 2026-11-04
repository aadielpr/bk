import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { Slog } from "./utils/slog.js";
import { Success } from "./lib/response/success.response.js";
import { Err } from "./lib/response/err.response.js";
import { errorHandler } from "./middleware/error-handler.js";

export type Router = Hono<any, any, any>;

type ServerDependencies = {
    authRouter: Router;
    adminRouter: Router;
    coopRouter: Router;
    port: number;
    logger: Slog;
};

export class Server {
    private readonly app = new Hono();
    private readonly port: number;
    private readonly logger: Slog;
    private listener?: ReturnType<typeof Bun.serve>;

    constructor(deps: ServerDependencies) {
        this.port = deps.port;
        this.logger = deps.logger;

        this.setupMiddleware();
        this.setupRoutes(deps);
    }

    private setupMiddleware(): void {
        this.app.onError(errorHandler);
        this.app.use("*", honoLogger());
        this.app.use("*", secureHeaders());
        this.app.use(
            "*",
            cors({
                origin: "*",
                allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
                allowHeaders: ["Content-Type", "Authorization"],
                exposeHeaders: ["Content-Length"],
                maxAge: 86400,
            }),
        );
    }

    private setupRoutes(deps: ServerDependencies): void {
        const api = new Hono();

        api.get("/health", (c) => {
            return Success.Ok(c, {
                status: "healthy",
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
            });
        });

        api.route("/auth", deps.authRouter);
        api.route("/admin", deps.adminRouter);
        api.route("/coops", deps.coopRouter);

        this.app.route("/api/v1", api);

        this.app.get("/", (c) => c.json({ name: "bk-farm", version: "1.0.0", docs: "/api/v1" }));

        this.app.notFound((c) => c.json(Err.NotFound("Not Found").toResponse(), 404));
    }

    start(): ReturnType<typeof Bun.serve> {
        this.listener = Bun.serve({
            port: this.port,
            fetch: this.app.fetch.bind(this.app),
        });
        this.logger.info("Server started", { port: this.port });
        return this.listener;
    }

    async close(): Promise<void> {
        if (!this.listener) return;
        await this.listener.stop(true);
        this.listener = undefined;
    }

    getApp(): Hono {
        return this.app;
    }
}
