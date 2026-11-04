import type { ApiError } from "@bk/shared";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class HttpError extends Error {
    constructor(
        readonly statusCode: ContentfulStatusCode,
        message: string,
        readonly validation: ApiError["validation"] = null,
        readonly detail: unknown = null,
    ) {
        super(message);
        this.name = "HttpError";
    }

    toResponse(): ApiError {
        return {
            ok: false,
            statusCode: this.statusCode,
            message: this.message,
            timestamp: new Date().toISOString(),
            validation: this.validation,
            detail: this.detail,
        };
    }
}

export class Err {
    static BadRequest(message: string, validation?: ApiError["validation"]): HttpError {
        return new HttpError(400, message, validation ?? null);
    }

    static Unauthorized(message = "Unauthorized"): HttpError {
        return new HttpError(401, message);
    }

    static Forbidden(message = "Forbidden"): HttpError {
        return new HttpError(403, message);
    }

    static NotFound(message = "Not Found"): HttpError {
        return new HttpError(404, message);
    }

    static Conflict(message = "Conflict"): HttpError {
        return new HttpError(409, message);
    }

    static InternalServerError(detail?: unknown): HttpError {
        return new HttpError(500, "Internal Server Error", null, detail);
    }
}
