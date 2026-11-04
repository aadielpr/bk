import * as v from "valibot";

const EnvSchema = v.object({
    DATABASE_URL: v.pipe(v.string(), v.url()),
    JWT_SECRET: v.pipe(v.string(), v.minLength(1)),
    REDIS_URL: v.optional(v.pipe(v.string(), v.url())),
    PORT: v.optional(
        v.pipe(v.string(), v.transform(Number), v.integer(), v.minValue(0, "Invalid PORT")),
    ),
    JWT_EXPIRES_IN: v.optional(v.string()),
    SUPER_ADMIN_USERNAME: v.optional(v.string()),
    SUPER_ADMIN_PASSWORD: v.optional(v.string()),
});

const parsed = v.safeParse(EnvSchema, process.env);
if (!parsed.success) {
    const details = parsed.issues
        .map((i) => `  - ${i.path?.map((p) => p.key).join(".") ?? "env"}: ${i.message}`)
        .join("\n");
    throw new Error(`Invalid environment:\n${details}`);
}

export const config = {
    port: parsed.output.PORT ?? 3000,
    databaseUrl: parsed.output.DATABASE_URL,
    redisUrl: parsed.output.REDIS_URL,
    jwtSecret: parsed.output.JWT_SECRET,
    jwtExpiresIn: parsed.output.JWT_EXPIRES_IN ?? "12h",
    superAdminUsername: parsed.output.SUPER_ADMIN_USERNAME ?? "",
    superAdminPassword: parsed.output.SUPER_ADMIN_PASSWORD ?? "",
};
