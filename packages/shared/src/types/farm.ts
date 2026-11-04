import * as v from "valibot";
import { ValibotSchema } from "../valibot.schema.js";

export const FarmSchema = v.object({
    id: v.number(),
    name: v.string(),
});

export type Farm = v.InferOutput<typeof FarmSchema>;

export const FarmNameBodySchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Farm name is required")),
});

export class FarmNameBody extends ValibotSchema(FarmNameBodySchema) {}

export type TFarmNameBody = v.InferOutput<typeof FarmNameBodySchema>;

export const FarmIdSchema = v.pipe(
    v.string(),
    v.transform(Number),
    v.integer("Invalid farmId"),
    v.minValue(1, "Invalid farmId"),
);

export const FarmIdQuerySchema = v.object({
    farmId: v.optional(FarmIdSchema),
});

export class FarmIdQuery extends ValibotSchema(FarmIdQuerySchema) {}

export type TFarmIdQuery = v.InferOutput<typeof FarmIdQuerySchema>;

export const RequiredFarmIdQuerySchema = v.object({
    farmId: FarmIdSchema,
});

export class RequiredFarmIdQuery extends ValibotSchema(RequiredFarmIdQuerySchema) {}

export type TRequiredFarmIdQuery = v.InferOutput<typeof RequiredFarmIdQuerySchema>;
