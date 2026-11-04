import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import * as v from "valibot";
import { Slog } from "../utils/slog.js";
import { Err, HttpError } from "../lib/response/err.response.js";

const logger = Slog.New("error-handler");

export function errorHandler(error: Error, c: Context) {
    if (error instanceof HttpError) {
        logger.warn("HTTP error", {
            statusCode: error.statusCode,
            message: error.message,
            path: c.req.path,
            method: c.req.method,
        });
        const response = error.toResponse();
        return c.json(response, error.statusCode);
    }

    if (error instanceof HTTPException) {
        const response = new HttpError(error.status, error.message).toResponse();
        return c.json(response, error.status);
    }

    if (error instanceof SyntaxError) {
        logger.warn("Invalid JSON body", { path: c.req.path, method: c.req.method });
        const response = Err.BadRequest("Invalid JSON body").toResponse();
        return c.json(response, 400);
    }

    if (error instanceof v.ValiError) {
        const { root, nested } = v.flatten(error.issues);
        const validation: Record<string, string[]> = {
            ...nested,
            ...(root ? { _root: root } : {}),
        };

        logger.warn("Valibot validation error", {
            validation,
            path: c.req.path,
            method: c.req.method,
        });

        const response = Err.BadRequest("Invalid data", validation).toResponse();
        return c.json(response, 400);
    }

    logger.error("Unhandled error", {
        error: error.message,
        stack: error.stack,
        path: c.req.path,
        method: c.req.method,
    });

    const isDev = process.env.NODE_ENV === "development";
    const response = Err.InternalServerError(isDev ? (error.stack ?? null) : null).toResponse();
    return c.json(response, 500);
}
