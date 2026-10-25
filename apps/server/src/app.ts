import express from "express";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.routes.js";
import { adminRouter } from "./routes/admin.routes.js";
import { coopRouter } from "./routes/coop.routes.js";

export function createApp() {
  const app = express();

  app.use(express.json());

  app.use("/api/auth", authRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/coops", coopRouter);

  // JSON error handler (bad JSON bodies, unexpected failures)
  app.use(
    (
      err: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      res.status(500).json({ error: "Terjadi kesalahan di server" });
    },
  );

  return app;
}
