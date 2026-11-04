import * as v from "valibot";
import { ValibotSchema } from "../valibot.schema.js";

export const CoopSchema = v.object({
    id: v.number(),
    farmId: v.number(),
    farmName: v.nullable(v.string()),
    name: v.string(),
    operatorIds: v.array(v.number()),
});

export type Coop = v.InferOutput<typeof CoopSchema>;

export const CoopNameBodySchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Coop name is required")),
});

export class CoopNameBody extends ValibotSchema(CoopNameBodySchema) {}

export type TCoopNameBody = v.InferOutput<typeof CoopNameBodySchema>;

export const OperatorAssignmentBodySchema = v.object({
    operatorIds: v.array(v.number()),
});

export class OperatorAssignmentBody extends ValibotSchema(OperatorAssignmentBodySchema) {}

export type TOperatorAssignmentBody = v.InferOutput<typeof OperatorAssignmentBodySchema>;
