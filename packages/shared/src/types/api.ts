import * as v from "valibot";
import { ValibotSchema } from "../valibot.schema.js";

export const ApiTokenSchema = v.object({
    access: v.string(),
});

export type ApiToken = v.InferOutput<typeof ApiTokenSchema>;

export const ApiPaginationSchema = v.object({
    totalItems: v.number(),
    skip: v.number(),
    limit: v.number(),
    totalPages: v.number(),
});

export type ApiPagination = v.InferOutput<typeof ApiPaginationSchema>;

export const ApiSuccessSchema = v.object({
    ok: v.literal(true),
    statusCode: v.number(),
    message: v.string(),
    data: v.unknown(),
    pagination: v.optional(ApiPaginationSchema),
    token: v.optional(ApiTokenSchema),
});

export type ApiSuccess = v.InferOutput<typeof ApiSuccessSchema>;
export type ApiSuccessResponse<TData> = Omit<ApiSuccess, "data"> & { data: TData };

export const ApiErrorSchema = v.object({
    ok: v.literal(false),
    statusCode: v.number(),
    message: v.string(),
    timestamp: v.string(),
    validation: v.nullable(v.record(v.string(), v.array(v.string()))),
    detail: v.nullable(v.unknown()),
});

export type ApiError = v.InferOutput<typeof ApiErrorSchema>;

const IdSchema = v.pipe(
    v.string(),
    v.transform(Number),
    v.integer("Invalid ID"),
    v.minValue(1, "Invalid ID"),
);

export const IdParamSchema = v.object({ id: IdSchema });

export class IdParam extends ValibotSchema(IdParamSchema) {}
