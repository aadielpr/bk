import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { ApiErrorSchema, ApiSuccessSchema } from "@bk/shared";
import * as v from "valibot";
import { errorHandler } from "../src/middleware/error-handler.js";
import { Err } from "../src/lib/response/err.response.js";
import { Success } from "../src/lib/response/success.response.js";

const app = new Hono();
app.onError(errorHandler);
app.get("/success", (c) => {
    return Success.Ok(c, { id: 1 }, { access: "jwt" });
});
app.get("/error", () => {
    throw Err.Conflict("Username is already taken");
});

describe("API response envelopes", () => {
    test("returns success data and access token in the shared shape", async () => {
        const response = await app.request("/success");
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(v.safeParse(ApiSuccessSchema, body).success).toBe(true);
        expect(body).toEqual({
            ok: true,
            statusCode: 200,
            message: "Success",
            data: { id: 1 },
            token: { access: "jwt" },
        });
    });

    test("formats thrown HTTP errors through the shared error shape", async () => {
        const response = await app.request("/error");
        const body = await response.json();

        expect(response.status).toBe(409);
        expect(v.safeParse(ApiErrorSchema, body).success).toBe(true);
        expect(body).toMatchObject({
            ok: false,
            statusCode: 409,
            message: "Username is already taken",
            validation: null,
            detail: null,
        });
        expect(body.timestamp).toBeString();
    });
});
