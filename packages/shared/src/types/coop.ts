import * as v from "valibot";

export const CoopSchema = v.object({
    id: v.number(),
    farmId: v.number(),
    farmName: v.nullable(v.string()),
    name: v.string(),
    operatorIds: v.array(v.number()),
});

export type Coop = v.InferOutput<typeof CoopSchema>;

export const CoopNameRequestSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Nama kandang wajib diisi")),
});

export const OperatorAssignmentRequestSchema = v.object({
    operatorIds: v.array(v.number()),
});
