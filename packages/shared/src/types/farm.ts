import * as v from "valibot";

export const FarmSchema = v.object({
    id: v.number(),
    name: v.string(),
});

export type Farm = v.InferOutput<typeof FarmSchema>;

export const FarmNameRequestSchema = v.object({
    name: v.pipe(v.string(), v.minLength(1, "Nama farm wajib diisi")),
});
