import type { Context } from "hono";
import type { ApiPagination, ApiSuccessResponse, ApiToken } from "@bk/shared";

export class Success {
    static Ok<T>(c: Context, data: T, token?: ApiToken) {
        const response: ApiSuccessResponse<T> = {
            ok: true,
            statusCode: 200,
            message: "Success",
            data,
            ...(token && { token }),
        };
        return c.json(response, 200);
    }

    static Created<T>(c: Context, data: T, token?: ApiToken) {
        const response: ApiSuccessResponse<T> = {
            ok: true,
            statusCode: 201,
            message: "Created",
            data,
            ...(token && { token }),
        };
        return c.json(response, 201);
    }

    static Paginated<T>(c: Context, data: T[], pagination: ApiPagination, token?: ApiToken) {
        const response: ApiSuccessResponse<T[]> = {
            ok: true,
            statusCode: 200,
            message: "Success",
            data,
            pagination,
            ...(token && { token }),
        };
        return c.json(response, 200);
    }

    static NoContent(c: Context) {
        const response: ApiSuccessResponse<null> = {
            ok: true,
            statusCode: 200,
            message: "No Content",
            data: null,
        };
        return c.json(response, 200);
    }
}
