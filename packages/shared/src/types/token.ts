import * as v from "valibot";
import { RoleSchema } from "./role.js";

// Claims we put inside the JWT. The token also carries iat/exp and its own
// sub string form, added by the signing library itself.
export const TokenPayloadSchema = v.object({
    userId: v.number(),
    role: RoleSchema,
});

export type TokenPayload = v.InferOutput<typeof TokenPayloadSchema>;
