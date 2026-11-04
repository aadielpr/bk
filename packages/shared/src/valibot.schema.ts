import * as v from "valibot";

export function ValibotSchema<T extends v.GenericSchema>(schema: T) {
    return class {
        static create(input: unknown): v.InferOutput<T> {
            const data = v.parse(schema, input);
            return data;
        }
    };
}
