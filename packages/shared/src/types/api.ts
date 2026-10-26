import * as v from "valibot";

export const ApiErrorSchema = v.object({
    error: v.string(),
});

export type ApiError = v.InferOutput<typeof ApiErrorSchema>;
