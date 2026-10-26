import express from "express";
import { authRouter } from "./routes/auth.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { coopRouter } from "./routes/coop.routes.js";

export function createApp() {
    const app = express();

    app.use(express.json());

    app.use("/api/auth", authRouter);
    app.use("/api/admin", adminRouter);
    app.use("/api/coops", coopRouter);

    app.use(
        (
            err: unknown,
            _req: express.Request,
            res: express.Response,
            _next: express.NextFunction,
        ) => {
            console.error(err);
            res.status(500).json({ error: "Internal Server Error" });
        },
    );

    return app;
}
